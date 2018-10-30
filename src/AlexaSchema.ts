import { VoxaSheet, SheetTypes  } from './VoxaSheet';
import { Schema, Intent, PublishingInformation } from './Schema';
import * as _ from 'lodash';
import * as path from 'path';
import * as _Promise from 'bluebird';

export class AlexaSchema extends Schema {
  public NAMESPACE = 'alexa';
  public AVAILABLE_LOCALES = ['en-US', 'en-GB', 'en-CA', 'en-AU', 'en-IN', 'de-DE', 'ja-JP', 'es-ES', 'fr-FR', 'it-IT'];
  public environment = 'staging';

  constructor(voxaSheets: VoxaSheet[], interactionOption: any) {
    super(voxaSheets, interactionOption);
  }

  validate(locale:string, environment: string) {

  };

  build(locale: string, environment: string) {
    this.buildLanguageModel(locale, environment);
    this.buildPublishing(environment);
  }

  buildPublishing(environment: string) {
    const NAMESPACE = this.NAMESPACE;
    const manifest = {
      manifestVersion: '1.0',
    };

    this.publishing
    .filter(item => _.isEmpty(item.environments) && item.key.includes(this.NAMESPACE))
    .forEach(assignPublishingKeys);

    this.publishing
    .filter(item => _.includes(item.environments, environment) && item.key.includes(this.NAMESPACE))
    .forEach(assignPublishingKeys);

    this.fileContent.push({
      path: path.join('/Users/rainadmin/Documents/rain_agency/rm-voxa-cli/speech', this.NAMESPACE, `${_.kebabCase(environment)}-manifest.json`),
      content: { manifest },
    });

    function assignPublishingKeys(item: PublishingInformation) {
      let { key, value } = item;
      key = key.replace(`${NAMESPACE}.`, '');

      if (key.includes('[]')) {
        const keySplitByArray = key.split('[]');
        key = keySplitByArray[0];
        const subKey = keySplitByArray[1];

        const arrayOnPublishingInformation = _.get(manifest, key, []);

        if (!_.isEmpty(subKey)) {
          const subObject = {};
          _.set(subObject, subKey, value);
          arrayOnPublishingInformation.push(subObject);
        } else {
          arrayOnPublishingInformation.push(value);
        }
        value = arrayOnPublishingInformation;
      }
      _.set(manifest, key, value);
    }
  }

  buildLanguageModel(locale: string, environment: string) {
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
