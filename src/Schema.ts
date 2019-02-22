import { VoxaSheet, SheetTypes, getSheetType } from './VoxaSheet';
import * as _ from 'lodash';
import * as fsExtra from 'fs-extra';
import * as _Promise from 'bluebird';
const fs = _Promise.promisifyAll(fsExtra);
import * as path from 'path';
import {
  downloadProcessor,
  invocationProcessor,
  viewsProcessor,
  slotProcessor,
  intentUtterProcessor,
  publishingProcessor,
} from './Processor';

export abstract class Schema {
  public intents: Intent[] = [];
  public slots: Slot[] = [];
  public downloads: Download[] = [];
  public AVAILABLE_LOCALES = ['en-US'];
  public fileContent: FileContent[] = [];
  public views: View[] = [];
  public invocations: Invocation[] = [];
  public publishing: PublishingInformation[] = [];

  public NAMESPACE = 'alexa';

  public interactionOptions = {} as any;

  constructor(voxaSheets: VoxaSheet[], interactionOption: any) {
    this.interactionOptions = interactionOption;
    this.publishing = publishingProcessor(voxaSheets, this.AVAILABLE_LOCALES);
    this.intents = intentUtterProcessor(voxaSheets, this.AVAILABLE_LOCALES);
    this.downloads = downloadProcessor(voxaSheets, this.AVAILABLE_LOCALES);
    this.views = viewsProcessor(voxaSheets, this.AVAILABLE_LOCALES);
    this.slots = slotProcessor(voxaSheets, this.AVAILABLE_LOCALES);
    this.invocations = invocationProcessor(voxaSheets, this.AVAILABLE_LOCALES);
  }

  abstract validate(locale:string, environment: string): void;
  abstract build(locale:string, environment: string): void; // must be implemented in derived classes

  intentsByPlatformAndEnvironments(locale: string, environment: string): Intent[] {
    return this.intents
    .reduce((acc:any, intent: any) => {
      const diffLocale = locale !== intent.locale;

      if (diffLocale) return acc;

      if (!_.isEmpty(intent.platforms) && !intent.platforms.includes(this.NAMESPACE)) {
        return acc;
      }

      if (!_.isEmpty(intent.environments) && !intent.environments.includes(environment)) {
        return acc;
      }
      acc.push(intent);

      return acc;
    }, []);
  }

  buildDownloads(): void  {
    this.downloads.forEach(download => {
      const file = {
        path: path.join(this.interactionOptions.rootPath, `src/content/${download.locale}/${_.kebabCase(download.name)}.json`),
        content: download.data,
      }
      this.fileContent.push(file as FileContent);
    });
  }

  buildViews(): void  {
    const viewsContent = {};
    this.views.forEach(view => {
      _.set(viewsContent, `${view.locale}.translation`, view.data);
    });

    const file = {
      path: path.join(this.interactionOptions.rootPath, 'src/app/views.json'),
      content: viewsContent,
    };
    this.fileContent.push(file as FileContent);
  }

  buildSynonyms(): void  {
    this.slots.forEach(slot => {
      const file = {
        path: path.join(this.interactionOptions.rootPath, `src/synonyms/${slot.locale}/${_.kebabCase(slot.name)}.json`),
        content: slot.values.reduce((acc, next) => {
          if (_.isEmpty(next.synonyms)) {
            acc[next.value] = next.value;
          } else {
            next.synonyms.map(syn => {
              acc[syn] = next.value;
            });
          }
          return acc;
        }, {} as any),
      }
      this.fileContent.push(file as FileContent);
    });
  }

  mergeManifest(environment: string): any {
    const manifest = {};
    const NAMESPACE = this.NAMESPACE;
    this.publishing
    .filter(item => _.isEmpty(item.environments) && item.key.includes(this.NAMESPACE))
    .forEach(assignPublishingKeys);

    this.publishing
    .filter(item => _.includes(item.environments, environment) && item.key.includes(this.NAMESPACE))
    .forEach(assignPublishingKeys);

    return manifest;

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
      if (key.includes('keywords') && _.isString(value)) {
        value = value.split(',').map(_.trim);
      }
      _.set(manifest, key, value);
    }
  }
}

export interface Intent {
  name: string;
  samples: string[];
  slotsDefinition: SlotDefinition[];
  canFulfillIntent: boolean;
  startIntent: boolean;
  signInRequired: boolean;
  endIntent: boolean;
  events: string[] | Event[];
  environments: [];
  platforms: [];
  locale: string;
}

export interface Event {
  name: string;
}

export interface FileContent {
  path: string;
  content: any;
  //promise?: Promise<void>;
}

export interface Invocation {
  locale: string;
  name: string;
  environment: string;
}

export interface SlotDefinition {
  name: string;
  type: string;
  // samples: string[];
}

export interface Slot {
  locale: string;
  name: string; // LIST_OF_COUNTRIES
  values: SlotSynonymns[];
}
export interface SlotSynonymns {
  value: string; // united-states
  synonyms: string[]; // USA, united states
}

export interface View {
  locale: string;
  data: {};
}

export interface Download {
  name: string;
  data: {}[];
  locale: string;
}

export interface PublishingInformation {
  key: string;
  value: string | object;
  environments: string[];
}
