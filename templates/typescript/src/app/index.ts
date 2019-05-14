import {
  AlexaPlatform,
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
import Model from "./model";
{{#if saveUserInfo }}
import { User } from "../services/User";
{{/if}}
import { register as states } from "./states";
import * as variables from "./variables";
import * as views from "./views.json";

export const voxaApp = new VoxaApp({ Model, views, variables{{#if canfulfill }}, defaultFulfillIntents{{/if}} });
export const alexa = new AlexaPlatform(voxaApp);
export const alexaLambda = alexa.lambda();
export const handler = alexa.lambda();

states(voxaApp);

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
