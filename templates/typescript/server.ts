import chalk from "chalk";
import * as express from "express";
import * as _ from "lodash";
import { VoxaPlatform } from "voxa";
import {
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
} from "./src/app";
import * as config from "./src/config";

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

_.map(routes, (handler: VoxaPlatform, route: string) => {
  expressApp.post(
    route,
    async (
      req: express.Request,
      res: express.Response,
      next: express.NextFunction
    ) => {
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
