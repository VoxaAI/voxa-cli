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
/* tslint:disable:no-empty */
import * as _Promise from "bluebird";
import * as _ from "lodash";
import * as path from "path";
import { IIntent, Schema } from "./Schema";
import { IVoxaSheet } from "./VoxaSheet";

const NAMESPACE = "alexa";
const AVAILABLE_LOCALES = [
  "en-US",
  "en-GB",
  "en-CA",
  "en-AU",
  "en-IN",
  "de-DE",
  "ja-JP",
  "es-ES",
  "es-MX",
  "fr-FR",
  "fr-CA",
  "it-IT",
  "pt-BR"
];

export class AlexaSchema extends Schema {
  public environment = "staging";

  constructor(voxaSheets: IVoxaSheet[], interactionOptions: any) {
    super(NAMESPACE, AVAILABLE_LOCALES, voxaSheets, interactionOptions);
  }

  public validate() {}

  public build(locale: string, environment: string) {
    this.buildLanguageModel(locale, environment);
    this.buildPublishing(environment);
  }

  public buildPublishing(environment: string) {
    const manifest = this.mergeManifest(environment);
    _.set(manifest, "manifestVersion", "1.0");

    this.fileContent.push({
      path: path.join(
        this.interactionOptions.rootPath,
        this.interactionOptions.speechPath,
        this.NAMESPACE,
        `${_.kebabCase(environment)}-manifest.json`
      ),
      content: { manifest }
    });
  }
  public contentLanguageModel(locale: string, environment: string) {
    const invocation = _.find(this.invocations, { locale, environment });
    const invocationName = _.get(invocation, "name", "Skill with no name");

    const intents = this.getIntentsDefinition(locale, environment);
    const types = this.getSlotsByIntentsDefinition(locale, environment).map(rawSlot => {
      const { name, values } = rawSlot;
      const slot = { name, values: values.map(value => ({ name: value })) };
      return slot;
    });

    return { interactionModel: { languageModel: { invocationName, intents, types } } };
  }
  public buildLanguageModel(locale: string, environment: string) {
    this.fileContent.push({
      path: path.join(
        this.interactionOptions.rootPath,
        this.interactionOptions.speechPath,
        this.NAMESPACE,
        locale,
        `${_.kebabCase(environment)}-interaction.json`
      ),
      content: this.contentLanguageModel(locale, environment)
    });

    const canFulfillIntents = _.chain(this.intentsByPlatformAndEnvironments(locale, environment))
      .filter("canFulfillIntent")
      .map("name")
      .value();

    this.fileContent.push({
      path: path.join(
        this.interactionOptions.rootPath,
        this.interactionOptions.contentPath,
        `${_.kebabCase(environment)}-canfulfill-intents.json`
      ),
      content: canFulfillIntents
    });
  }
}
