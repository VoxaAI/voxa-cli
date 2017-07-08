'use strict';

const chai = require('chai');
const path = require('path');
const _ = require('lodash');
const Promise = require('bluebird');
const fs = Promise.promisifyAll(require('fs-extra'));
const PrettyError = require('pretty-error');
const AlexaError = require('./error');

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
    const aError = new AlexaError();
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

    if (_.isEmpty(uttr)) {
      aError.add({ message: 'Sample Utterances Present', type: alexaError.ERROR_TYPE.MISSING_SAMPLE_UTTERANCES })
    }

    if (_.isEmpty(intents)) {
      aError.add({ message: 'Intent Schema Present', type: alexaError.ERROR_TYPE.MISSING_INTENT_SCHEMA })
    }

    if (_.isEmpty(intentBuiltInKeys)) {
      aError.add({ message: 'Built in intents are Present', type: alexaError.ERROR_TYPE.MISSING_BUILTIN_INTENT })
    }

    if (!_.includes(intentsKey, 'AMAZON.HelpIntent')) {
      aError.add({ message: 'Intent schema have HelpIntent', type: alexaError.ERROR_TYPE.REQUIRED_INTENT })
    }

    if (!_.includes(intentsKey, 'AMAZON.CancelIntent')) {
      aError.add({ message: 'Intent schema have CancelIntent', type: alexaError.ERROR_TYPE.REQUIRED_INTENT })
    }

    if (!_.includes(intentsKey, 'AMAZON.StopIntent')) {
      aError.add({ message: 'Intent schema have StopIntent', type: alexaError.ERROR_TYPE.REQUIRED_INTENT })
    }

    // Make sure we have utterances for builtin intents
    intentBuiltInKeys.map((intentBuiltKey) => {
      assert.isNotEmpty(uttr[intentBuiltKey], `Intent ${intentBuiltKey} have utterances`);
      if ((!_.includes(intentBuiltKey, 'OnlyIntent')) &&  uttr[intentBuiltKey].length >= this.leastUtterances) {
        aError.add({ message: `Intent ${intentBuiltKey} have at least ${this.leastUtterances}`, type: alexaError.ERROR_TYPE.MINIMUM_UTERANCES_ON_INTENT })
      }
    })

    _.map(uttr, (uttV, uttK) => {
      uttV.map((u) => {
        if (u.match(UTTERANCES_VALID_CHARACTERS)) {
          aError.add({ message: `Utterance ${uttK} ${u} has invalid valid characters`, type: alexaError.ERROR_TYPE.UTTERANCE_HAS_INVALID_CHARACTERS })
        }
      }
    });

    _.map(slots, (slotV, slotK) => {
      _.map(slotV, (_slot, slot) => {
        if (slot.match(UTTERANCES_VALID_CHARACTERS)) {
          aError.add({ message: `Slot ${slotK} ${slot} has valid characters`, type: alexaError.ERROR_TYPE.SLOT_HAS_INVALID_CHARACTERS })
        }
      }
    });

    // Make sure there is no difference between utterances and the intents
    if (!_.isEmpty(_.difference(uttrBuiltInKeys, intentBuiltInKeys))) {
      aError.add({ message: `utterances ${_.difference(uttrBuiltInKeys, intentBuiltInKeys)} not defined in your model`, type: alexaError.ERROR_TYPE.UTTERANCES_NOT_DEFINED_SCHEMA })
    }

    if (!_.isEmpty(_.difference(intentBuiltInKeys, uttrBuiltInKeys))) {
      aError.add({ message: `intents ${_.difference(intentBuiltInKeys, uttrBuiltInKeys)} utterances`, type: alexaError.ERROR_TYPE.INTENTS_WITHOUT_UTTERANCES })
    }




    if (!_.isEmpty(_.difference(intentSlotsBuiltInWithoutAmazon, slotsBuiltIn))) {
      aError.add({ message: `slots defined in you intent schema without a list type ${_.difference(intentBuiltInKeys, uttrBuiltInKeys)}`, type: alexaError.ERROR_TYPE.MISSING_LIST_TYPE })
    }

    if (!_.isEmpty(_.difference(slotsBuiltIn, intentSlotsBuiltInWithoutAmazon))) {
      aError.add({ message: `extra slots that are not included in your intent schema ${_.difference(slotsBuiltIn, intentSlotsBuiltInWithoutAmazon)}`, type: alexaError.ERROR_TYPE.SLOTS_NOT_DEFINED_SCHEMA })
    }

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
            if (!didCompile) {
              aError.add({ message: `${uttrKey} ${u} - have same slots as defined in intent.json`, type: alexaError.ERROR_TYPE.UTTERANCE_USING_SLOT_NOT_SCHEMA })
            }
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
            if (value >= 2) {
              aError.add({ message: `Intent ${uttrKey} should not have duplicate slots ${key} in ${u} utterance`, type: alexaError.ERROR_TYPE.UTTERANCE_USING_DUPLICATE_SLOT })
            }
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

        if (hasDuplicateUtterances) {
          aError.add({ message: `Sample Utterance should be unique, ${duplicateUtterances} is duplicate in ${uttrKey} and ${otherKey}`, type: alexaError.ERROR_TYPE.UTTERANCE_SHOULD_UNIQUE })
        }
      });
    });

    uttrKeys.map((uttrKey) => {
      const utteranceList = uttr[uttrKey];
      utteranceList.map(u => {
        this.constructor.CONNECTING_WORDS.map(conWord => {
          if (u.indexOf(conWord) === 0) {
            aError.add({ message: `${uttrKey} ${u} contains connecting words at the begining - ${conWord}`, type: alexaError.ERROR_TYPE.UTTERANCE_CONNECTING_AT_BEGINNING })
          }
        }
      });
    });

    if (_.flattenDeep(uttrValues).join('\n').length >= 200000) {
      aError.add({ message: 'Sample utterances doesn\'t exceed limit of 200K characters', type: alexaError.ERROR_TYPE.UTTERANCE_EXCEED_LIMIT })
    }

    if (_.flattenDeep(slotsValuesBuiltIn).length >= 50000) {
      aError.add({ message: 'Custom slot values doesn\'t exceed limit of 50K values', type: alexaError.ERROR_TYPE.SLOT_EXCEED_LIMIT })
    }

    console.log('Erros found ', aError.errors.length);
    aError.print();
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
