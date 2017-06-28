'use strict';

const _ = require('lodash');
const GoogleSpreadsheet = require('google-spreadsheet');
const creds = require('./client_secret.json');
const Promise = require('bluebird');
const AlexaSchema = require('./alexa-schema');

// Create a document object using the ID of the spreadsheet - obtained from its URL.
const doc = new GoogleSpreadsheet('1CfSegZtXK9DVhPcKiPZ9YXpG8zPHaBV7_W13AmRy0YM');

const placeholders = {
  slots: 'LIST_OF_',
  intents: 'INTENT',
  utterances: 'UTTERANCES_',
};

const processors = {
  slots: worksheet => getRows(worksheet).then((rows) => {
    const slotName = worksheet.title;
    const slotNameSanitize = _.trim(_.lowerCase(slotName).replace(/ /g, ''));

    let previousSynonym = '';
    const slotValues = {};
    const slotsDraft = _(rows).map((row) => {
      const info = _.pick(row, [slotNameSanitize, 'synonym']);
      previousSynonym = _.isEmpty(info.synonym) ? previousSynonym : info.synonym;
      info.synonym = _.trim(previousSynonym);
      info.value = _.trim(info[slotNameSanitize]);
      return info;
    })
    .uniq()
    .value();

    _.each(slotsDraft, (slotDraft) => {
      const key = slotDraft.value;
      const value = slotDraft.synonym;
      slotValues[key] = value;
    });

    // console.log('slotsDraft', slotValues);

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
        const value = _.replace(_.trim(row[headKey]), /{([\s\S]+?)}/g, (match) => `{${_.camelCase(match)}}`);;
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
};

function getWorksheets() {
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
console.time('worksheetDownload');
getWorksheets()
.then(info => info.worksheets)
.then((worksheets) => {
  worksheets = worksheets
  .map((worksheet) => {
    const type = _.map(placeholders, (value, key) => {
      const result = worksheet.title.indexOf(value) >= 0 ? key : null;
      return result;
    }).find(result => !_.isEmpty(result));
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
  const alexa = new AlexaSchema(result);
  console.time('validate');
  alexa.validate();
  console.timeEnd('validate');
  return alexa.build().then();
});
