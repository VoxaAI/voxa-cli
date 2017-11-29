'use strict';

const _ = require('lodash');
const Promise = require('bluebird');
const processor = require('./src/csv-processor');

module.exports = function(options) {
  let invocationName = _.get(options, 'invocationName', []);
  if (_.isString(invocationName)) {
    invocationName = [ invocationName ];
  }

  const spreadsheets = _.get(options, 'spreadsheets');
  const speechPath = _.get(options, 'speechPath');
  const synonymPath = _.get(options, 'synonymPath');
  const auth = _.get(options, 'auth');
  const validate = _.get(options, 'validate', true);
  const build = _.get(options, 'build', true);
  const type = _.get(options, 'type', 'alexa');
  const others = _.get(options, 'othersToDownload', []);

  const spreadsheetPromises = spreadsheets.map((spreadsheet) => processor(spreadsheet, auth, others, type));
  let resultAlexa;
  const unique = spreadsheets.length === 1;

  return Promise.all(spreadsheetPromises)
  .then(_resultAlexa => {
    resultAlexa = _resultAlexa;
    return resultAlexa;
  })
  .then(() => resultAlexa.map((schema) => {
    let placeHolderPromise = Promise.resolve();

    if (validate) {
      console.time('validate');
      schema.validate();
      console.timeEnd('validate');
    }
    if (build) {
      placeHolderPromise = schema.build(speechPath, unique, invocationName);
    }

    return placeHolderPromise;
  }))
  .then(() => resultAlexa.map((schema) => {
    let placeHolderPromise = Promise.resolve();
    if (synonymPath) {
      console.time('synonym');
      placeHolderPromise = schema.buildSynonym(synonymPath, unique);
      console.timeEnd('synonym');
    }

    return placeHolderPromise;
  }))
  .then(() => console.log('script finished'))
  .then(() => resultAlexa);
  ;
};
