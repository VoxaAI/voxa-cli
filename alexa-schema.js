'use strict';

const chai = require('chai');
const path = require('path');
const _ = require('lodash');
const Promise = require('bluebird');
const fs = Promise.promisifyAll(require('fs-extra'));

const expect = chai.expect;
const assert = chai.assert;
const DEFAULT_LEAST_UTTERANCES = 10;
class alexaSchema {
  constructor(options) {
  _.assign(this, options);
  }

  set static leastUtterances(least) {
    this.leastUtterances = least;
  }

  get static leastUtterances() {
    return this.leastUtterances || DEFAULT_LEAST_UTTERANCES;
  }

  get generateInteractionModel() {
    return this;
  }

  validate() {
    // console.log('this', this);
    const uttr = _.get(this, 'utterances');
    const uttrKeys = _.keys(uttr);
    const uttrValues = _.values(uttr);
    const uttrBuiltIn = _.omitBy(uttr, (uValue, uKey) => _.includes(uKey, 'AMAZON.'));
    const uttrBuiltInKeys = _.keys(uttrBuiltIn);
    // console.log('builtin', uttrBuiltInKeys);

    const intents = _.get(this, 'intents');
    const intentsKey = _.map(intents, 'intent');

    const amazonIntent = intentsKey.filter((intentName) => _.includes(intentName, 'AMAZON.'));
    const intentBuiltIn = _.omitBy(intents, (intent) => _.includes(intent.intent, 'AMAZON.'));
    const intentSlotsBuiltIn = _(intentBuiltIn).map('slots').compact().flattenDeep().map('type').value();
    const intentSlotsBuiltInWithoutAmazon = intentSlotsBuiltIn.filter((slot) => !_.includes(slot, 'AMAZON.'));
    const haveSlotsOnIntentSchema = !_.isEmpty(intentSlotsBuiltInWithoutAmazon);

    const intentBuiltInKeys = _.map(intentBuiltIn, 'intent');

    // console.log('intentsKey', intentsKey, amazonIntent, intentBuiltInKeys, uttrKeys)
    // console.log('uttrKeys', uttrKeys);

    const slots = _.get(this, 'slots');
    const slotsBuiltIn = _.keys(slots);
    const slotsValuesBuiltIn = _.values(slots).map(slot => _.keys(slot));
    const haveSlotsOnType = !_.isEmpty(slotsBuiltIn);

    assert.isNotEmpty(uttr, 'Sample Utterances Present');
    assert.isNotEmpty(intents, 'Intent Schema Present');

    // you don't  have builtin intents
    assert.isNotEmpty(intentBuiltInKeys, 'Built in intents are Present');

    // Make sure to add this intent on the schema
    assert.include(intentsKey, 'AMAZON.HelpIntent', 'Intent schema have HelpIntent');
    assert.include(intentsKey, 'AMAZON.CancelIntent', 'Intent schema have CancelIntent');
    assert.include(intentsKey, 'AMAZON.StopIntent', 'Intent schema have StopIntent');

    // Make sure we have utterances for builtin intents
    intentBuiltInKeys.map((intentBuiltKey) => {
      assert.isNotEmpty(uttr[intentBuiltKey], `Intent ${intentBuiltKey} have utterances`);
      assert.isAtLeast(uttr[intentBuiltKey], 10, `Intent ${intentBuiltKey} have at least 10`);
    })

    console.log('slotsIntents', _.difference(slotsBuiltIn, intentSlotsBuiltInWithoutAmazon));
    // Make sure there is no difference between utterances and the intents
    expect(_.difference(uttrBuiltInKeys, intentBuiltInKeys)).to.be.empty;

    // Make sure there is no difference between intens and utterances
    expect(_.difference(intentBuiltInKeys, uttrBuiltInKeys)).to.be.empty;

    // make sure there is no difference between between the slots on the intent shema and the list of slots
    expect(_.difference(intentSlotsBuiltInWithoutAmazon, slotsBuiltIn)).to.be.empty;

    // make sure there is no difference between between the list of slots and slots on the intent shema (extra slots not defined on the intent schema)
    //TODO: Uncomment expect(_.difference(slotsBuiltIn, intentSlotsBuiltInWithoutAmazon)).to.be.empty;

    if (haveSlotsOnIntentSchema) {
      _.templateSettings.interpolate = /{([\s\S]+?)}/g;
      uttrBuiltInKeys.map((uttrKey) => {
        const variables = {};
        const intentFound = _.find(intents, ['intent', uttrKey])
        let intentSlotFound = _.get(intentFound, 'slots', []);
        intentSlotFound = _.map(intentSlotFound, 'name');

        _.each(intentSlotFound, (slotName) => {
          variables[slotName] = `${slotName}`;
        });

        const utterancesForKey = uttr[uttrKey];
        _.each(utterancesForKey, (u) => {
          let didCompile = true;
          let result = '';
          try {
            const compiled = _.template(u);
            result = compiled(variables);
          }
          catch (ex) {
            didCompile = false;
          }
          finally {
            assert.isTrue(didCompile, `${u} - have same slots as defined in intent.json`);
          }
        });
      });
    }

    assert.isBelow(_.flattenDeep(uttrValues).join('\n').length, 200000, 'Sample utterances doesn\'t exceed limit of 200K characters')
    assert.isBelow(_.flattenDeep(slotsValuesBuiltIn).length, 50000, 'Custom slot values doesn\'t exceed limit of 50K values')
  }

  build(pathSpeech) {
    // console.log(this);
    pathSpeech = '/Users/rainadmin/Documents/rain_agency/safeco/csv-buildschema/sp';
    const promises = [];

    // slotsDraft
    _.each(this.slots, (value, key) => {
      const str = _.keys(value).join('\n');
      const promise = fs.outputFile(path.join(pathSpeech, 'slots', `${key}.txt`), str, { flag: 'w' });
      promises.push(promise);
    });

    if (this.intents) {
      const schema = _.pick(this, ['intents']);
      const str = JSON.stringify(schema, null, 2);

      const promise = fs.outputFile(path.join(pathSpeech, 'intent.json'), str, { flag: 'w' });
      promises.push(promise);
    }

    if (this.utterances) {
      const utterances = this.utterances;
      let str = [];

      _.each(utterances, (values, key) => {
        _.each(values, (value) => {
          str.push(`${key} ${value}`);
        });
      });

      str = str.join('\n');

      const promise = fs.outputFile(path.join(pathSpeech, 'utterances.txt'), str, { flag: 'w' });
      promises.push(promise);
    }

    return Promise.all(promises);
  }
}

module.exports = alexaSchema;
