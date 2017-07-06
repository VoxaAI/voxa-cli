'use strict';

const chai = require('chai');
const path = require('path');
const _ = require('lodash');
const Promise = require('bluebird');
const fs = Promise.promisifyAll(require('fs-extra'));
const PrettyError = require('pretty-error');

// instantiate PrettyError, which can then be used to render error objects
const pe = new PrettyError();

const expect = chai.expect;
const assert = chai.assert;
const DEFAULT_LEAST_UTTERANCES = 3;
const UTTERANCES_VALID_CHARACTERS = /^[a-zA-Z0-9.üß€äö€ {}'_-]*$/;
class alexaSchema {
  constructor(options) {
  _.assign(this, options);
  }

  static get VALID_LOCALES() {
    return ['en-US','en-GB', 'de-DE'];
  }

  static get CONNECTING_WORDS() {
    return ['by ','from ', 'in ',  'using ', 'with ', 'to ', 'about ', 'for ', 'if', 'whether ', 'and ', 'that ', 'thats ', 'that\'s ' ];
  }

  set locale(locale) {
    const VALID_LOCALES = this.constructor.VALID_LOCALES;
    if (!_.includes(VALID_LOCALES, locale)) return new Error(`Invalid type ${locale}. It should be one of ${VALID_LOCALES}`);

    this._locale = locale;
  }

  get locale() {
    return this._locale;
  }

  set skillId(id) {
    if (_.isString(id) || _.isEmpty(id)) return new Error(`Invalid skill id  - ${id}.`);

    this._skillId = id;
  }

  get skillId() {
    return this._skillId;
  }

  get type() {
    return this._type;
  }

  set leastUtterances(least) {
    this._leastUtterances = least;
  }

  get leastUtterances() {
    return this._leastUtterances || DEFAULT_LEAST_UTTERANCES;
  }

  get generateInteractionModel() {
    return this;
  }

  validate() {
    pe.start();
    _.templateSettings.interpolate = /{([\s\S]+?)}/g;
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
      if (!_.includes(intentBuiltKey, 'OnlyIntent')) {
        assert.isAtLeast(uttr[intentBuiltKey].length, this.leastUtterances, `Intent ${intentBuiltKey} have at least ${this.leastUtterances}`);
      }
    })

    _.map(uttr, (uttV, uttK) => {
      uttV.map((u) => assert.match(u, UTTERANCES_VALID_CHARACTERS, `Utterance ${uttK} ${u} has valid characters`));
    });

    _.map(slots, (slotV, slotK) => {
      _.map(slotV, (_slot, slot) => assert.match(slot, UTTERANCES_VALID_CHARACTERS, `Slot ${slotK} ${slot} has valid characters`));
    });

    // Make sure there is no difference between utterances and the intents
    assert.isEmpty(_.difference(uttrBuiltInKeys, intentBuiltInKeys), `utterances ${_.difference(uttrBuiltInKeys, intentBuiltInKeys)} not defined in your model`);

    assert.isEmpty(_.difference(intentBuiltInKeys, uttrBuiltInKeys), `intents ${_.difference(intentBuiltInKeys, uttrBuiltInKeys)} utterances`);

    assert.isEmpty(_.difference(intentSlotsBuiltInWithoutAmazon, slotsBuiltIn), `slots defined in you intent schema without a list type ${_.difference(intentBuiltInKeys, uttrBuiltInKeys)}`);

    assert.isEmpty(_.difference(slotsBuiltIn, intentSlotsBuiltInWithoutAmazon), `extra slots that are not included in your intent schema ${_.difference(slotsBuiltIn, intentSlotsBuiltInWithoutAmazon)}`);

    if (haveSlotsOnIntentSchema) {
      uttrKeys.map((uttrKey) => {
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
            assert.isTrue(didCompile, `${uttrKey} ${u} - have same slots as defined in intent.json`);
          }
        });
      });
    }

    if (haveSlotsOnIntentSchema) {
      uttrKeys.map((uttrKey) => {
        const variables = {};
        const intentFound = _.find(intents, ['intent', uttrKey])
        let intentSlotFound = _.get(intentFound, 'slots', []);
        intentSlotFound = _.map(intentSlotFound, 'name').map(name => `{${name}}`);

        const utterancesForKey = uttr[uttrKey];
        _.each(utterancesForKey, (u) => {
          const wordsContainsSlot = u.split(' ').filter(word => _.includes(word, '{'));
          const slotsCount = _.countBy(wordsContainsSlot, (word) => intentSlotFound.find(slot => _.includes(slot, word)));

          _.map(slotsCount, (value, key) => {
            assert.isBelow(value, 2, `Intent ${uttrKey} should not have duplicate slots ${key} in ${u} utterance`);
          });
        });
      });
    }

    uttrKeys.map((uttrKey) => {
      uttrKeys.filter(u => u !== uttrKey).map(otherKey => {
        const utteranceList = uttr[uttrKey];
        const otherList = uttr[otherKey];
        const duplicateUtterances = _.intersection(utteranceList, otherList);
        const hasDuplicateUtterances = !_.isEmpty(duplicateUtterances);

        assert.isFalse(hasDuplicateUtterances, `Sample Utterance should be unique, ${duplicateUtterances} is duplicate in ${uttrKey} and ${otherKey}`);
      });
    });

    uttrKeys.map((uttrKey) => {
      const utteranceList = uttr[uttrKey];
      utteranceList.map(u => {
        this.constructor.CONNECTING_WORDS.map(conWord => assert.notEqual(u.indexOf(conWord), 0, `${uttrKey} ${u} contains connecting words at the begining - ${conWord}`));
      });
    });

    assert.isBelow(_.flattenDeep(uttrValues).join('\n').length, 200000, 'Sample utterances doesn\'t exceed limit of 200K characters')
    assert.isBelow(_.flattenDeep(slotsValuesBuiltIn).length, 50000, 'Custom slot values doesn\'t exceed limit of 50K values')
  }

  build(pathSpeech) {

    if (!this.locale) return new Error('Please define a locale. eg. this.locale = \'en-US\'');
    const customPathLocale = path.join(pathSpeech, this.locale);
    const promises = [];

    // slotsDraft
    _.each(this.slots, (value, key) => {
      const str = _.keys(value).join('\n');
      const promise = fs.outputFile(path.join(customPathLocale, 'slots', `${key}.txt`), str, { flag: 'w' });
      promises.push(promise);
    });

    if (this.intents) {
      const schema = _.pick(this, ['intents']);
      const str = JSON.stringify(schema, null, 2);

      const promise = fs.outputFile(path.join(customPathLocale, 'intent.json'), str, { flag: 'w' });
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

      const promise = fs.outputFile(path.join(customPathLocale, 'utterances.txt'), str, { flag: 'w' });
      promises.push(promise);
    }

    if (this.intents && this.utterances) {
      const intents = this.intents.map(intent => {
        intent.name = intent.intent;
        intent.samples = this.utterances[intent.name];
        return _.pick(intent, ['name', 'samples', 'slots']);
      });

      const types = _.map(this.slots, (value, key) => {
        const values = _.keys(value).map((v) => ({ name: { value: v }}));
        const name = key;
        return ({ values, name });
      });

      const modelDefinition = { intents, types };

      const promise = fs.outputFile(path.join(customPathLocale, 'model.json'),  JSON.stringify({ modelDefinition }, null, 2), { flag: 'w' });
      const promiseSkillBuilder = fs.outputFile(path.join(customPathLocale, 'skillBuilder.json'),  JSON.stringify(modelDefinition, null, 2), { flag: 'w' });
      promises.push(promise);
      promises.push(promiseSkillBuilder);
    }

    return Promise.all(promises);
  }

  buildSynonym(pathSynonym) {
    const customPathSynonym = path.join(pathSynonym, this.locale);
    if (!this.locale) return new Error('Please define a locale. eg. this.locale = \'en-US\'');
    const promises = [];
    // slotsDraft
    //console.log('synonym', this.slots);

    _.map(this.slots, (value, key) => {
      if (_.values(value).find(syn => !_.isEmpty(syn))) {
        const str = JSON.stringify(value, null, 2);
        const promise = fs.outputFile(path.join(customPathSynonym, `${key}.json`), str, { flag: 'w' });
        promises.push(promise);
      }
    });

    return Promise.all(promises);
  }
}

module.exports = alexaSchema;
