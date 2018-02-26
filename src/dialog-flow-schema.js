'use strict';

const chai = require('chai');
const path = require('path');
const _ = require('lodash');
const Promise = require('bluebird');
const fs = Promise.promisifyAll(require('fs-extra'));
const PrettyError = require('pretty-error');
const AlexaError = require('./error');
const uuid = require('uuid/v4');

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
    //console.log('this', this);

    if (!this.locale) return new Error('Please define a locale. eg. this.locale = \'en-US\'');
    const customPathLocale = unique ? pathSpeech : path.join(pathSpeech, this.locale);
    const promises = [];
    var tokenRegx = /{([^}]+)}/g;

    // slotsDraft
    _.each(this.slots, (value, key) => {
      key = _.kebabCase(key);
      const str = _.keys(value).map(value => ({ value, synonyms: [value] }));
      const eachUtterancePromise = fs.outputFile(path.join(customPathLocale, 'entities', `${key}_entries_en.json`), JSON.stringify(str, null, 2), { flag: 'w' });
      const entityDefinition = {
        id: uuid(),
        name: key,
        isOverridable: true,
        isEnum: true,
        automatedExpansion: false,
      };
      promises.push(fs.outputFile(path.join(customPathLocale, 'entities', `${key}.json`), JSON.stringify(entityDefinition, null, 2), { flag: 'w' }));
      promises.push(eachUtterancePromise);
    });

    _.each(this.utterances, (value, key) => {
      const intentUttr = _.find(this.intents, { intent: key });
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

          console.log('s', variable, intentUttr);

          const slot = _.find(intentUttr.slots, { name: variable })

          if (isATemplate && slot) {
            _.set(element, 'meta', `@${_.kebabCase(slot.type)}`);
            _.set(element, 'alias', slot.name);
          }

          if (!_.isEmpty(text)) {
            _.set(element, 'text', text);
            _.set(element, 'id', uuid());
            _.set(element, 'userDefined', isATemplate);
          }

          return _.isEmpty(element) ? null : element;
        })
        .compact()
        .value();

        return ({ data, isTemplate: false, count: 0, updated: 0 });
      });
      const eachUtterancePromise = fs.outputFile(path.join(customPathLocale, 'intents', `${key}_usersays_en.json`), JSON.stringify(str, null, 2), { flag: 'w' });
      promises.push(eachUtterancePromise);
    });

    _.each(this.intents, (intentData) => {
      const entityDefinition = {
        id: uuid(),
        name: intentData.intent,
        auto: true,
        contexts: [],
        responses: [
          {
            resetContexts: false,
            action: intentData.intent,
            affectedContexts: [],
            parameters: (intentData.slots || []).map(slot => ({
              dataType: `@${_.kebabCase(slot.type)}`,
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
      promises.push(fs.outputFile(path.join(customPathLocale, 'intents', `${intentData.intent}.json`), JSON.stringify(entityDefinition, null, 2), { flag: 'w' }));

    });

    if (this.intents) {
      const agent = {
        description: '',
        language: 'en',
        activeAssistantAgents: [],
        googleAssistant: {
          googleAssistantCompatible: false,
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
      const str = JSON.stringify(agent, null, 2);

      const promise = fs.outputFile(path.join(customPathLocale, 'agent.json'), str, { flag: 'w' });
      promises.push(promise);
    }

    promises.push(fs.outputFile(path.join(customPathLocale, 'package.json'),  JSON.stringify({ version: '1.0.0' }, null, 2), { flag: 'w' }));

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

module.exports = dialogFlow;
