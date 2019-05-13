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

module.exports = {
  voxaApp,
  alexa,
  alexaLambda,
  handler,
};
