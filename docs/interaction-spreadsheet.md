## Spreadsheet interaction model structure

You can take a look at `example-interaction-model.xlsx` in the root of the repository

- Spreadsheet must contain a valid local on it's name eg. `MySkill - Intents & Utterances-en-US`. Valid Locales are (['en-US','en-GB', 'de-DE'])
- Tab for intent must be named `INTENT`
- Tab for utterances must be named `UTTERANCES` eg. `UTTERANCES_MAIN`, `UTTERANCES_HELP`
- Tab for slots must contain `LIST_OF_` eg. `LIST_OF_TERMS`.
- If your slots contains synonym add a column named synonym
- Tab for invocation name must be named `INVOCATION_NAMES`
- Tab for downloads name must be named `DOWNLOAD_`

### slots must have the following Structure

| LIST_OF_TERMS | synonym |
| ------------- | ------- |
| rain          | rain    |
| rainy day     | rain    |
| rainstorm     | rain    |
| rainfall      | rain    |

### Utterances must have the following structure

| LaunchIntent       | AMAZON.YesIntent |
| ------------------ | ---------------- |
| start              | ohh yes          |
| give me something  | yeah             |
| put some fireworks | here we go       |

### Invocation names must have the following structure

| invocationName      | environment |
| ------------------- | ----------- |
| lost in production  | production  |
| lost in development | development |

### Intent must have the following structure

| intent       | slotType         | slotName  | environment | events                 | platformIntent | canFulfillIntent | webhookForSlotFilling |
| ------------ | ---------------- | --------- | ----------- | ---------------------- | -------------- | ---------------- | --------------------- |
| LaunchIntent |                  |           |             |                        |                | YES              |                       |
| SuperIntent  | LIST_OF_REQUESTS | {request} |             | actions_intent_CANCEL  |                | YES              |                       |
| TestIntent   | LIST_OF_REQUESTS | {request} | development | actions_intent_SIGN_IN | dialogflow     |                  | YES                   |

> In this case Test Intent will only be available at development interaction model
> Note for multiple events use comas (,) to separate them

### Tabs to download should have the following structure

| columnName | columnNameTwo | columnNameThree | columnNameFour |
| ---------- | ------------- | --------------- | -------------- |
| itemAttr   | itemAttrTwo   | itemAttrThree   | itemAttrFour   |

> it must have 2 column rows. Known bug at spreadsheet npm package
