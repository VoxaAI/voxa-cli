import * as _Promise from "bluebird";
import * as fsExtra from "fs-extra";
import * as _ from "lodash";
import { getSheetType, IVoxaSheet, SheetTypes } from "./VoxaSheet";
const fs = _Promise.promisifyAll(fsExtra);
import * as path from "path";
import {
  downloadProcessor,
  intentUtterProcessor,
  invocationProcessor,
  publishingProcessor,
  slotProcessor,
  viewsProcessor
} from "./Processor";

export abstract class Schema {
  public intents: IIntent[] = [];
  public slots: ISlot[] = [];
  public downloads: IDownload[] = [];
  public abstract AVAILABLE_LOCALES: string[];
  public fileContent: IFileContent[] = [];
  public views: IView[] = [];
  public invocations: Invocation[] = [];
  public publishing: IPublishingInformation[] = [];

  public abstract NAMESPACE: string;

  constructor(public interactionOptions: any = {}) {}

  public abstract validate(locale: string, environment: string): void;
  public abstract build(locale: string, environment: string): void; // must be implemented in derived classes

  public intentsByPlatformAndEnvironments(locale: string, environment: string): IIntent[] {
    return this.intents.reduce((acc: any, intent: any) => {
      const diffLocale = locale !== intent.locale;

      if (diffLocale) {
        return acc;
      }

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

  public buildDownloads(): void {
    this.downloads.forEach(download => {
      const file = {
        path: path.join(
          this.interactionOptions.rootPath,
          `src/content/${download.locale}/${_.kebabCase(download.name)}.json`
        ),
        content: download.data
      };
      this.fileContent.push(file as IFileContent);
    });
  }

  public buildViews(): void {
    const viewsContent = {};
    this.views.forEach(view => {
      _.set(viewsContent, `${view.locale}.translation`, view.data);
    });

    const file = {
      path: path.join(this.interactionOptions.rootPath, "src/app/views.json"),
      content: viewsContent
    };
    this.fileContent.push(file as IFileContent);
  }

  public buildSynonyms(): void {
    this.slots.forEach(slot => {
      const file = {
        path: path.join(
          this.interactionOptions.rootPath,
          `src/synonyms/${slot.locale}/${_.kebabCase(slot.name)}.json`
        ),
        content: slot.values.reduce(
          (acc: any, next: any) => {
            if (_.isEmpty(next.synonyms)) {
              acc[next.value] = next.value;
            } else {
              next.synonyms.map((syn: any) => {
                acc[syn] = next.value;
              });
            }
            return acc;
          },
          {} as any
        )
      };
      this.fileContent.push(file as IFileContent);
    });
  }

  public mergeManifest(environment: string): any {
    const manifest = {};
    const NAMESPACE = this.NAMESPACE;
    this.publishing
      .filter(item => _.isEmpty(item.environments) && item.key.includes(this.NAMESPACE))
      .forEach(assignPublishingKeys);

    this.publishing
      .filter(
        item => _.includes(item.environments, environment) && item.key.includes(this.NAMESPACE)
      )
      .forEach(assignPublishingKeys);

    return manifest;

    function assignPublishingKeys(item: IPublishingInformation) {
      let { key, value } = item;
      key = key.replace(`${NAMESPACE}.`, "");

      if (key.includes("[]")) {
        const keySplitByArray = key.split("[]");
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
      if (key.includes("keywords") && _.isString(value)) {
        value = value.split(",").map(_.trim);
      }
      _.set(manifest, key, value);
    }
  }

  protected init(voxaSheets: any) {
    this.publishing = publishingProcessor(voxaSheets, this.AVAILABLE_LOCALES);
    this.intents = intentUtterProcessor(voxaSheets, this.AVAILABLE_LOCALES);
    this.downloads = downloadProcessor(voxaSheets, this.AVAILABLE_LOCALES);
    this.views = viewsProcessor(voxaSheets, this.AVAILABLE_LOCALES);
    this.slots = slotProcessor(voxaSheets, this.AVAILABLE_LOCALES);
    this.invocations = invocationProcessor(voxaSheets, this.AVAILABLE_LOCALES);
  }
}

export interface IIntent {
  name: string;
  samples: string[];
  slotsDefinition: ISlotDefinition[];
  canFulfillIntent: boolean;
  startIntent: boolean;
  signInRequired: boolean;
  endIntent: boolean;
  events: string[] | IEvent[];
  environments: string[];
  platforms: string[];
  locale: string;
}

export interface IEvent {
  name: string;
}

export interface IFileContent {
  path: string;
  content: any;
  // promise?: Promise<void>;
}

export interface Invocation {
  locale: string;
  name: string;
  environment: string;
}

export interface ISlotDefinition {
  name: string;
  type: string;
  // samples: string[];
}

export interface ISlot {
  locale: string;
  name: string; // LIST_OF_COUNTRIES
  values: ISlotSynonymns[];
}
export interface ISlotSynonymns {
  value: string; // united-states
  synonyms: string[]; // USA, united states
}

export interface IView {
  locale: string;
  data: {};
}

export interface IDownload {
  name: string;
  data: Array<{}>;
  locale: string;
}

export interface IPublishingInformation {
  key: string;
  value: string | object;
  environments: string[];
}
