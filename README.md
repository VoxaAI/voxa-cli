# voxa-cli

Create interaction model and publishing information for your Alexa skills.

## Install

```
$ npm install --save voxa-cli
```

## Roadmap

| Feature | Description | Completed | Version |
|---------|-------------|:---------:|:-------:|
| **Multicommand support**  | Organize project to support multiple commands | ✅ | 2.0.0 |
| **Command Init** | Allow user to create an empty (default) project for Voxa 3 | ❌ | 2.0.0 |
| **Command Interaction** | Improvements to interaction command | ❌ | 2.0.0 |
| **Typescript** | Move to project to Typescript | ❌ | 2.0.0 |
| **Command Plugins** | List, view info and install plugins for Voxa 3 | ❌ | 2.x.x |
| **Command Init: Templates** | Choose what template want to use to create the project for Voxa 3 | ❌ | 2.x.x |
| **Command Run** | Serve the application on the development Server | ❌ | 2.x.x |

## Getting started

### Create credentials and share your spreadsheet with a client

To programmatically access your spreadsheet, you’ll need to create a service account and OAuth2 credentials from the Google API Console. If you’ve been burned by OAuth2 before, don’t worry; service accounts are way easier to use.

Follow along with the steps and GIF below. You’ll be in and out of the console in 60 seconds.

Go to the Google APIs Console.
Create a new project.
Click Enable API. Search for and enable the Google Drive API.
Create credentials for a Web Server to access Application Data.
Name the service account and grant it a Project Role of Editor.
Download the JSON file.
Copy the JSON file to your code directory and rename it to client_secret.json

![alt text](https://www.twilio.com/blog/wp-content/uploads/2017/03/z5P3Wgwb468knWrP27VvpiWAAfZGuOu3gbxUrmi4RYQ2UmZr3wbDM1qTDEasNgsZYAhkDRQryo2vJ3LpvYekSbqntIG_YhO1RiIpVFmGrBwzDwASc8UTnGruTmnZTVZgAkGxPRgQ.png)

There is one last required step to authorize your app, and it’s easy to miss!

Find the client_email inside client_secret.json. Back in your spreadsheet, click the Share button in the top right, and paste the client email into the People field to give it edit rights. Hit Send.

![alt text](https://www.twilio.com/blog/wp-content/uploads/2017/03/2pzVvPzuNHokBSR2KXoPB9XC15xBF-qBCRJJq0Ut987IkqDVeL3sNdqY2oQj-1V1-2X-SdU33jAuwQ88_XxH703HFpoe7slpVUIniinIqbpz2zD6U2pd77C1iXT0Kzd4qFWb9pI0.png)

Finally copy the client_secret.json in the root of the project. `client_secret.json`

### Interaction.json

Once you have the OAuth2 you should create the interaction.json.
Create a new file on your skill root project `./interaction.json` and paste the following snippet. Replace all the values you need.

```
{
  "local-manifest": {
    "publishingInformation.locales.en-US.name": "Local skill Name",
    "publishingInformation.locales.en-GB.name": "Local skill Name",
    "apis.custom.endpoint.uri": "https://a4a8e881.ngrok.io/skill",
    "events.endpoint.uri": "https://a4a8e881.ngrok.io/skill",
    "apis.custom.endpoint.sslCertificateType": "Wildcard",
    "events.endpoint.sslCertificateType": "Wildcard"
  },
  "platform": ["alexa", "dialogFlow"],
  "content": ["CONTENT_TO_DOWNLOAD_ONE", "CONTENT_TO_DOWNLOAD_TWO"],
  "spreadsheets": ["INTENT SPREADSHEET", "PUBLISHING SPREADSHEET"],
}
```

Finally execute it and voilà :flushed:

```
$ node node_modules/voxa-cli/
```

### Options

* **spreadsheets**: Array of spreadsheets. Each csv should be a interaction model for a specific locale. Spreadsheet can also be about publishing information. Make sure to review [Interaction spreadsheet structure]({{ site.url }}/docs/interaction-spreadsheet) and [Publishing spreadsheet structure]({{ site.url }}/docs/publishing-spreadsheet)
* **content**: other tabs to download. simple table, content description you named!. Make sure to review [content structure]({{ site.url }}/docs/interaction-spreadsheet#tabs-to-download-should-have-the-following-structure)
* **platform**: We currently support Alexa and Dialog Flow interaction models. Make sure to review [platform structure]({{ site.url }}/docs/platform)
* **local-manifest**: Build your own local manifest from the publishing information from the spreadsheets. You can overwrite all the values you want. Make sure to review [Local manifest]({{ site.url }}/docs/local-manifest)


### Other links
 * [Interaction spreadsheet structure]({{ site.url }}/docs/interaction-spreadsheet)
 * [Publishing spreadsheet structure]({{ site.url }}/docs/publishing-spreadsheet)
 * [Content structure]({{ site.url }}/docs/interaction-spreadsheet#tabs-to-download-should-have-the-following-structure)
 * [Local manifest]({{ site.url }}/docs/local-manifest)
 * [Platform]({{ site.url }}/docs/platform)
