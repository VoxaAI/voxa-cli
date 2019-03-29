## Platform

Currently we support 2 platforms: Alexa and Dialog Flow

You need to specify which platform you want to be generated.

- If you need Alexa then use **alexa** as the parameter in your interaction.json.
- If you need Dialogflow then use **dialogflow** as the parameter in your interaction.json.
- default value is **alexa**.

```js
{
  "platform": ["alexa", "dialogflow"],
  "spreadsheets": ...,
}
```
