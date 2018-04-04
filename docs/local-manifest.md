## Local Manifest

The local manifest key allows you to have a local copy of the publishing information with your own values.
Let's say you need to have a local skill setup for your local development environment. This local setup should have custom invocation name a title.
Here is a basic example in the `interaction.json`.


```javascript
{
  "local-manifest": {
    "publishingInformation.locales.en-US.name": "Skill Name in en-US",
    "apis.custom.endpoint.uri": "https://xxxxx.ngrok.io/skill",
    "events.endpoint.uri": "https://xxxxx.ngrok.io/skill",
    "apis.custom.endpoint.sslCertificateType": "Wildcard",
    "events.endpoint.sslCertificateType": "Wildcard"
  },
  ...
}

```
