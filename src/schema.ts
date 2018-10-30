import { VoxaSheet, SheetTypes, getSheetType } from './VoxaSheet';
import * as _ from 'lodash';
import value from '*.json';
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

  public interactionOptions = {};

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
        path: `/Users/rainadmin/Documents/rain_agency/rm-voxa-cli/speech-content/${download.locale}/${_.kebabCase(download.name)}`,
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
      path: path.join('/Users/rainadmin/Documents/rain_agency/rm-voxa-cli/speech-content/views.json'),
      content: viewsContent,
    };
    this.fileContent.push(file as FileContent);
  }
}

export interface Intent {
  name: string;
  samples: string[];
  slotsDefinition: SlotDefinition[];
  canFulfillIntent: boolean;
  startIntent: boolean;
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
