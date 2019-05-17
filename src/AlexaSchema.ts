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
import { IIntent, ISlotDefinition, Schema } from "./Schema";
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
  "es-US",
  "fr-FR",
  "fr-CA",
  "it-IT",
  "pt-BR"
];

export interface IVariation {
  type: "PlainText" | "SSML";
  value: string;
}

export interface IPrompt {
  id: string;
  variations: IVariation[];
}

export interface IDialogSlotPrompt {
  elicitation?: string;
  confirmation?: string;
}

export interface IDialogSlot {
  name: string;
  type: string;
  elicitationRequired: boolean;
  confirmationRequired: boolean;
  prompts?: IDialogSlotPrompt;
}

export type DelegationStrategy = "SKILL_RESPONSE" | "ALWAYS";

export interface IDialogIntent {
  name: string;
  delegationStrategy?: DelegationStrategy;
  confirmationRequired: boolean;
  slots: IDialogSlot[];
  prompts?: {
    confirmation?: string;
  };
}

export interface IInteractionModelSlot {
  name: string;
  type: string;
  samples: string[];
}

export interface IDialog {
  intents: IDialogIntent[];
  delegationStrategy: DelegationStrategy;
}

export interface IInteractionModelIntent {
  name: string;
  samples: string[];
  slots: IInteractionModelSlot[];
}

export interface IInteractionModelTypeValue {
  name: {
    value: string;
    synonyms: string[];
  };
}

export interface IInteractionModelType {
  name: string;
  values: IInteractionModelTypeValue[];
}

export interface IInteractionModel {
  interactionModel: {
    languageModel: {
      invocationName: string;
      intents: IInteractionModelIntent[];
      types: IInteractionModelType[];
    };
    dialog?: IDialog;
    prompts?: IPrompt[];
  };
}

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
  public contentLanguageModel(locale: string, environment: string): IInteractionModel {
    const invocation = _.find(this.invocations, { locale, environment });
    const invocationName = _.get(invocation, "name", "Skill with no name");

    const intents = this.getIntentsDefinition(locale, environment);
    const types = this.getSlotsByIntentsDefinition(locale, environment).map(rawSlot => {
      const { name, values } = rawSlot;
      const slot = { name, values: values.map(value => ({ name: value })) };
      return slot;
    });

    const dialog: IDialog = {
      intents: this.generateDialogModel(this.intentsByPlatformAndEnvironments(locale, environment)),
      delegationStrategy: "SKILL_RESPONSE"
    };

    const prompts: IPrompt[] = this.generatePrompts(
      this.intentsByPlatformAndEnvironments(locale, environment)
    );

    return {
      interactionModel: {
        languageModel: { invocationName, intents, types },
        dialog,
        prompts
      }
    };
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

  private generateDialogModel(intents: IIntent[]): IDialogIntent[] {
    return _(intents)
      .filter(intent => {
        if (intent.confirmationRequired || intent.delegationStrategy) {
          return true;
        }

        const slotRequiresDialog = _(intent.slotsDefinition)
          .map(slot => slot.requiresElicitation || slot.requiresConfirmation)
          .some();

        return slotRequiresDialog;
      })
      .map(
        (intent): IDialogIntent => {
          const prompts: IDialogSlotPrompt = {};
          if (intent.confirmations.length > 0) {
            prompts.confirmation = `Confirmation.Intent.${hashObj(intent.confirmations)}`;
          }
          return {
            name: intent.name,
            delegationStrategy: intent.delegationStrategy,
            confirmationRequired: intent.confirmationRequired,
            slots: this.generateDialogSlotModel(intent.slotsDefinition),
            prompts
          };
        }
      )
      .value();
  }

  private generateDialogSlotModel(slots: ISlotDefinition[]): IDialogSlot[] {
    return _(slots)
      .map(
        (slot: ISlotDefinition): IDialogSlot => {
          const prompts: IDialogSlotPrompt = {};
          if (slot.prompts.elicitation.length > 0) {
            prompts.elicitation = `Elicitation.Slot.${hashObj(slot.prompts.elicitation)}`;
          }

          if (slot.prompts.confirmation.length > 0) {
            prompts.confirmation = `Confirmation.Slot.${hashObj(slot.prompts.confirmation)}`;
          }

          return {
            name: slot.name.replace("{", "").replace("}", ""),
            type: slot.type,
            elicitationRequired: slot.requiresElicitation,
            confirmationRequired: slot.requiresConfirmation,
            prompts
          };
        }
      )
      .value();
  }

  private generatePrompts(intents: IIntent[]): IPrompt[] {
    const intentPrompts: IPrompt[] = _(intents)
      .filter((intent: IIntent): boolean => intent.confirmations.length > 0)
      .map(
        (intent: IIntent): IPrompt => {
          return {
            id: `Confirmation.Intent.${hashObj(intent.confirmations)}`,
            variations: this.formatVariations(intent.confirmations)
          };
        }
      )
      .value();

    const slotPrompts: IPrompt[] = _(intents)
      .map("slotsDefinition")
      .flatten()
      .filter(
        (slot: ISlotDefinition): boolean =>
          slot.prompts.confirmation.length > 0 || slot.prompts.elicitation.length > 0
      )
      .map(
        (slot: ISlotDefinition): IPrompt[] => {
          const prompts: IPrompt[] = [];
          if (slot.prompts.confirmation.length > 0) {
            prompts.push({
              id: `Confirmation.Slot.${hashObj(slot.prompts.confirmation)}`,
              variations: this.formatVariations(slot.prompts.confirmation)
            });
          }

          if (slot.prompts.elicitation.length > 0) {
            prompts.push({
              id: `Elicitation.Slot.${hashObj(slot.prompts.elicitation)}`,
              variations: this.formatVariations(slot.prompts.elicitation)
            });
          }

          return prompts;
        }
      )
      .flatten()
      .value();

    return _.concat(intentPrompts, slotPrompts);
  }

  private formatVariations(variations: string[]): IVariation[] {
    return _.map(
      variations,
      (variation): IVariation => ({
        type: "PlainText",
        value: variation
      })
    );
  }
}

function hashObj(obj: any): string {
  return uuid(JSON.stringify(obj), uuid.DNS);
}
