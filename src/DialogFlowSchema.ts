import { VoxaSheet, SheetTypes } from './VoxaSheet';
import { Schema, Intent, PublishingInformation, Event, FileContent } from './Schema';
import * as _ from 'lodash';
import * as path from 'path';
import * as _Promise from 'bluebird';
import * as uuid from 'uuid/v5';
import { eventNames } from 'cluster';

export class DialogFlowSchema extends Schema {
  public NAMESPACE = 'dialogflow';
  public AVAILABLE_LOCALES = ['en-US', 'en-AU', 'en-CA', 'en-IN','en-GB', 'de-DE', 'fr-FR', 'fr-CA', 'ja-JP', 'ko-KR', 'es-ES', 'pt-BR', 'it-IT', 'ru-RU', 'hi-IN', 'th-TH', 'id-ID', 'da-DK', 'no-NO', 'nl-NL', 'sv-SE'];
  public environment = 'staging';

  constructor(voxaSheets: VoxaSheet[], interactionOption: any) {
    super(voxaSheets, interactionOption);
  }

  validate() {};

  build(locale: string, environment: string) {
    this.buildDownloads();
    this.buildLanguageModel(locale, environment);
  }

  buildLanguageModel(locale: string, environment: string) {
    const invocation = _.find(this.invocations, { locale, environment });
    const invocationName = _.get(invocation, 'name', 'Skill with no name');
    const intentsByPlatformAndEnvironments = this.intentsByPlatformAndEnvironments(locale, environment);

    locale = locale.split('-')[0];
    const intents = intentsByPlatformAndEnvironments
    .forEach((rawIntent: Intent) => {
      let { name, samples, slotsDefinition, events } = rawIntent;
      name = name.replace('AMAZON.', '');

      const action = name === 'FallbackIntent' ? 'input.unknown': name;

      events = name === 'LaunchIntent' ?
      ['WELCOME', 'GOOGLE_ASSISTANT_WELCOME'] : events;
      events = (events as string[]).map((eventName: string) => ({ name: eventName }));

      const parameters = slotsDefinition.map(slot => ({
        dataType: _.includes(slot.type, '@sys.') ? slot.type : `@${slot.type}`,
        name: slot.name,
        value: `$${slot.name}`,
        isList: false,
      }));
      /* (platformSpecificSlots || []).map(slot => ({
        dataType: _.includes(slot.type, '@sys.') ? slot.type : `@${_.kebabCase(slot.type)}`,
        name: slot.name,
        value: `$${slot.name}`,
        isList: false
      }))
      */
      const intent = {
        name,
        auto: true,
        contexts: [],
        responses: [
          {
            resetContexts: false,
            action,
            affectedContexts: [],
            parameters,
            messages: [],
            defaultResponsePlatforms: {},
            speech: []
          }
        ],
        priority: 500000,
        webhookUsed: true,
        webhookForSlotFilling: false,
        fallbackIntent: false,
        events,
      };

      _.set(intent, 'id', hashObj(intent));
      console.log('intent', intent);


      this.fileContent.push({
        path: path.join('/Users/rainadmin/Documents/rain_agency/rm-voxa-cli/speech', this.NAMESPACE, environment, 'intents', `${intent.name}.json`),
        content: intent,
      } as FileContent);

      this.fileContent.push({
        path: path.join('/Users/rainadmin/Documents/rain_agency/rm-voxa-cli/speech', this.NAMESPACE, environment, 'intents', `${intent.name}_usersays_en.json`),
        content: samples.map(sample => {
          const isATemplate = (_.includes(sample, '{') && _.includes(sample, '}'));
          return {
            data: sample,
            isATemplate: false,
            count: 0,
            updated: 0
          };
        }),
      } as FileContent);
    });

    this.fileContent.push({
      path: path.join('/Users/rainadmin/Documents/rain_agency/rm-voxa-cli/speech', this.NAMESPACE, environment, 'package.json'),
      content: {
        version: '1.0.0'
      },
    } as FileContent);
  }

  buildEntities(locale: string, environment: string) {
    const invocation = _.find(this.invocations, { locale, environment });
    const invocationName = _.get(invocation, 'name', 'Skill with no name');
    const intentsByPlatformAndEnvironments = this.intentsByPlatformAndEnvironments(locale, environment);

    const intents = intentsByPlatformAndEnvironments
    .map((rawIntent: Intent) => {
      const { name, samples, slotsDefinition} = rawIntent;
      const intent = { name, samples, slots: slotsDefinition };
      return intent;
    });

    const types = this.slots.map(rawSlot => {
      const { name, values } = rawSlot;
      const slot = { name, values: values.map(value => ({ name: value })) };
      return slot;
    });

    this.fileContent.push({
      path: path.join('/Users/rainadmin/Documents/rain_agency/rm-voxa-cli/speech', this.NAMESPACE, locale, `${_.kebabCase(environment)}-interaction.json`),
      content: { interactionModel: { languageModel: { invocationName, intents, types } } }
    });

    const canFulfillIntents = _.chain(intentsByPlatformAndEnvironments)
    .filter('canFulfillIntent')
    .map('name')
    .value();

    this.fileContent.push({
      path: path.join('/Users/rainadmin/Documents/rain_agency/rm-voxa-cli/speech-content', `${_.kebabCase(environment)}-canfulfill-intents.json`),
      content: canFulfillIntents,
    });
  }
}

function hashObj(obj:{}) {
  return uuid(JSON.stringify(obj), uuid.DNS);
}
