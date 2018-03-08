'use strict';

const _ = require('lodash');
const GoogleSpreadsheet = require('google-spreadsheet');
//const creds = require('./client_secret.json');
const Promise = require('bluebird');
const AlexaSchema = require('./alexa-schema');
const DialogFlowSchema = require('./dialog-flow-schema');
const CortanaSchema = require('./cortana-schema');


// Create a document object using the ID of the spreadsheet - obtained from its URL.

const placeholders = {
  slots: 'LIST_OF_',
  intents: 'INTENT',
  utterances: 'UTTERANCES_',
};

const processors = {
  slots: worksheet => getRows(worksheet).then((rows) => {
    const slotName = _.includes(worksheet.title, 'AMAZON.') ? worksheet.title.replace('LIST_OF_', '') : worksheet.title;
    const slotNameSanitize = _.trim(_.toLower(slotName).replace(/_/g, '').replace(/ /g, ''));

    let previousSynonym = '';
    const slotValues = {};
    const slotsDraft = _(rows).map((row) => {
      const info = _.pick(row, [slotNameSanitize, 'synonym']);
      previousSynonym = _.isEmpty(info.synonym) ? previousSynonym : info.synonym;
      info.synonym = _.trim(previousSynonym);
      info.value = _.trim(info[slotNameSanitize]);
      if (_.isEmpty(info.value)) return null;
      return info;
    })
    .compact()
    .uniq()
    .value();

    _.each(slotsDraft, (slotDraft) => {
      const key = slotDraft.value;
      const value = slotDraft.synonym;
      slotValues[key] = value;
    });

    const slots = {};
    slots[slotName] = slotValues;

    // console.log(JSON.stringify({ slots }, null, 2));

    return { slots };
  }),
  intents: worksheet => getRows(worksheet).then((rows) => {
    let previousIntent;
    let intentsDraft = _(rows).map((row) => {
      const info = _.pick(row, ['intent', 'slottype', 'slotname']);

      previousIntent = _.isEmpty(info.intent) ? previousIntent : info.intent;
      info.intent = previousIntent;

      return info;
    })
    .uniq()
    .value();

    intentsDraft = _.groupBy(intentsDraft, 'intent');

    // console.log('intentsDraft', intentsDraft)
    const intents = [];
    _.each(intentsDraft, ((value, key) => {
      // console.log(value)

      const intent = key;
      const slots = _(value)
      .filter('slotname')
      .map(slot => ({ name: _.camelCase(slot.slotname), type: slot.slottype }))
      .compact()
      .uniq()
      .value();

      const result = !_.isEmpty(slots) ? { intent, slots } : { intent };

      intents.push(result);
    }));

    // console.log(JSON.stringify({ intents }, null, 2));

    return { intents };
  }),
  utterances: worksheet => getRows(worksheet).then((rows) => {
    const keys = _.keys(rows[0]).filter(row => _.includes(row, 'intent'));
    const headers = _.pick(rows[0], keys);

    rows = _.drop(rows);

    const utterances = {};

    _.each(headers, (headValue) => {
      utterances[headValue] = [];
    });

    _.each(rows, (row) => {
      _.each(headers, (headValue, headKey) => {
        let value = _.replace(_.trim(row[headKey]), /{([\s\S]+?)}/g, (match) => `{${_.camelCase(match)}}`);
        value = value.split(' ').map(v => _.includes(v, '{') ? v : _.toLower(v)).join(' ');
        if (!_.isEmpty(value)) {
          utterances[headValue].push(value);
        }
      });
    });

    _.each(headers, (headValue) => {
      utterances[headValue] = _.uniq(utterances[headValue]);
    });

    // console.log(JSON.stringify({ utterances }, null, 2));

    return { utterances };
  }),
  other: worksheet => getRows(worksheet).then((rows) => {
    const firstRow = _.head(rows);
    const headers = _.chain(firstRow).omit(['_xml', 'id', 'app:edited', '_links']).filter(_.isString).values().value();

    console.log('headers', headers);

    rows = _(rows)
    .drop()
    .map((row) => {
      const newRow = {};

      _.each(headers, (headValue) => {
        const headerToSearch = _.lowerCase(headValue).replace(/ /g, '');
        newRow[_.camelCase(headValue)] = row[headerToSearch];
      });
      return newRow;
    })
    .value();

    const last = _.last(rows);
    let justStringAttr = _.map(last, (value, key) => _.isString(value) ? key : false).filter(_.isString);

    const otherName = worksheet.title;
    //const customRows = rows
    //.map(row => _.omit(row, ['_xml', 'id', 'app:edited', '_links']))
    //.map(row => _.pick(row, justStringAttr))
    ;

    const others = {};
    others[otherName] = rows;
    return { others };
  }),
};

function getWorksheets(spreadsheetId, creds) {
  const doc = new GoogleSpreadsheet(spreadsheetId);
  return new Promise((resolve, reject) => doc.useServiceAccountAuth(creds, (error) => {
    if (error) return reject(error);
    return doc.getInfo((err, info) => {
      if (err) return reject(err);
      return resolve(info);
    });
  }));
}

function getRows(worksheet, offset) {
  if (!_.isNumber(offset)) {
    offset = 1;
  }
  // offset = offset || 1;
  return new Promise((resolve, reject) => worksheet.getRows({ offset }, (err, rows) => {
    if (err) return reject(err);
    return resolve(rows);
  }));
}

module.exports = (spreadsheetId, creds, othersToDownload, type) => {
  let locale;
  let otherCSV = {};
  console.time('worksheetDownload');
  return getWorksheets(spreadsheetId, creds)
  .then((info) => {
    const title = info.title;
    locale = AlexaSchema.VALID_LOCALES.find(loc => _.includes(title, loc) || _.includes(title, _.toLower(loc)));
    locale = locale || AlexaSchema.VALID_LOCALES[0];
    return info.worksheets;
  })
  .then((worksheets) => {
    worksheets = worksheets
    .map((worksheet) => {
      let type = _.map(placeholders, (value, key) => {
        const result = worksheet.title.indexOf(value) >= 0 ? key : null;
        return result;
      }).find(result => !_.isEmpty(result));

      type = !type &&  _.includes(othersToDownload, worksheet.title) ? 'other' : type;
      return { type, worksheet };
    })
    .filter(worksheet => worksheet.type);
    console.timeEnd('worksheetDownload');
    // console.log('worksheets', worksheets);
    console.time('worksheetProcess');
    return worksheets;
  })
  .then(sheets => Promise.all(sheets.map(sheet => processors[sheet.type](sheet.worksheet))))
  .then((values) => {
    const result = {};

    _.each(values, (value) => {
      _.merge(result, value);
    });
    console.timeEnd('worksheetProcess');
    let schema = new AlexaSchema(result);
    if (type === 'dialogFlow') schema = new DialogFlowSchema(result);
    if (type === 'cortana') schema = new CortanaSchema(result);

    schema.locale = locale;
    return schema;
  });
}
