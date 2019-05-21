const chalk = require("chalk");
const express = require("express");
const _ = require("lodash");
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

const expressApp = express();
expressApp.use(express.json());

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

_.map(routes, (handler, route) => {
  expressApp.post(
    route,
    async (req, res, next) => {
      try {
        console.log(chalk.cyan(JSON.stringify(req.body, null, 2)));
        const reply = await handler.execute(req.body);

        console.log(chalk.green(JSON.stringify(reply, null, 2)));
        res.json(reply);
      } catch (e) {
        next(e);
      }
    }
  );
});

expressApp.listen(config.server.port);
