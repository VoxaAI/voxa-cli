## Platform

Currently we support 2 platforms: Alexa and Dialog Flow

You need to specify which platform you want to be generated.
* If you need Alexa then use **alexa** as the parameter in your interaction.json.
* If you need DialogFlow then use **dialogFlow** as the parameter in your interaction.json.
* default value is **alexa**.

```js
{
  "local-manifest": ...,
  "platform": ["alexa", "dialogFlow"],
  "content": ...,
  "spreadsheets": ...,
}
```
