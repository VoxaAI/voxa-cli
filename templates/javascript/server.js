const express = require("express");
const _ = require("lodash");
const chalk = require("chalk");
const {
  {{#if usesAlexa}}
  alexaSkill,
  {{/if}}
  {{#if usesGoogleAssistant}}
  assistantAction,
  {{/if}}
  {{#if usesFacebook}}
  facebookBot,
  {{/if}}
  {{#if usesTelegram}}
  telegramBot,
  {{/if}}
} = require("./src/app");
const config = require("./src/config");
{{#if accountLinking}}
const accountLinkingRoutes = require("./web/routes");
{{/if}}

const expressApp = express();
expressApp.use(express.json());
{{#if accountLinking}}
expressApp.use(express.urlencoded({ extended: true }));
expressApp.use(express.static(__dirname + "/web/public"));
expressApp.set("views", __dirname + "/web/views");
expressApp.set("view engine", "ejs");
{{/if}}


const routes = {
  {{#if usesAlexa}}
  "/alexa": alexaSkill,
  {{/if}}
  {{#if usesFacebook}}
  "/facebook": facebookBot,
  {{/if}}
  {{#if usesGoogleAssistant}}
  "/googleAction": assistantAction,
  {{/if}}
  {{#if usesTelegram}}
  "/telegram": telegramBot,
  {{/if}}
};

if (config.server.hostSkill) {
  _.map(routes, (handler, route) => {
    expressApp.post(
      route,
      async (req, res, next) => {
        try {
          const reply = await handler.execute(req.body);
          res.json(reply);
        } catch (e) {
          next(e);
        }
      }
    );
  });
}
{{#if accountLinking}}
expressApp.use(accountLinkingRoutes);
{{/if}}

expressApp.listen(config.server.port, () => {
  console.log("");
  console.log(chalk.green("Listening on:"));
  console.log("");
  Object.keys(routes).forEach((route) => {
    console.log(chalk.green(`localhost:${config.server.port}${route}`));
  });
});
exports.expressApp = expressApp;
