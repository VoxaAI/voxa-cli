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
/* tslint:disable:no-empty no-submodule-imports */
import * as _Promise from "bluebird";
import * as _ from "lodash";
import * as path from "path";
import * as uuid from "uuid/v5";
import { AGENT, BUILT_IN_INTENTS } from "./DialogflowDefault";
import { IFileContent, IIntent, Schema } from "./Schema";
import { IVoxaSheet } from "./VoxaSheet";
import { formattedValue } from "./connectors/utils";

const NAMESPACE = "dialogflow";
const AVAILABLE_LOCALES = [
  "en",
  "de",
  "fr",
  "ja",
  "ko",
  "es",
  "pt",
  "it",
  "ru",
  "hi",
  "th",
  "id",
  "da",
  "no",
  "nl",
  "sv",
  "en-US",
  "en-AU",
  "en-CA",
  "en-IN",
  "en-GB",
  "de-DE",
  "fr-FR",
  "fr-CA",
  "ja-JP",
  "ko-KR",
  "es-ES",
  "pt-BR",
  "it-IT",
  "ru-RU",
  "hi-IN",
  "th-TH",
  "id-ID",
  "da-DK",
  "no-NO",
  "nl-NL",
  "sv-SE"
];

export class DialogflowSchema extends Schema {
  public environment = "staging";
  public builtIntents = [] as any;

  constructor(voxaSheets: IVoxaSheet[], interactionOptions: any) {
    super(NAMESPACE, AVAILABLE_LOCALES, voxaSheets, interactionOptions);
  }

  public validate() {}

  public build(locale: string, environment: string) {
    this.buildIntent(locale, environment);
    this.buildUtterances(locale, environment);
    this.buildEntities(locale, environment);
    this.buildPackage(environment);
    this.buildAgent(locale, environment);
  }

  public buildPackage(environment: string) {
    const file: IFileContent = {
      path: path.join(
        this.interactionOptions.rootPath,
        this.interactionOptions.speechPath,
        this.NAMESPACE,
        environment,
        "package.json"
      ),
      content: {
        version: "1.0.0"
      }
    };
    this.fileContent.push(file);
  }

  public buildAgent(locale: string, environment: string) {
    const intents = this.builtIntents;
    const invocation = _.find(this.invocations, { locale, environment });
    const invocationName = _.get(invocation, "name", "Skill with no name");
    const intentsByPlatformAndEnvironments = this.intentsByPlatformAndEnvironments(
      locale,
      environment
    );

    const startIntents = _.chain(intentsByPlatformAndEnvironments)
      .filter({ startIntent: true })
      .map(intent => {
        const intentName = intent.name.replace("AMAZON.", "");
        const startIntent = _.chain(intents)
          .find(i => i.name === intent.name || i.name === intentName)
          .value();
        if (startIntent) {
          return {
            intentId: _.get(startIntent, "id"),
            signInRequired: !!_.get(startIntent, "signInRequired")
          };
        }
      })
      .compact()
      .value();

    const endIntentIds = _.chain(intentsByPlatformAndEnvironments)
      .filter({ endIntent: true })
      .map(intent => {
        const intentName = intent.name.replace("AMAZON.", "");

        const intentId = _.chain(intents)
          .find(i => i.name === intent.name || i.name === intentName)
          .get("id")
          .value();
        return intentId;
      })
      .compact()
      .value();

    const supportedLanguages = _(this.invocations)
      .filter({ environment })
      .map("locale")
      .uniq()
      .value();

    const language = locale.split("-")[0];

    const agent = _.merge(AGENT, this.mergeManifest(environment), {
      description: invocationName,
      language,
      supportedLanguages,
      googleAssistant: { project: _.kebabCase(invocationName), startIntents, endIntentIds }
    });

    const file: IFileContent = {
      path: path.join(
        this.interactionOptions.rootPath,
        this.interactionOptions.speechPath,
        this.NAMESPACE,
        environment,
        "agent.json"
      ),
      content: agent
    };
    this.fileContent.push(file);
  }

