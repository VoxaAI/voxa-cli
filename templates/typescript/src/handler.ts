import "source-map-support/register";
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
} from "./app";

{{#if usesAlexa}}
export const alexaHandler = alexaSkill.lambda();
{{/if}}
{{#if usesGoogleAssistant}}
export const assistantHandler = assistantAction.lambdaHTTP();
{{/if}}
{{#if usesFacebook}}
export const facebookHandler = facebookBot.lambdaHTTP();
{{/if}}
{{#if usesTelegram}}
export const telegramHandler = telegramBot.lambdaHTTP();
{{/if}}
