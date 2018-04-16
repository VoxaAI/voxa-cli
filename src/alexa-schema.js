'use strict';

const chai = require('chai');
const path = require('path');
const _ = require('lodash');
const Promise = require('bluebird');
const fs = Promise.promisifyAll(require('fs-extra'));
const AlexaError = require('./error');

const expect = chai.expect;
const assert = chai.assert;
const DEFAULT_LEAST_UTTERANCES = 5;
const UTTERANCES_VALID_CHARACTERS = /^[a-zA-Z0-9.üß€äö€ {}'_-]+$/;
class alexaSchema {
  constructor(options) {
  _.assign(this, options);
  }

  static get VALID_LOCALES() {
    return ['en-US', 'en-GB', 'en-CA', 'en-AU', 'en-IN', 'de-DE', 'jp-JP'];
  }

  static get CONNECTING_WORDS() {
    return ['by ','from ', 'in ', 'using ', 'with ', 'to ', 'about ', 'for ', 'if', 'whether ', 'and ', 'that ', 'thats ', 'that\'s '];
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
    const slotsBuiltInButAmazon = _.chain(slots).keys().filter((slot) => !_.includes(slot, 'AMAZON.')).value();
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
      if ((!_.includes(intentBuiltKey, 'OnlyIntent')) &&  uttr[intentBuiltKey].length < this.leastUtterances) {
        aError.add({ message: `Intent ${intentBuiltKey} have only ${uttr[intentBuiltKey].length} utterances, it should have at least ${this.leastUtterances}`, type: AlexaError.ERROR_TYPE.MINIMUM_UTERANCES_ON_INTENT })
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

    if (!_.isEmpty(_.difference(intentSlotsBuiltInWithoutAmazon, slotsBuiltInButAmazon))) {
      aError.add({ message: `slots defined in your intent schema without a list type ${_.difference(intentBuiltInKeys, uttrBuiltInKeys)}`, type: AlexaError.ERROR_TYPE.MISSING_LIST_TYPE })
    }

    if (!_.isEmpty(_.difference(slotsBuiltInButAmazon, intentSlotsBuiltInWithoutAmazon))) {
      aError.add({ message: `slots that are not included in your intent schema  ${_.difference(slotsBuiltInButAmazon, intentSlotsBuiltInWithoutAmazon)}. Make sure to use this slots in your intent if not remove it!`, type: AlexaError.ERROR_TYPE.SLOTS_NOT_DEFINED_SCHEMA })
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

  build(customPathLocale, localManifest) {
    if (!this.locale) return new Error('Please define a locale. eg. this.locale = \'en-US\'');
    // const customPathLocale = unique ? pathSpeech : path.join(pathSpeech);
    const promises = [];

    //console.log('this', JSON.stringify(this, null, 2));
    if (this.intents && this.utterances) {
      // console.log('this.invocations', this.invocations);
      this.invocations.map((invocation) => {
        const intents = this.intents
        .filter(intent => !intent.environment || _.includes(intent.environment, invocation.environment))
        .filter(intent => _.isEmpty(intent.platformIntent) || _.includes(intent.platformIntent, 'alexa'))
        .map(intent => {
          // console.log('intent', intent.intent, intent.environment);
          intent.name = intent.intent;
          intent.samples = this.utterances[intent.name];
          intent.slots = intent.slots || [];
          intent.slots = _.chain(intent.slots)
          .map(slot => {
            slot.samples = [];
            if (_.isEmpty(slot.platform) || _.includes(slot.platform, 'alexa')) {
              return _.pick(slot, ['name', 'type', 'samples']);
            }
            return null;
          })
          .compact()
          .value();
          return _.pick(intent, ['name', 'samples', 'slots']);
        });

        const slotsUsed = _.chain(intents)
          .map('slots')
          .flattenDeep()
          .map('type')
          .uniq()
          .value();

        const types = _.chain(this.slots)
          .map((value, key) => {
            const values = _.chain(value)
            .invertBy()
            .map((synonyms, slotKey) => {

              if (!slotKey) {
                return _.map(synonyms, x => ({ name: { value: x }}))
              }

              return { name: { value: slotKey, synonyms }};
            })
            .flattenDeep()
            .value();

            const name = key;
            return ({ values, name });
        })
        .filter((item) => _.includes(slotsUsed, item.name) || _.includes(item.name, 'AMAZON.') )
        .value();

        const name = invocation.invocationname;
        const interactionModel = { languageModel: { invocationName: name, intents, types }};

        const promise = fs.outputFile(path.join(customPathLocale, 'alexa', this.locale,`${_.kebabCase(name)}-${invocation.environment}-model.json`),  JSON.stringify({ interactionModel }, null, 2), { flag: 'w' });
        promises.push(promise);

      });
    }

    if (this.manifest && this.skillEnvironmentsInformation) {
      if (localManifest) {
        const customEnvironment = 'local';
        const customManifest = { };
        _.map(localManifest, (value, key) => {
          customManifest[key] = value;
          this.skillEnvironmentsInformation.push({ environment: customEnvironment,  key, value });
        });
      }

      _.chain(this.skillEnvironmentsInformation)
      .map('environment')
      .uniq()
      .map(skillEnvironments => {
        const manifest = _.clone(this.manifest);

        _.chain(this.skillEnvironmentsInformation)
        .filter({ environment: skillEnvironments})
        .map(item => {
          _.set(manifest, item.key, item.value)
        })
        .value();
        const promise = fs.outputFile(path.join(customPathLocale, 'alexa', `${_.kebabCase(skillEnvironments)}-skill.json`),  JSON.stringify({ manifest }, null, 2), { flag: 'w' });
        promises.push(promise);
        return skillEnvironments;
      })
      .value();
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

  buildContent(pathContent) {
    const customPathContent = path.join(pathContent, this.locale);
    if (!this.locale) return new Error('Please define a locale. eg. this.locale = \'en-US\'');
    const promises = [];
    // slotsDraft
    //console.log('synonym', this.slots);

    _.map(this.others, (value, key) => {
      const str = JSON.stringify(value, null, 2);
      const promise = fs.outputFile(path.join(customPathContent, `${_.kebabCase(key)}.json`), str, { flag: 'w' });
      promises.push(promise);
    });

    return Promise.all(promises);
  }
}

module.exports = alexaSchema;
