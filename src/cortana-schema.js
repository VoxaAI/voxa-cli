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
class cortana {
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
    let utterances = [];

    _.each(this.utterances, (utterancesPerIntent, intent) => {
      console.log('sd', intent);
      utterances =_.concat(utterances, _.chain(utterancesPerIntent).map((utter) => cartesianProductOf(utter, _.find(this.intents, { intent }), this.slots)).flattenDeep().compact().value());
    });

    const intents = _.chain(this.intents).map((intent, key) => ({ name: intent.intent }));
    const entities = _.chain(this.slots).map((value, slotName) => ({ name: slotName }));

    if (this.intents) {
      const agent = {
        "luis_schema_version": "2.1.0",
        "versionId": "0.1",
        "name": "starbucks",
        "desc": "culture",
        "culture": "en-us",
        intents,
        entities,
        utterances
      };

      const str = JSON.stringify(agent, null, 2);

      const promise = fs.outputFile(path.join(customPathLocale, 'cortana.json'), str, { flag: 'w' });
      promises.push(promise);
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

function cartesianProductOf(utterance, intent, slots) {
  console.log('intent', intent);
  const tokenRegx = /{([^}]+)}/g;

  utterance = _.chain(utterance)
      .replace(tokenRegx, (match, inner) => {
        return `|{${inner}}|`;
      })
      .split('|')
      .compact()
      .value();

  const slotsToPick = _.map(intent.slots, 'type');
  const mapSlotName = _(intent.slots)
  .map(slot => [slot.type, slot.name])
  .fromPairs()
  .value();

  const slotsToMix = _(slots).pick(slotsToPick).toPairs().map((item) => {
    const type = item[0];
    return _.keys(item[1]).map(key => ({ name: mapSlotName[type], type, value: key }));
  })
  .value();

  console.log('slotsToMix', slotsToMix);
  // const utterances = _.head(arguments);
  // const slots = _.tail(arguments);

  return Array.prototype.reduce.call(slotsToMix, function(a, b) {
    const ret = [];
    a.forEach(a => {
      b.forEach(b => {
        ret.push(a.concat([b]));
      });
    });
    return ret;
  }, [[]])
  .map((slotCartesianProduct) => {
    const utteranceText = utterance.reduce((acc, text) => {
      const isATemplate = (_.includes(text, '{') && _.includes(text, '}'));
      console.log('acc', acc, 'next', text);

      if (!isATemplate) {
        // console.log('text', text, 'isAtemp')
        acc.text += (text);
        return acc;
      }


      const variable = text.replace('{', '').replace('}', '');
      const slotEntity = _.chain(slotCartesianProduct).find({ name: variable }).get('type').value();
      const slotValue = _.chain(slotCartesianProduct).find({ name: variable }).get('value').value();
      console.log('slotValue', slotValue);


      if (slotEntity === 'AMAZON.NUMBER') {
        acc.text += ('4');
      } else {
        const startPos = acc.text.length;
        const endPos = startPos + slotValue.length;

        const entity = {
          startPos,
          endPos,
          entity: slotEntity
        };
        acc.text += (slotValue);
        acc.entities.push(entity);
      }


      return acc;
    }, {
      text: '',
      entities: [],
    });
    console.log('utterance', utteranceText);


    return (utteranceText);
  });
}

module.exports = cortana;
