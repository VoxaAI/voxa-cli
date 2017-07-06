'use strict';

const _ = require('lodash');
const Promise = require('bluebird');
const processor = require('./csv-processor');

module.exports = function(options) {
  const spreadsheets = _.get(options, 'spreadsheets');
  const speechPath = _.get(options, 'speechPath');
  const synonymPath = _.get(options, 'synonymPath');
  const auth = _.get(options, 'auth');
  const validate = _.get(options, 'validate');

  const spreadsheetPromises = spreadsheets.map((spreadsheet) => processor(spreadsheet, auth));
  let resultAlexa;

  return Promise.all(spreadsheetPromises)
  .then(_resultAlexa => {
    resultAlexa = _resultAlexa;
    return resultAlexa;
  })
  .then(() => resultAlexa.map((alexa) => {
    if (validate) {
      console.time('validate');
      alexa.validate();
      console.timeEnd('validate');
    }
    return alexa.build(speechPath);
  }))
  .then(() => resultAlexa.map((alexa) => {
    let placeHolderPromise = Promise.resolve();
    if (synonymPath) {
      console.time('synonym');
      placeHolderPromise = alexa.buildSynonym(synonymPath);
      console.timeEnd('synonym');
    }

    return placeHolderPromise;
  }))
  .then(() => console.log('script finished'))
  ;
};
