const { AlexaPlatform, plugins, VoxaApp } = require("voxa");
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

module.exports = {
  voxaApp,
  alexa,
  alexaLambda,
  handler,
};
