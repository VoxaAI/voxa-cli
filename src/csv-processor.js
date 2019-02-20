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
  invocations: 'INVOCATION_NAMES',
  skillGeneral: 'SKILL_GENERAL_INFORMATION',
  skillLocaleSettings: 'SKILL_LOCALE_INFORMATION-',
  skillEnvironmentsInformation: 'SKILL_ENVIRONMENTS_INFORMATION',
  views: 'VIEWS_FILE',
};

const processors = {
  skillEnvironmentsInformation: worksheet => getRows(worksheet).then((rows) => {
    const skillEnvironmentsInformation = _(rows).map((row) => {
      const info = _.pick(row, ['key', 'value', 'environment', 'platform']);

      return info;
    })
    .uniq()
    .value();
    return { skillEnvironmentsInformation };
  }),
  skillGeneral: worksheet => getRows(worksheet).then((rows) => {
    const manifest = { manifestVersion: '1.0' };
    let skillGeneralInfo = _(rows).map((row) => {
      const info = _.pick(row, ['option', 'value', 'key']);

      if (_.toNumber(info.value)) info.value = _.toNumber(info.value);
      if (info.value === 'TRUE') info.value = true;
      if (info.value === 'FALSE') info.value = false;
      return info;
    })
    .uniq()
    .map(info => {
      if (_.includes(info.key, 'distributionCountries')) info.value = info.value.split(',');
      if (_.includes(info.key, 'apis.custom.interfaces[]')) {
        const key = info.key.replace('apis.custom.interfaces[].type.', '');
        info.key = 'apis.custom.interfaces';
        const previouseArr = _.get(manifest, info.key, []);

        if (info.value) previouseArr.push({ type: key});

        info.value = previouseArr;
      }

      if (_.includes(info.key, 'events.subscriptions[]')) {
        const key = info.key.replace('events.subscriptions[].eventName.', '');
        info.key = 'events.subscriptions';
        const previouseArr = _.get(manifest, info.key, []);

        if (info.value) previouseArr.push({ eventName: key});

        info.value = previouseArr;
      }

      if (_.includes(info.key, 'permissions[]')) {
        const key = info.key.replace('permissions[].name.', '');
        info.key = 'permissions';
        const previouseArr = _.get(manifest, info.key, []);

        if (info.value) previouseArr.push({ name: key});

        info.value = previouseArr;
      }
      _.set(manifest, info.key, info.value);

    })
    .value();
    // others[otherName] = rows;
    return { manifest };
  }),
  skillLocaleSettings: worksheet => getRows(worksheet).then((rows) => {
    const locale = worksheet.title.replace(placeholders.skillLocaleSettings, '');
    const manifest = {};
    let skillLocaleSetup = _(rows)
    .map((row) => {
      const info = _.pick(row, ['option', 'value', 'key']);

      if (info.value === 'TRUE') info.value = true;
      if (info.value === 'FALSE') info.value = false;
      return info;
    })
    .uniq()
    .map(info => {
      let key = info.key.replace('locales.', `locales.${locale}.`);

      if (_.includes(key, 'keywords')) info.value = info.value.split(',');
      if (_.includes(key, '[]')) {
        key = key.replace('[]', '');
        const previouseArr = _.get(manifest, key, []);
        previouseArr.push(info.value);
        info.value = previouseArr;
      }

      _.set(manifest, key, info.value);
    })
    .value();
    return { manifest };
  }),
  invocations: worksheet => getRows(worksheet).then((rows) => {
    let invocations = _(rows).map((row) => {
      const info = _.pick(row, ['invocationname', 'environment']);

      // previousIntent = _.isEmpty(info.intent) ? previousIntent : info.intent;
      // info.intent = previousIntent;

      return info;
    })
    .uniq()
    .value();
    // others[otherName] = rows;
    return { invocations };
  }),
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
    const canfulfillintents = [];
    let previousIntent;
    let intentsDraft = _(rows).map((row) => {
      const info = _.pick(row, ['intent', 'slottype', 'slotname', 'environment', 'platformslot', 'platformintent', 'events', 'canfulfillintent']);

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

      const intent = key;
      const platformIntent = _(value)
      .filter('platformintent')
      .map('platformintent')
      .map(_.trim)
      .compact()
      .value();

      const slots = _(value)
      .filter('slotname')
      .map(slot => ({
         name: _.camelCase(slot.slotname),
         type: slot.slottype,
         platform: _.chain(slot.platformslot).split(', ').map(_.trim).compact().value() }))
      .compact()
      .uniq()
      .value();

      const environment = _.chain(value)
      .filter('environment')
      .map('environment')
      .uniq()
      .first()
      .split(',')
      .replace(' ', '')
      .value();

      const events = _(value)
      .filter('events')
      .map('events')
      .map(event => (event.split(', ')))
      .map(events => (events.map(event=>({name: _.trim(event)}))))
      .compact()
      .uniq()
      .value();

      const canfulfillintent = _.chain(value)
      .filter('canfulfillintent')
      .map('canfulfillintent')
      .map(fulfillIntent => _.includes(['true', 'yes'], _.toLower(fulfillIntent)))
      .compact()
      .head()
      .value();

      if (canfulfillintent) {
        canfulfillintents.push(intent);
      }

      const result = !_.isEmpty(slots) ? { intent, slots, platformIntent } : { intent, platformIntent };

      result.events = _.head(events)
      result.environment = environment;
      intents.push(result);
    }));

    // console.log(JSON.stringify({ intents }, null, 2));

    if (!_.isEmpty(canfulfillintents)) {
      return { intents, others: { canfulfillIntent: canfulfillintents } };
    }
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
  views: worksheet => getRows(worksheet).then((rows) => {
    const locale = worksheet.title.split('@')[1] || 'en';

    const rawViews = _.chain(rows)
    .reduce((acc, next) => {
      if (_.isEmpty(next.path)) return acc;

      if (next.path.includes('.say') || next.path.includes('.reprompt') ||  next.path.includes('.tell') ||  next.path.includes('.ask')) {
        acc[next.path] = acc[next.path] || [];
        console.log('path', next.path, acc[next.path]);
        acc[next.path].push(sanitizeView(next.value));
      }

      if (next.path.includes('.dialogFlowSuggestions') || next.path.includes('facebookSuggestionChips') || next.path.includes('dialogflowSuggestions')) {
        acc[next.path] = next.value.split('\n').map(sanitizeView);
      }

      if (_.isEmpty(acc[next.path])) {
        acc[next.path] = sanitizeView(next.value);
      }

      return acc;
    }, {})
    .toPairs()
    .reduce((acc, next) => {
      _.set(acc, next[0], next[1]);
      return acc;
    }, {})
    .value();

    const views = {};

    _.set(views, `${locale}.translation`, rawViews);
    return { views };
  }),
};

