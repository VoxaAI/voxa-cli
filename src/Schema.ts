/* tslint:disable:forin */
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
  public AVAILABLE_LOCALES: string[];
  public fileContent: IFileContent[] = [];
  public views: IView[] = [];
  public invocations: Invocation[] = [];
  public publishing: IPublishingInformation[] = [];

  public NAMESPACE: string;
  public interactionOptions = {} as any;

  public constructor(
    namespace: string = "alexa",
    availableLocales: string[] = ["en-US"],
    voxaSheets: IVoxaSheet[],
    interactionOption: any
  ) {
    this.AVAILABLE_LOCALES = availableLocales;
    this.NAMESPACE = namespace;
    this.interactionOptions = interactionOption;
    this.publishing = publishingProcessor(voxaSheets, this.AVAILABLE_LOCALES);
    this.intents = intentUtterProcessor(voxaSheets, this.AVAILABLE_LOCALES);
    this.downloads = downloadProcessor(voxaSheets, this.AVAILABLE_LOCALES);
    this.views = viewsProcessor(voxaSheets, this.AVAILABLE_LOCALES);
    this.slots = slotProcessor(voxaSheets, this.AVAILABLE_LOCALES);
    this.invocations = invocationProcessor(voxaSheets, this.AVAILABLE_LOCALES);
  }

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
      const file: IFileContent = {
        path: path.join(
          this.interactionOptions.rootPath,
          this.interactionOptions.contentPath,
          `${download.locale}/${_.kebabCase(download.name)}.json`
        ),
        content: download.data
      };
      this.fileContent.push(file);
    });
  }

  public buildViewsMapping(): void {
    function pathsFinder(object: any, prefixes: string[] = []) {
      let paths: string[] = [];
      let value: any;
      if (typeof object === "object") {
        for (const key in object) {
          value = object[key];
          if (typeof value === "object" && !Array.isArray(value)) {
            paths = paths.concat(pathsFinder(value, prefixes.concat([key])));
          } else {
            paths.push(prefixes.concat(key).join("."));
          }
        }
      }
      return paths;
    }

    function variablesFinder(data: any, viewPath: string) {
      let variables;
      let value = _.get(data, viewPath);

      if (_.isString(value)) {
        value = [value];
      }

      if (_.isArray(value)) {
        variables = _.chain(value)
          .map(v => v.match(/{([\s\S]+?)}/g))
          .flatten()
          .compact()
          .map(v => v.replace("}", "").replace("{", ""))
          .value();
      }

      return variables;
    }

    const viewsContent = _.chain(this.views)
      .map(view => pathsFinder(view.data).map(viewPath => ({ locale: view.locale, viewPath })))
      .flatten()
      .reduce(
        (acc, next) => {
          const locales = _.get(acc, next.viewPath, []);
          locales.push(next.locale);
          acc[next.viewPath] = _.uniq(locales);
          return acc;
        },
        {} as any
      )
      .value();

    const variablesContent = _.chain(this.views)
      .map(view =>
        pathsFinder(view.data).map(viewPath => ({
          locale: view.locale,
          variables: variablesFinder(view.data, viewPath)
        }))
      )
      .flatten()
      .reduce(
        (acc, next) => {
          if (_.isArray(next.variables)) {
            next.variables.map(variable => {
              const locales = _.get(acc, variable, []);
              locales.push(next.locale);
              acc[variable] = _.uniq(locales);
            });
          }

          return acc;
        },
        {} as any
      )
      .value();

    const fileViewMap: IFileContent = {
      path: path.join(
        this.interactionOptions.rootPath,
        this.interactionOptions.viewsPath,
        "views.map.json"
      ),
      content: viewsContent
    };

    const fileVariablesMap: IFileContent = {
      path: path.join(
        this.interactionOptions.rootPath,
        this.interactionOptions.viewsPath,
        "variables.map.json"
      ),
      content: variablesContent
    };

    this.fileContent.push(fileViewMap, fileVariablesMap);
  }

  public buildViews(): void {
    const viewsContent = _.chain(this.views)
      .map(view => [view.locale, { translation: view.data }])
      .fromPairs()
      .value();

    const file: IFileContent = {
      path: path.join(
        this.interactionOptions.rootPath,
        this.interactionOptions.viewsPath,
        "views.json"
      ),
      content: viewsContent
    };
    this.fileContent.push(file);
  }

  public buildSynonyms(): void {
    this.slots.forEach(slot => {
      const file: IFileContent = {
        path: path.join(
          this.interactionOptions.rootPath,
          this.interactionOptions.contentPath,
          "synonyms",
          `${slot.locale}/${_.kebabCase(slot.name)}.json`
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
      this.fileContent.push(file);
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
