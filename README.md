# voxa-cli

You can create alexa interaction model from csv.

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

### Code

Create a new file on your skill root project `./interaction.json` and paste the following snippets.

```
{
  "local-manifest": {
    "publishingInformation.locales.en-US.name": "Local MARS",
    "publishingInformation.locales.en-GB.name": "Local MARS",
    "apis.custom.endpoint.uri": "https://a4a8e881.ngrok.io/skill",
    "events.endpoint.uri": "https://a4a8e881.ngrok.io/skill",
    "apis.custom.endpoint.sslCertificateType": "Wildcard",
    "events.endpoint.sslCertificateType": "Wildcard"
  },
  "content": ["CONTENT_TO_DOWNLOAD_ONE", "CONTENT_TO_DOWNLOAD_TWO"],
  "spreadsheets": ["INTENT SPREADSHEET", "PUBLISHING SPREADSHEET"],
  "auth": {
    "type": "service_account",
    "project_id": "XXXXX",
    "private_key_id": "XXXX",
    "private_key": "XXXX",
    "client_email": "XXXXX",
    "client_id": "XXXX",
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://accounts.google.com/o/oauth2/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_x509_cert_url": "XXXX"
  }
}

```


Finally execute it and voilà :flushed:

`$ node node_modules/voxa-cli/`

### Options

* **spreadsheets**: Array of spreadsheets. Each csv should be a interaction model for a specific locale. Spreadsheet can also be about publishing information
* **auth**: Credentials to connect to your spreadsheet.

### Spreadsheet interaction model structure
You can take a look at `example-interaction-model.xlsx` in the root of the repository
* Spreadsheet must contain a valid local on it's name eg. `MySkill - Intents & Utterances-en-US`. Valid Locales are (['en-US','en-GB', 'de-DE'])
* Tab for intent must be named `INTENT`
* Tab for utterances must be named `UTTERANCES` eg. `UTTERANCES_MAIN`, `UTTERANCES_HELP`
* Tab for slots must contain `LIST_OF_` eg. `LIST_OF_TERMS`.
* If your slots contains synonym add a column named synonym
* Tab for invocation name must be named `INVOCATION_NAMES`

* slots must have the following Structure

LIST_OF_TERMS | synonym
--- | ---
rain | rain
rainy day | rain
rainstorm | rain
rainfall | rain

* Utterances must have the following structure

LaunchIntent | AMAZON.YesIntent
--- | ---
LaunchIntent | AMAZON.YesIntent
start | ohh yes
give me something | yeah
put some fireworks | here we go

* Invocation names must have the following structure

invocationName | environment
--- | ---
lost in production | production
lost in development | development

* Intent must have the following structure

intent | slotType | slotName | environment
--- | --- | --- | --- |
LaunchIntent | | | |
SuperIntent | LIST_OF_REQUESTS | {request} |  |
TestIntent | LIST_OF_REQUESTS | {request} | development |

> In this case Test Intent will only be available at development interaction model

* Tabs to download should have the following structure


columnName | columnNameTwo | columnNameThree | columnNameFour
--- | --- | --- | --- |
columnName | columnNameTwo | columnNameThree | columnNameFour
itemAttr | itemAttrTwo | itemAttrThree | itemAttrFour

> it must have 2 column rows. Known bug at spreadsheet npm package


### Spreadsheet publishing information structure
You can take a look at `example-publishing-infroamtion.xlsx` in the root of the repository
* Tab for General skill information must be named `SKILL_GENERAL_INFORMATION`
* Tab for information base on locale must be name `SKILL_LOCALE_INFORMATION-en-US`
* Tab for diferent variables based on environment must be named `SKILL_ENVIRONMENTS_INFORMATION`

* SKILL_GENERAL_INFORMATION

option | value | key
--- | --- | ---
Skill Information - Interfaces - Audio Player | FALSE | apis.interfaces[].type.AUDIO_PLAYER
Skill Information - Interfaces - Render Template | TRUE | apis.interfaces[].type.RENDER_TEMPLATE
Configuration - SSL Certificate |	Trusted |	api.custom.endpoint.sslCertificateType
Publishing Information - Testing instructions	| Some testing instructions |	publishingInformation.testingInstructions
Publishing Information - Category |	GAMES	| publishingInformation.category

> [For a complete option](https://developer.amazon.com/docs/smapi/skill-manifest.html)

* SKILL_LOCALE_INFORMATION-en-US

option | value | key
--- | --- | ---
Skill Information - Name | Skill Information - Name |	publishingInformation.locales.name
Publishing Information - Short Skill Description | Publishing Information - Short Skill Description |	publishingInformation.locales.summary
Publishing Information - Full Skill Description	| Publishing Information - Full Skill Description |	publishingInformation.locales.description
Publishing Information - Example Phrase 1 |	Alexa, open skill |	publishingInformation.locales.examplePhrases[]
Publishing Information - Example Phrase 2 |	Alexa, launch skill |	publishingInformation.locales.examplePhrases[]
Publishing Information - Example Phrase 3 |	Alexa, tell skill |	publishingInformation.locales.examplePhrases[]
Publishing Information - Keywords |	amazon, alexa, skill |	publishingInformation.locales.keywords

* SKILL_ENVIRONMENTS_INFORMATION

option | value | key
--- | --- | ---
api.custom.endpoint.uri |	arn:aws:lambda:us-east-1:XXXXX:function:development-skill	| development
api.custom.endpoint.uri |	arn:aws:lambda:us-east-1:XXXXX:function:production-skill | production