function sanitizeView (text) {
  return text
    .replace(/’/g, '\'')
    .replace(/“/g, '"')
    .replace(/”/g, '"')
    .replace(/&/g, 'and')
    ;
}

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
  return getWorksheets(spreadsheetId, creds)
  .then((info) => {
    const title = info.title;
    let validLocales = null;

    switch(type) {
      case 'dialogFlow':
        validLocales = DialogFlowSchema.VALID_LOCALES;
        break;
      case 'cortana':
        validLocales = CortanaSchema.VALID_LOCALES;
        break;
      default:
        validLocales = AlexaSchema.VALID_LOCALES;
    }

    locale = validLocales.find(loc => _.includes(title, loc) || _.includes(title, _.toLower(loc)));
    locale = locale || validLocales[0];
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

    return worksheets;
  })
  .then(sheets => Promise.all(sheets.map(sheet => processors[sheet.type](sheet.worksheet))))
  .then((values) => {
    const result = {};

    _.each(values, (value) => {
      _.merge(result, value);
    });
    result.invocations = result.invocations || [{ invocationname: 'invocation name', environment: 'staging' }]
    let schema;
    if (type === 'dialogFlow') schema = new DialogFlowSchema(result);
    if (type === 'cortana') schema = new CortanaSchema(result);
    if (!schema) schema = new AlexaSchema(result)

    schema.locale = locale;
    return schema;
  });
}
