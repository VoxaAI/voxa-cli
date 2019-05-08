const {
  AlexaPlatform,
  plugins,
  VoxaApp
} = require("voxa");

{{#if canfulfill }}
const defaultFulfillIntents = require("../../content/en-US/canfulfill-intent.json");
{{/if}}
const Model = require("./model");
const states = require("./states").register;
const variables = require("./variables");
const views = require("./views.json");

exports.voxaApp = new VoxaApp({ Model, views, variables{{#if canfulfill }}, defaultFulfillIntents{{/if}} });
exports.alexa = new AlexaPlatform(voxaApp);
exports.alexaLambda = alexa.lambda();
exports.handler = alexa.lambda();

states(voxaApp);

plugins.replaceIntent(voxaApp);