  public buildUtterances(locale: string, environment: string) {
    const intentsByPlatformAndEnvironments = this.intentsByPlatformAndEnvironments(
      locale,
      environment
    );

    locale = locale.split("-")[0];
    const intents = intentsByPlatformAndEnvironments.map((rawIntent: IIntent) => {
      let { name, samples, events } = rawIntent;
      const { slotsDefinition } = rawIntent;
      name = name.replace("AMAZON.", "");

      const builtInIntentSamples = _.get(BUILT_IN_INTENTS, name, []);
      samples = _.chain(samples)
        .concat(builtInIntentSamples)
        .uniq()
        .value();

      events = name === "LaunchIntent" ? ["WELCOME", "GOOGLE_ASSISTANT_WELCOME"] : events;
      events = (events as string[]).map((eventName: string) => ({ name: eventName }));

      const parameters = _(slotsDefinition)
        .filter(slot => this.filterByPlatform(slot))
        .map(slot => ({
          dataType: _.includes(slot.type, "@sys.") ? slot.type : `@${slot.type}`,
          name: slot.name,
          value: `$${slot.name}`,
          isList: false
        }))
        .value();

      const resultSamples = samples.map(sample => {
        const data = _.chain(sample)
          .replace(/{([^}]+)}/g, (match, inner) => {
            return `|{${inner}}|`;
          })
          .split("|")
          .map(text => {
            const element = {};
            const isTemplate = _.includes(text, "{") && _.includes(text, "}");

            const alias = text.replace("{", "").replace("}", "");

            const slot = _.find(parameters, { name: text });

            if (isTemplate && slot) {
              _.set(element, "meta", `@${_.kebabCase(slot.dataType)}`);
              _.set(element, "alias", alias);
            }

            if (!_.isEmpty(text)) {
              _.set(element, "text", text);
              _.set(element, "userDefined", isTemplate);
            }

            _.set(element, "id", hashObj(element));

            return _.isEmpty(_.omit(element, ["id"])) ? null : element;
          })
          .compact()
          .value();

        return {
          data,
          isTemplate: false,
          count: 0,
          updated: 0
        };
      });

      if (!_.isEmpty(resultSamples)) {
        const file: IFileContent = {
          path: path.join(
            this.interactionOptions.rootPath,
            this.interactionOptions.speechPath,
            this.NAMESPACE,
            environment,
            "intents",
            `${name}_usersays_${locale}.json`
          ),
          content: resultSamples
        };
        this.fileContent.push(file);
      }
    });
  }
  public buildIntent(locale: string, environment: string) {
    const intentsByPlatformAndEnvironments = this.intentsByPlatformAndEnvironments(
      locale,
      environment
    );

    locale = locale.split("-")[0];
    this.builtIntents = intentsByPlatformAndEnvironments.map((rawIntent: IIntent) => {
      let { name, events } = rawIntent;
      const { canFulfillIntent, slotsDefinition } = rawIntent;
      name = name.replace("AMAZON.", "");
      const fallbackIntent = name === "FallbackIntent";
      const action = fallbackIntent ? "input.unknown" : name;

      events = name === "LaunchIntent" ? ["WELCOME", "GOOGLE_ASSISTANT_WELCOME"] : events;
      events = (events as string[]).map((eventName: string) => ({ name: eventName }));

      const parameters = _(slotsDefinition)
        .filter(slot => this.filterByPlatform(slot))
        .map(slot => ({
          dataType: _.includes(slot.type, "@sys.") ? slot.type : `@${_.kebabCase(slot.type)}`,
          name: slot.name.replace("{", "").replace("}", ""),
          value: `$${slot.name.replace("{", "").replace("}", "")}`,
          isList: false
        }))
        .value();

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
        webhookForSlotFilling: formattedValue(canFulfillIntent),
        fallbackIntent,
        events
      };

      _.set(intent, "id", hashObj(intent));
      const file: IFileContent = {
        path: path.join(
          this.interactionOptions.rootPath,
          this.interactionOptions.speechPath,
          this.NAMESPACE,
          environment,
          "intents",
          `${intent.name}.json`
        ),
        content: intent
      };
      this.fileContent.push(file);
      return intent;
    });
  }

  public buildEntities(locale: string, environment: string) {
    const localeEntity = locale.split("-")[0];

    this.slots
      .filter(slot => !_.includes(slot.name, "@sys."))
      .forEach(rawSlot => {
        const { name, values } = rawSlot;
        const slotName = _.kebabCase(name);
        const slotContent = {
          name: slotName,
          isOverridable: true,
          isEnum: false,
          automatedExpansion: false
        };
        _.set(slotContent, "id", hashObj(slotContent));

        const fileDef: IFileContent = {
          path: path.join(
            this.interactionOptions.rootPath,
            this.interactionOptions.speechPath,
            this.NAMESPACE,
            environment,
            "entities",
            `${slotName}.json`
          ),
          content: slotContent
        };

        const fileValue: IFileContent = {
          path: path.join(
            this.interactionOptions.rootPath,
            this.interactionOptions.speechPath,
            this.NAMESPACE,
            environment,
            "entities",
            `${slotName}_entries_${localeEntity}.json`
          ),
          content: values
        };

        this.fileContent.push(fileDef, fileValue);
      });
  }
}

function hashObj(obj: {}) {
  return uuid(JSON.stringify(obj), uuid.DNS);
}
