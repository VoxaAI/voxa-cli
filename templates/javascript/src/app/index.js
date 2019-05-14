const { AlexaPlatform, plugins, VoxaApp } = require("voxa");
{{#if ga }}
const voxaGA = require("voxa-ga");
{{/if}}
{{#if dashbot }}
const voxaDashbot = require("voxa-dashbot").register;
{{/if}}
{{#if chatbase }}
const voxaChatbase = require("voxa-chatbase");
{{/if}}
const config = require("../config");
{{#if canfulfill }}
const defaultFulfillIntents = require("../../content/en-US/canfulfill-intent.json");
{{/if}}
const Model = require("./model");
{{#if saveUserInfo }}
const User = require("../services/User");
{{/if}}
const states = require("./states");
const variables = require("./variables");
const views = require("./views.json");

const voxaApp = new VoxaApp({ Model, views, variables{{#if canfulfill }}, defaultFulfillIntents{{/if}} });
const alexa = new AlexaPlatform(voxaApp);
const alexaLambda = alexa.lambda();
const handler = alexa.lambda();

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
voxaApp.onRequestStarted(async (voxaEvent) => {
  const user = await User.get(voxaEvent);

  voxaEvent.model.user = user;
});

/**
 * Update the session count
 */
voxaApp.onSessionStarted(async (voxaEvent) => {
  const user = voxaEvent.model.user;
  user.newSession();
});

/**
 * Save the user
 */
voxaApp.onBeforeReplySent(async (voxaEvent) => {
    const user = voxaEvent.model.user;

    await user.save({ userId: voxaEvent.user.userId });
  }
);
{{/if}}

module.exports = {
  voxaApp,
  alexa,
  alexaLambda,
  handler,
};
