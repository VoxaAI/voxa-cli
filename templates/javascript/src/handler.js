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
} = require("./app");

{{#if usesAlexa}}
exports.alexaHandler = alexaSkill.lambda();
{{/if}}
{{#if usesGoogleAssistant}}
exports.assistantHandler = assistantAction.lambdaHTTP();
{{/if}}
{{#if usesFacebook}}
exports.facebookHandler = facebookBot.lambdaHTTP();
{{/if}}
{{#if usesTelegram}}
exports.telegramHandler = telegramBot.lambdaHTTP();
{{/if}}
