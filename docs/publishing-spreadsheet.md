## Spreadsheet publishing information structure
You can take a look at `example-publishing-information.xlsx` in the root of the repository
* Tab for General skill information must be named `SKILL_GENERAL_INFORMATION`
* Tab for information base on locale must be name `SKILL_LOCALE_INFORMATION-en-US`
* Tab for diferent variables based on environment must be named `SKILL_ENVIRONMENTS_INFORMATION`

### SKILL_GENERAL_INFORMATION

option | value | key
--- | --- | ---
Skill Information - Interfaces - Audio Player | FALSE | apis.interfaces[].type.AUDIO_PLAYER
Skill Information - Interfaces - Render Template | TRUE | apis.interfaces[].type.RENDER_TEMPLATE
Configuration - SSL Certificate |	Trusted |	api.custom.endpoint.sslCertificateType
Publishing Information - Testing instructions	| Some testing instructions |	publishingInformation.testingInstructions
Publishing Information - Category |	GAMES	| publishingInformation.category

> [For a complete option](https://developer.amazon.com/docs/smapi/skill-manifest.html)

### SKILL_LOCALE_INFORMATION-en-US

option | value | key
--- | --- | ---
Skill Information - Name | Skill Information - Name |	publishingInformation.locales.name
Publishing Information - Short Skill Description | Publishing Information - Short Skill Description |	publishingInformation.locales.summary
Publishing Information - Full Skill Description	| Publishing Information - Full Skill Description |	publishingInformation.locales.description
Publishing Information - Example Phrase 1 |	Alexa, open skill |	publishingInformation.locales.examplePhrases[]
Publishing Information - Example Phrase 2 |	Alexa, launch skill |	publishingInformation.locales.examplePhrases[]
Publishing Information - Example Phrase 3 |	Alexa, tell skill |	publishingInformation.locales.examplePhrases[]
Publishing Information - Keywords |	amazon, alexa, skill |	publishingInformation.locales.keywords

### SKILL_ENVIRONMENTS_INFORMATION

option | value | key
--- | --- | ---
api.custom.endpoint.uri |	arn:aws:lambda:us-east-1:XXXXX:function:development-skill	| development
api.custom.endpoint.uri |	arn:aws:lambda:us-east-1:XXXXX:function:production-skill | production
