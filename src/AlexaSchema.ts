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
import {
  DelegationStrategy,
  IDialog,
  IDialogIntent,
  IDialogSlot,
  IDialogSlotPrompt,
  IInteractionModel,
  IInteractionModelIntent,
  IInteractionModelSlot,
  IInteractionModelType,
  IInteractionModelTypeValue,
  IPrompt,
  IVariation
} from "./AlexaInterfaces";
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
    const types = this.getSlotsByIntentsDefinition(locale, environment).map(rawSlot => ({
      name: rawSlot.name,
      values: rawSlot.values.map(value => ({ name: value }))
    }));

    let dialog: IDialog | undefined = {
      intents: this.generateDialogModel(this.intentsByPlatformAndEnvironments(locale, environment)),
      delegationStrategy: "SKILL_RESPONSE"
    };

    if (!dialog.intents.length) {
      dialog = undefined;
    }

    let prompts: IPrompt[] | undefined = this.generatePrompts(
      this.intentsByPlatformAndEnvironments(locale, environment)
    );
    if (!prompts.length) {
      prompts = undefined;
    }

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
      .filter(intentOrSlotRequireDialog)
      .map(
        (intent): IDialogIntent => {
          const prompts: IDialogSlotPrompt = {};
          if (intent.confirmations.length > 0) {
            prompts.confirmation = getPromptId("Confirmation", "Intent", intent.confirmations);
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
            prompts.elicitation = getPromptId("Elicitation", "Slot", slot.prompts.elicitation);
          }

          if (slot.prompts.confirmation.length > 0) {
            prompts.confirmation = getPromptId("Confirmation", "Slot", slot.prompts.confirmation);
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
      .filter(intentHasPrompts)
      .map(
        (intent: IIntent): IPrompt =>
          getPromptsObject("Confirmation", "Intent", intent.confirmations)
      )
      .value();

    const slotPrompts = this.generateSlotPrompts(intents);

    return _.concat(intentPrompts, slotPrompts);
  }

  private generateSlotPrompts(intents: IIntent[]): IPrompt[] {
    return _(intents)
      .map("slotsDefinition")
      .flatten()
      .filter(slotHasPrompts)
      .map((slot: ISlotDefinition): IPrompt[] => {
        const prompts: IPrompt[] = [];
        if (slot.prompts.confirmation.length > 0) {
          prompts.push(getPromptsObject("Confirmation", "Slot", slot.prompts.confirmation));
        }

        if (slot.prompts.elicitation.length > 0) {
          prompts.push(getPromptsObject("Elicitation", "Slot", slot.prompts.elicitation));
        }

        return prompts;
      })
      .flatten()
      .value();
  }
}

function hashObj(obj: any): string {
  return uuid(JSON.stringify(obj), uuid.DNS);
}

function intentOrSlotRequireDialog(intent: IIntent): boolean {
  if (intent.confirmationRequired || intent.delegationStrategy) {
    return true;
  }

  const slotRequiresDialog = _(intent.slotsDefinition)
    .map(slot => slot.requiresElicitation || slot.requiresConfirmation)
    .some();

  return slotRequiresDialog;
}

function slotHasPrompts(slot: ISlotDefinition): boolean {
  return slot.prompts.confirmation.length > 0 || slot.prompts.elicitation.length > 0;
}

function intentHasPrompts(intent: IIntent): boolean {
  return intent.confirmations.length > 0;
}

function getPromptsObject(
  dialogType: "Elicitation" | "Confirmation",
  objectType: "Slot" | "Intent",
  data: string[]
): IPrompt {
  return {
    id: getPromptId(dialogType, objectType, data),
    variations: formatVariations(data)
  };
}

function getPromptId(
  dialogType: "Elicitation" | "Confirmation",
  objectType: "Slot" | "Intent",
  data: string[]
): string {
  return `${dialogType}.${objectType}.${hashObj(data)}`;
}

function formatVariations(variations: string[]): IVariation[] {
  return _.map(
    variations,
    (variation): IVariation => ({
      type: "PlainText",
      value: variation
    })
  );
}
