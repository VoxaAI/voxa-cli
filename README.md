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

Create a new file on your skill project `skill-directory/scripts/interaction.js` and paste the following snippets.

```
'use strict';

const voxaCli = require('voxa-cli');

voxaCli({
  spreadsheets: ['A SPREADSHEET ID', 'ANOTHER SPREADSHEET ID'],
  speechPath: 'skill-directory/speech-assets',
  synonymPath: 'skill-directory/synonyms',
  auth: require('./client_secret'),
  validate: true })
.then(() => console.log('voxa cli - finish successfully!'));
```


Finally execute it and voilà :flushed: 
`$ node skill-directory/scripts/interaction.js`

### Options

* **spreadsheets**: Array of spreadsheets. Each csv should be a interaction model for a specific locale.
* **speechPath**: Path to save the interaction model. It will generate slots, intents, sample utterances, model and skill builder model.
* **synonymPath**: If your slots have synonyms it will save it to this path.
* **auth**: Credentials to connect to your spreadsheet.
* **validate**: Default false, if true it will run your some test around your interaction model.

### Spreadsheet structure

* Spreadsheet must contain a valid local on it's name eg. `MySkill - Intents & Utterances-en-US`. Valid Locales are (['en-US','en-GB', 'de-DE'])
* Tab for intent should be named `INTENT`
* Tab for utterances should be named `UTTERANCES` eg. `UTTERANCES_MAIN`, `UTTERANCES_HELP`
* Tab for slots should contain `LIST_OF_` eg. `LIST_OF_TERMS`.
* If your slots contains synonym add a column named synonym

LIST_OF_TERMS | synonym
--- | ---
rain | rain
rainy day | rain
rainstorm | rain
rainfall | rain

* Utterances should have the following structure

LaunchIntent | AMAZON.YesIntent
--- | ---
LaunchIntent | AMAZON.YesIntent
start | ohh yes
give me something | yeah
put some fireworks | here we go


### Use a private repo as npm

In your private npm modules add
```
{
    "name": "myapp",
    "dependencies": {
        "voxa-cli": "git+ssh://git@github.com:myaccount/myprivate.git",
    }
}
```
