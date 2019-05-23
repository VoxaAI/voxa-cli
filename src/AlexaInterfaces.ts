/*
 * Copyright (c) 2019 Rain Agency <contact@rain.agency>
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
