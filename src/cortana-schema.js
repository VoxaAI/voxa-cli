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
    // console.log('this', JSON.stringify(this, null, 2));

    if (!this.locale) return new Error('Please define a locale. eg. this.locale = \'en-US\'');
    const customPathLocale = unique ? pathSpeech : path.join(pathSpeech, this.locale);
    const promises = [];
    var tokenRegx = /{([^}]+)}/g;
    let utterances = [];

    const cortanaUtilities = require('./cortana-utilities');
    const intentsName = _.map(this.intents, 'intent');
    const utilitiesEntitiestoAdd = _.intersection(intentsName, _.keys(cortanaUtilities))
    _.assign(this.utterances, _.pick(cortanaUtilities, utilitiesEntitiestoAdd));

    _.each(this.utterances, (value, key) => {
      const intentUttr = _.find(this.intents, { intent: key });
      const str = _.chain(value).map(text => {
        const data = _.chain(text)
        .replace(tokenRegx, function (match, inner) {
          return `|{${inner}}|`;
        })
        .split('|')
        .map(text => {
          const isATemplate = (_.includes(text, '{') && _.includes(text, '}'));

          const variable = text
          .replace('{', '')
          .replace('}', '');

          const slot = _.chain(intentUttr.slots).find({ name: variable }).get('type').value()

          if (isATemplate && slot) {

            //console.log('s', variable, slot, intentUttr);
            if (slot === 'NUMBER') {
              text = '4'
            } else {
              text = _.chain(this.slots).get(slot).keys().sample().value();
            }

          }

          return text;
        })
        .join('')
        .value();

        return ({ intent: intentUttr.intent, text: data, entities: [] });
      })
      .flatten()
      .value();
      utterances = _.concat(utterances, str);
    });


    const intents = _.chain(this.intents).map((intent, key) => {
      const name = intent.intent;
      const intentOuput = ({ name });

      if (_.includes(name, 'Utilities.' ))  {
        const domain_name = name.split('.')[0];
        const model_name = name.split('.')[1];

        _.set(intentOuput, 'inherits', { domain_name, model_name });
      }

      return intentOuput;
    }).value();
    // const entities = _.chain(this.slots).map((value, slotName) => ({ name: slotName })).value();
    const entities = [];
    const closedLists = _.chain(this.slots).map((slotValue, name) => {
      return ({ name, subLists: _.keys(slotValue).map(canonicalForm => ({ canonicalForm,  list: []})) })
    }).value();
    if (this.intents) {
      const agent = {
        "luis_schema_version": "2.1.0",
        "versionId": "0.1",
        "name": "starbucks",
        "desc": "culture",
        "culture": "en-us",
        bing_entities: [],
        composites: [],
        model_features: [],
        regex_features: [],
        intents,
        entities,
        utterances,
        closedLists
      };

      if (_.find(this.intents, intent => _.find(intent.slots, { type: 'NUMBER' }))) {
        agent.bing_entities = [ "number" ];
      }

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

  const slotsToPick = _.map(intent.slots, 'name');
  const mapSlotName = _(intent.slots)
  .map(slot => [slot.name, slot.type,])
  .fromPairs()
  .value();

  // const slotsToMix = _(slots).pick(slotsToPick).toPairs().map((item) => {
  //   const type = item[0];
  //   return _.keys(item[1]).map(key => ({ name: mapSlotName[type], type, value: key }));
  // })
  // .value();
  //


  const slotsToMix = _(slotsToPick).map(slotToPick => {
    const name = slotToPick;
    const type = mapSlotName[name];
    return _.keys(slots[type]).map(key => ({ name, type, value: key }));
  })
  .value();

  // console.log('slotToPick', slotsToMix);
  // console.log('slotsToMix', slotsToMix);
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
      // console.log('acc', acc, 'next', text);

      if (!isATemplate) {
        // console.log('text', text, 'isAtemp')
        acc.text += (text);
        return acc;
      }


      const variable = text.replace('{', '').replace('}', '');
      const slotEntity = _.chain(slotCartesianProduct).find({ name: variable }).get('type').value();
      // const slotValue = _.chain(slotCartesianProduct).find({ name: variable }).get('value').value();
      //console.log(acc, 'slotValue', slotValue, variable, slotEntity);
      console.log(JSON.stringify(slotCartesianProduct, null, 2), 'slotCartesianProduct');


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
    // console.log('utterance', utteranceText);


    return (utteranceText);
  });
}

module.exports = cortana;
