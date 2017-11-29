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
const DEFAULT_LEAST_UTTERANCES = 5;
const UTTERANCES_VALID_CHARACTERS = /^[a-zA-Z0-9.üß€äö€ {}'_-]+$/;
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
      aError.add({ message: 'Sample Utterances are missing', type: AlexaError.ERROR_TYPE.MISSING_SAMPLE_UTTERANCES })
    }

    if (_.isEmpty(intents)) {
      aError.add({ message: 'Intent Schema is missing', type: AlexaError.ERROR_TYPE.MISSING_INTENT_SCHEMA })
    }

    if (_.isEmpty(intentBuiltInKeys)) {
      aError.add({ message: 'Built in intents are not present', type: AlexaError.ERROR_TYPE.MISSING_BUILTIN_INTENT })
    }

    if (!_.includes(intentsKey, 'AMAZON.HelpIntent')) {
      aError.add({ message: 'Intent schema should have HelpIntent', type: AlexaError.ERROR_TYPE.REQUIRED_INTENT })
    }

    if (!_.includes(intentsKey, 'AMAZON.CancelIntent')) {
      aError.add({ message: 'Intent schema should have CancelIntent', type: AlexaError.ERROR_TYPE.REQUIRED_INTENT })
    }

    if (!_.includes(intentsKey, 'AMAZON.StopIntent')) {
      aError.add({ message: 'Intent schema should have StopIntent', type: AlexaError.ERROR_TYPE.REQUIRED_INTENT })
    }

    // Make sure we have utterances for builtin intents
    intentBuiltInKeys.map((intentBuiltKey) => {
      assert.isNotEmpty(uttr[intentBuiltKey], `Intent ${intentBuiltKey} have utterances`);
      if ((!_.includes(intentBuiltKey, 'OnlyIntent')) &&  uttr[intentBuiltKey].length <= this.leastUtterances) {
        aError.add({ message: `Intent ${intentBuiltKey} have only ${uttr[intentBuiltKey].length} intents, it should have at least ${this.leastUtterances}`, type: AlexaError.ERROR_TYPE.MINIMUM_UTERANCES_ON_INTENT })
      }
    })

    _.map(uttr, (uttV, uttK) => {
      uttV.map((u) => {
        if (!UTTERANCES_VALID_CHARACTERS.test(u)) {
          aError.add({ message: `Utterance ${uttK} ${u} has invalid characters`, type: AlexaError.ERROR_TYPE.UTTERANCE_HAS_INVALID_CHARACTERS })
        }
      })
    });

    _.map(slots, (slotV, slotK) => {
      _.map(slotV, (_slot, slot) => {
        if (!UTTERANCES_VALID_CHARACTERS.test(slot)) {
          aError.add({ message: `Slot ${slotK} ${slot} has invalid characters`, type: AlexaError.ERROR_TYPE.SLOT_HAS_INVALID_CHARACTERS })
        }
      })
    });

    // Make sure there is no difference between utterances and the intents
    if (!_.isEmpty(_.difference(uttrBuiltInKeys, intentBuiltInKeys))) {
      aError.add({ message: `utterances ${_.difference(uttrBuiltInKeys, intentBuiltInKeys)} is not defined in your model`, type: AlexaError.ERROR_TYPE.UTTERANCES_NOT_DEFINED_SCHEMA })
    }

    if (!_.isEmpty(_.difference(intentBuiltInKeys, uttrBuiltInKeys))) {
      aError.add({ message: `intents ${_.difference(intentBuiltInKeys, uttrBuiltInKeys)} doesn't have any utterances`, type: AlexaError.ERROR_TYPE.INTENTS_WITHOUT_UTTERANCES })
    }

    if (!_.isEmpty(_.difference(intentSlotsBuiltInWithoutAmazon, slotsBuiltIn))) {
      aError.add({ message: `slots defined in your intent schema without a list type ${_.difference(intentBuiltInKeys, uttrBuiltInKeys)}`, type: AlexaError.ERROR_TYPE.MISSING_LIST_TYPE })
    }

    if (!_.isEmpty(_.difference(slotsBuiltIn, intentSlotsBuiltInWithoutAmazon))) {
      aError.add({ message: `slots that are not included in your intent schema  ${_.difference(slotsBuiltIn, intentSlotsBuiltInWithoutAmazon)}. Make sure to use this slots in your intent if not remove it!`, type: AlexaError.ERROR_TYPE.SLOTS_NOT_DEFINED_SCHEMA })
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
              aError.add({ message: `${uttrKey} ${u} - is including slots that are not defined in intent.json`, type: AlexaError.ERROR_TYPE.UTTERANCE_USING_SLOT_NOT_SCHEMA })
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
              aError.add({ message: `Intent ${uttrKey} should not have duplicate slots ${key} in ${u} utterance`, type: AlexaError.ERROR_TYPE.UTTERANCE_USING_DUPLICATE_SLOT })
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
          aError.add({ message: `Sample Utterance should be unique, ${duplicateUtterances} is duplicate in ${uttrKey} and ${otherKey}`, type: AlexaError.ERROR_TYPE.UTTERANCE_SHOULD_UNIQUE })
        }
      });
    });

    uttrKeys.map((uttrKey) => {
      const utteranceList = uttr[uttrKey];
      utteranceList.map(u => {
        this.constructor.CONNECTING_WORDS.map(conWord => {
          if (u.indexOf(conWord) === 0) {
            aError.add({ message: `'${uttrKey}' '${u}' - contains connecting words at the begining - ${conWord}`, type: AlexaError.ERROR_TYPE.UTTERANCE_CONNECTING_AT_BEGINNING })
          }
        })
      });
    });

    if (_.flattenDeep(uttrValues).join('\n').length >= 200000) {
      aError.add({ message: 'Sample utterances doesn\'t exceed limit of 200K characters', type: AlexaError.ERROR_TYPE.UTTERANCE_EXCEED_LIMIT })
    }

    if (_.flattenDeep(slotsValuesBuiltIn).length >= 50000) {
      aError.add({ message: 'Custom slot values doesn\'t exceed limit of 50K values', type: AlexaError.ERROR_TYPE.SLOT_EXCEED_LIMIT })
    }

    console.log('Errors found ', aError.errors.length);
    aError.print();
  }

  build(pathSpeech, unique, invocationName) {

    if (!this.locale) return new Error('Please define a locale. eg. this.locale = \'en-US\'');
    const customPathLocale = unique ? pathSpeech : path.join(pathSpeech, this.locale);
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
        intent.slots = intent.slots || [];
        intent.slots = intent.slots.map(slot => {
          slot.samples = [];
          return slot;
        });
        return _.pick(intent, ['name', 'samples', 'slots']);
      });

      const types = _.map(this.slots, (value, key) => {
        const values = _.keys(value).map((v) => ({ name: { value: v }}));
        const name = key;
        return ({ values, name });
      });

      invocationName.map((name) => {
        const interactionModel = { languageModel: { invocationName: name, intents, types }};

        const promise = fs.outputFile(path.join(customPathLocale, `${_.kebabCase(name)}-model.json`),  JSON.stringify({ interactionModel }, null, 2), { flag: 'w' });
        promises.push(promise);

      })


      const promiseSkillBuilder = fs.outputFile(path.join(customPathLocale, 'skillBuilder.json'),  JSON.stringify({ intents, types }, null, 2), { flag: 'w' });
      promises.push(promiseSkillBuilder);
    }

    return Promise.all(promises);
  }

  buildSynonym(pathSynonym, unique) {
    const customPathSynonym = unique ? pathSynonym : path.join(pathSynonym, this.locale);
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
