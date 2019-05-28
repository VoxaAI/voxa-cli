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
{{#if accountLinking}}
import accountLinkingRoutes from "./web/routes";
{{/if}}

export const expressApp = express();
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
  _.map(routes, (handler: VoxaPlatform, route: string) => {
    expressApp.post(
      route,
      async (
        req: express.Request,
        res: express.Response,
        next: express.NextFunction
      ) => {
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

expressApp.listen(config.server.port);
