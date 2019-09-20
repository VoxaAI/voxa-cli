/*
 * Copyright (c) 2018 Rain Agency <contact@rain.agency>
 * Author: Rain Agency <contact@rain.agency>
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 * the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
 * FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 * COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
 * IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
/* tslint:disable:forin */
import Promise from "bluebird";
import fsExtra from "fs-extra";
import _ from "lodash";
import path from "path";
import { IDefinedInteractionOptions } from "./InteractionBuilder";
import {
  downloadProcessor,
  intentUtterProcessor,
  invocationProcessor,
  publishingProcessor,
  slotProcessor,
  viewsProcessor
} from "./Processor";
import { IVoxaSheet } from "./VoxaSheet";
const fs = Promise.promisifyAll(fsExtra);

export abstract class Schema {
  public intents: IIntent[] = [];
  public slots: ISlot[] = [];
  public downloads: IDownload[] = [];
  public AVAILABLE_LOCALES: string[];
  public fileContent: IFileContent[] = [];
  public views: IView[] = [];
  public invocations: IInvocation[] = [];
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
        path: buildFilePath(
          this.interactionOptions,
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
          .filter(v => _.isString(v))
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
      path: buildFilePath(this.interactionOptions, "views.map.json"),
      content: viewsContent
    };

    const fileVariablesMap: IFileContent = {
      path: buildFilePath(this.interactionOptions, "variables.map.json"),
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
      path: buildFilePath(this.interactionOptions, "views.json"),
      content: viewsContent
    };
    this.fileContent.push(file);
  }

  public buildSynonyms(): void {
    this.slots.forEach(slot => {
      const file: IFileContent = {
        path: buildFilePath(
          this.interactionOptions,
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

  public getIntentsDefinition(locale: string, environment: string) {
    const intentsByPlatformAndEnvironments = this.intentsByPlatformAndEnvironments(
      locale,
      environment
    );

    const intents = intentsByPlatformAndEnvironments.map((rawIntent: IIntent) => {
      const { name, samples, slotsDefinition } = rawIntent;
      const slots = _(slotsDefinition)
        .filter(slot => this.filterByPlatform(slot))
        .map((slot: any) => {
          return {
            type: slot.type,
            name: slot.name.replace("{", "").replace("}", ""),
            samples: slot.samples.length > 0 ? slot.samples : undefined
          };
        })
        .value();

      return { name, samples, slots };
    });

    return intents;
  }

  public getSlotsByIntentsDefinition(locale: string, environment: string): ISlot[] {
    const intents = this.getIntentsDefinition(locale, environment);
    const slotsDefinitionNames = _.chain(intents)
      .map("slots")
      .flatten()
      .map("type")
      .uniq()
      .value();

    return this.slots.filter(
      slot => slot.locale === locale && _.includes(slotsDefinitionNames, slot.name)
    );
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

  protected filterByPlatform(slot: ISlotDefinition) {
    return slot.platform === this.NAMESPACE || slot.platform === undefined;
  }
}

export interface IIntent {
  name: string;
  samples: string[];
  responses: string[];
  confirmations: string[];
  slotsDefinition: ISlotDefinition[];
  canFulfillIntent: boolean;
  webhookUsed: boolean;
  webhookForSlotFilling: boolean;
  startIntent: boolean;
  signInRequired: boolean;
  endIntent: boolean;
  events: string[] | IEvent[];
  environments: string[];
  platforms: string[];
  locale: string;
  delegationStrategy?: "ALWAYS" | "SKILL_RESPONSE";
  confirmationRequired: boolean;
}

export interface IEvent {
  name: string;
}

export interface IFileContent {
  path: string;
  content: any;
  // promise?: Promise<void>;
}

export interface IInvocation {
  locale: string;
  name: string;
  environment: string;
}

export interface ISlotDefinition {
  name: string;
  type: string;
  platform?: string;
  required: boolean;
  requiresConfirmation: boolean;
  requiresElicitation: boolean;
  samples: string[];
  prompts: {
    confirmation: string[];
    elicitation: string[];
  };
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

function buildFilePath(options: IDefinedInteractionOptions, ...names: string[]): string {
  return path.join(options.rootPath, options.viewsPath, ...names);
}
