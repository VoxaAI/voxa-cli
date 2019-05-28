import {
  {{#if usesAlexa}}
  AlexaPlatform,
  {{/if}}
  {{#if usesTelegram}}
  DialogflowPlatform,
  {{/if}}
  {{#if usesFacebook}}
  FacebookPlatform,
  {{/if}}
  {{#if usesGoogleAssistant}}
  GoogleAssistantPlatform,
  {{/if}}
  {{#if saveUserInfo }}
  IVoxaEvent,
  {{/if}}
  plugins,
  VoxaApp
} from "voxa";
{{#if chatbase }}
import * as voxaChatbase from "voxa-chatbase";
{{/if}}
{{#if dashbot }}
import { register as voxaDashbot } from "voxa-dashbot";
{{/if}}
{{#if ga }}
import * as voxaGA from "voxa-ga";
{{/if}}
import * as config from "../config";
{{#if canfulfill }}
import * as defaultFulfillIntents from "../../content/en-US/canfulfill-intent.json";
{{/if}}
{{#if saveUserInfo }}
import { User } from "../services/User";
{{/if}}
import Model from "./model";
import { register as states } from "./states";
import * as variables from "./variables";
import * as views from "./views.json";

export const voxaApp = new VoxaApp({ Model, views, variables{{#if canfulfill }}, defaultFulfillIntents{{/if}} });
states(voxaApp);

{{#if usesAlexa}}
export const alexaSkill = new AlexaPlatform(voxaApp);
{{/if}}
{{#if usesTelegram}}
export const telegramBot = new DialogflowPlatform(voxaApp);
{{/if}}
{{#if usesFacebook}}
export const facebookBot = new FacebookPlatform(voxaApp);
{{/if}}
{{#if usesGoogleAssistant}}
export const assistantAction = new GoogleAssistantPlatform(voxaApp);
{{/if}}

plugins.replaceIntent(voxaApp);
{{#if ga }}
voxaGA(voxaApp, config.googleAnalytics);
{{/if}}
{{#if dashbot }}
voxaDashbot(voxaApp, config.dashbot);
{{/if}}
{{#if chatbase }}
voxaChatbase(voxaApp, config.chatbase);
{{/if}}
{{#if saveUserInfo }}

/**
 * Load User into the model
 */
voxaApp.onRequestStarted(async (voxaEvent: IVoxaEvent) => {
  const user = await User.get(voxaEvent);

  const model = voxaEvent.model as Model;
  model.user = user;
});

/**
 * Update the session count
 */
voxaApp.onSessionStarted(async (voxaEvent: IVoxaEvent) => {
  const user: User = voxaEvent.model.user;
  user.newSession();
});

/**
 * Save the user
 */
voxaApp.onBeforeReplySent(async (voxaEvent: IVoxaEvent) => {
    const user: User = voxaEvent.model.user;

    await user.save({ userId: voxaEvent.user.userId });
  }
);
{{/if}}
