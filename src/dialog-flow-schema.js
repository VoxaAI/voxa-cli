'use strict';

const chai = require('chai');
const path = require('path');
const _ = require('lodash');
const Promise = require('bluebird');
const fs = Promise.promisifyAll(require('fs-extra'));
const PrettyError = require('pretty-error');
const AlexaError = require('./error');
const uuid = require('uuid/v5');
const dialogFlowBuiltinIntent = require('./dialog-flow-intents');

// instantiate PrettyError, which can then be used to render error objects
const pe = new PrettyError();

const expect = chai.expect;
const assert = chai.assert;
const DEFAULT_LEAST_UTTERANCES = 5;
const UTTERANCES_VALID_CHARACTERS = /^[a-zA-Z0-9.üß€äö€ {}'_-]+$/;
class dialogFlow {
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
    return true;
  }

  build(pathSpeech, unique) {
    if (!this.locale) return new Error('Please define a locale. eg. this.locale = \'en-US\'');
    const customPathLocale = unique ? pathSpeech : path.join(pathSpeech, this.locale);
    const promises = [];
    var tokenRegx = /{([^}]+)}/g;

    const includedIntents = _.filter(this.intents, (intent => _.isEmpty(intent.platformIntent) || _.includes(intent.platformIntent, 'dialogFlow')));
    this.intents = _.map(this.intents, (intent) => {
      intent.intent = intent.intent.replace('AMAZON.', '');
      return intent;
    });

    this.utterances = _.chain(this.utterances)
    .toPairs()
    .map(item => [item[0].replace('AMAZON.', ''), item[1]])
    .fromPairs()
    .value();

    this.invocations.map((invocation) => {
      // slotsDraft
      _.map(this.slots, (value, key) => {
        key = _.kebabCase(key);

        const str = _.chain(value).
        invertBy()
        .map((synonyms, slotKey) => {
          if (!slotKey) {
            return _.map(synonyms, x => ({ value: x, synonyms: [x] }))
          }
          return ({ value: slotKey, synonyms });
        })
        .flattenDeep()
        .value();
        const eachUtterancePromise = fs.outputFile(path.join(customPathLocale, 'dialog-flow', invocation.environment, 'entities', `${key}_entries_en.json`), JSON.stringify(str, null, 2), { flag: 'w' });
        const entityDefinition = {
          name: key,
          isOverridable: true,
          isEnum: false,
          automatedExpansion: false,
        };
        promises.push(fs.outputFile(path.join(customPathLocale, 'dialog-flow', invocation.environment, 'entities', `${key}.json`), JSON.stringify(appendUUIDToString(entityDefinition), null, 2), { flag: 'w' }));
        promises.push(eachUtterancePromise);
      });

      _.map(this.utterances, (value, key) => {
        value = _.chain(value).concat(_.get(dialogFlowBuiltinIntent, key, [])).flattenDeep().uniq().compact().value();
        const intentUttr = _.find(includedIntents, { intent: key });
        if (!intentUttr) return;
        const str = value.map(text => {
          const data = _.chain(text)
          .replace(tokenRegx, function (match, inner) {
            return `|{${inner}}|`;
          })
          .split('|')
          .map(text => {
            const element = {};
            const isATemplate = (_.includes(text, '{') && _.includes(text, '}'));

            const variable = text
            .replace('{', '')
            .replace('}', '');

            const platformSpecificSlots = _.filter(intentUttr.slots, (slot) => (_.isEmpty(slot.platform) || _.includes(slot.platform, 'dialogFlow')));
            const slot = _.find(platformSpecificSlots, { name: variable })

            if (isATemplate && slot) {
              _.set(element, 'meta', `@${_.kebabCase(slot.type)}`);
              _.set(element, 'alias', slot.name);
            }

            if (!_.isEmpty(text)) {
              _.set(element, 'text', text);
              _.set(element, 'userDefined', isATemplate);
            }

            return _.isEmpty(element) ? null : appendUUIDToString(element);
          })
          .compact()
          .value();

          return ({ data, isTemplate: false, count: 0, updated: 0 });
        });
        const eachUtterancePromise = fs.outputFile(path.join(customPathLocale, 'dialog-flow', invocation.environment, 'intents', `${key}_usersays_en.json`), JSON.stringify(str, null, 2), { flag: 'w' });
        promises.push(eachUtterancePromise);
      });

      _(includedIntents)
      .filter(intent => !intent.environment || _.includes(intent.environment, invocation.environment))
      .map((intentData) => {
        const platformSpecificSlots = _.filter(intentData.slots, (slot) => (_.isEmpty(slot.platform) || _.includes(slot.platform, 'dialogFlow')));

        const entityDefinition = {
          name: intentData.intent,
          auto: true,
          contexts: [],
          responses: [
            {
              resetContexts: false,
              action: intentData.intent,
              affectedContexts: [],
              parameters: (platformSpecificSlots || []).map(slot => ({
                dataType: _.includes(slot.type, '@sys.') ? slot.type : `@${_.kebabCase(slot.type)}`,
                name: slot.name,
                value: `$${slot.name}`,
                isList: false
              })),
              messages: [],
              defaultResponsePlatforms: {},
              speech: []
            }
          ],
          priority: 500000,
          webhookUsed: true,
          webhookForSlotFilling: false,
          fallbackIntent: false,
          events: intentData.intent === 'LaunchIntent' ?
          [{ name: 'WELCOME' }, { name: 'GOOGLE_ASSISTANT_WELCOME' }] : [],
        };
        promises.push(fs.outputFile(path.join(customPathLocale, 'dialog-flow', invocation.environment, 'intents', `${intentData.intent}.json`), JSON.stringify(appendUUIDToString(entityDefinition), null, 2), { flag: 'w' }));

      })
      .value();


    });


    if (this.skillEnvironmentsInformation) {

      _.chain(this.skillEnvironmentsInformation)
      .filter({ platform: 'alexa' })
      .map('environment')
      .uniq()
      .map(skillEnvironments => {


        const agent = {
          description: '',
          language: 'en',
          activeAssistantAgents: [],
          disableInteractionLogs: false,
          googleAssistant: {
            googleAssistantCompatible: true,
            project: 'somename',
            welcomeIntentSignInRequired: false,
            startIntents: [],
            systemIntents: [],
            endIntentIds: [],
            oAuthLinking: {
              required: false,
              grantType: 'AUTH_CODE_GRANT'
            },
            voiceType: 'MALE_1',
            capabilities: [],
            protocolVersion: 'V1'
          },
          defaultTimezone: 'America/New_York',
          webhook: {
            url: '',
            headers: {
            },
            available: true,
            useForDomains: true,
            cloudFunctionsEnabled: false,
            cloudFunctionsInitialized: false
          },
          isPrivate: true,
          customClassifierMode: 'use.after',
          mlMinConfidence: 0.2,
          supportedLanguages: []
        };

        const schema = _.pick(this, ['intents']);

        _.chain(this.skillEnvironmentsInformation)
        .filter({ environment: skillEnvironments, platform: 'dialogFlow'})
        .map(item => {
          _.set(agent, item.key, item.value)
        })
        .value();

        const str = JSON.stringify(agent, null, 2);
        const promise = fs.outputFile(path.join(customPathLocale, 'dialog-flow', skillEnvironments, 'agent.json'), str, { flag: 'w' });
        const promisePackage = fs.outputFile(path.join(customPathLocale, 'dialog-flow', skillEnvironments, 'package.json'), JSON.stringify({ version: '1.0.0' }, null, 2), { flag: 'w' });

        const promiseDefaultFallbackIntent = fs.outputFile(path.join(customPathLocale, 'dialog-flow', skillEnvironments, 'intents', 'defaultFallbackIntent.json'), JSON.stringify(appendUUIDToString({
          name: 'DefaultFallbackIntent',
          auto: true,
          contexts: [],
          responses: [
            {
              resetContexts: false,
              action: 'input.unknown',
              affectedContexts: [],
              parameters: [],
              messages: [],
              defaultResponsePlatforms: {},
              speech: []
            }
          ],
          priority: 500000,
          webhookUsed: true,
          webhookForSlotFilling: false,
          fallbackIntent: true,
          events: []
        }), null, 2), { flag: 'w' });

        promises.push(promise);
        promises.push(promisePackage);
        promises.push(promiseDefaultFallbackIntent);
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

function appendUUIDToString(obj) {
  obj.id = uuid(JSON.stringify(obj), uuid.DNS);
  return obj;
}
module.exports = dialogFlow;
