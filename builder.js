'use strict';

const _ = require('lodash');
const Promise = require('bluebird');
const processor = require('./src/csv-processor');
const path = require('path');

module.exports = function(options) {
  let invocationName = _.get(options, 'invocationName', []);
  if (_.isString(invocationName)) {
    invocationName = [ invocationName ];
  }

  const rootPath = _.get(options, 'rootPath');
  const spreadsheets = _.get(options, 'spreadsheets' );
  const speechPath = _.get(options, 'speechPath', path.join(rootPath, 'speech-assets'));
  const synonymPath = _.get(options, 'synonymPath', path.join(rootPath, 'synonyms'));
  const auth = _.get(options, 'auth');
  const validate = _.get(options, 'validate', true);
  const build = _.get(options, 'build', true);
  const type = _.get(options, 'type', 'alexa');
  const others = _.get(options, 'content', []);
  const contentPath = _.get(options, 'contentPath', path.join(rootPath, 'content'));

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
      placeHolderPromise = schema.build(speechPath);
    }

    return placeHolderPromise;
  }))
  .then(() => resultAlexa.map((schema) => {
    let placeHolderPromise = Promise.resolve();
    if (synonymPath) {
      console.time('synonym');
      placeHolderPromise = schema.buildSynonym(synonymPath);
      console.timeEnd('synonym');
    }

    return placeHolderPromise;
  }))
  .then(() => resultAlexa.map((schema) => {
    let placeHolderPromise = Promise.resolve();
    if (contentPath) {
      console.time('content');
      placeHolderPromise = schema.buildContent(contentPath);
      console.timeEnd('content');
    }

    return placeHolderPromise;
  }))
  .then(() => console.log('script finished'))
  .then(() => resultAlexa);
  ;
};
