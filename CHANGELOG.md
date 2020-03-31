# Changelog

All notable changes to this project will be documented in this file

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [unreleased]

## [2.3.1]- [Tag](https://github.com/VoxaAI/voxa-cli/releases/tag/2.3.1) - 2020-03-31

### Fixed

- Fixed issue with missing .gitignore file when generating a new project

## [2.3.0] - [Tag](https://github.com/VoxaAI/voxa-cli/releases/tag/2.3.0) - 2020-03-27

### Added

- Added intent keys: parameterName and parameterValue
- Added tests
- Updated spreadsheet files
- Added Google analytics to views

### Fixed

- Fixed true utterance to string

## [2.2.2] - [Tag](https://github.com/VoxaAI/voxa-cli/releases/tag/2.2.2) - 2020-02-05

### Added

- Parse number values (height and width) in supportedViewports for Alexa Skill Manifest
- Update nvmrc on Javascript project to v10
- Added nvmrc to Typescript project with v10
- Update packages, lint and refactor
- Update documentation, fix broken links

### Fixed

- Fixed misspelled DynamoDB key on serverless yml file

## [2.2.1] - [Tag](https://github.com/VoxaAI/voxa-cli/releases/tag/2.2.1) - 2019-09-17

### Added

- Added prompt to check if the project should be generated in the same folder or not.

### Fixed

- When building the alexa interaction model there was a bug where even when empty the Dialog property was still being included, that's fixed now

## [2.2.0] - [Tag](https://github.com/VoxaAI/voxa-cli/releases/tag/2.2.0) - 2019-06-10

### Added

- Added support for per slot utterances in alexa (this is the beginning of dialog support)
- Added feature to generate a full Voxa 3 project in Typescript or Javascript. Generate boilerplate code with linting, analytics, serverless, suppport for all available platforms, save/get user information from DynamoDB, account linking.
- Added alexa dialog model implementation
- Added new spreadsheets keys for specific platforms in the interaction.json (alexaSpreadsheets, dialogflowSpreadsheets)

### Fixed

- Now alexa spec is splitted into smaller units testing specific functionality
- Fixed @sys. slots on dialogflow were converted into a different type
- Fixed issue on path option on the interaction command
- Fixed issue with platforms undefined
- Fixed empty columns on excel

## [2.1.2] - [Tag](https://github.com/VoxaAI/voxa-cli/releases/tag/2.1.2) - 2019-05-08

### Added

- Added more locales to Alexa and Dialogflow
- Added support for webhookForSlotFilling (dialogflow)
- Added support for webhookUsed (dialogflow)
- Added support for intent responses (dialogflow)
- Added support for required slots

### Fixed

- Fixed views overwriting existing array
- Fixed error on publishing information overwriting keys
- Filter out empty rows when processing a local spreadsheet
- Fixed empty suggestion chip on VUI
- Fixed overlap on utterance and slots
- Fixed views have an array path with object
- Fixed issue with pt-br is not attached to its parent

### Removed

- Removed unused dependencies

## [2.1.1] - [Tag](https://github.com/VoxaAI/voxa-cli/releases/tag/2.1.1) - 2019-03-29

### Fixed

- Fixed support for having multiple UTTERANCES tabs in the spreadsheet, Eg: UTTERANCES_MAIN, UTTERANCES_NUMBER, UTTERANCES_ETC

### Added

- Added support for Office 365 workbooks
- Added support for OpenDocument spreadsheets in ods and fods format

## [2.1.0] - [Tag](https://github.com/VoxaAI/voxa-cli/releases/tag/2.1.0) - 2019-03-25

### Changed

- Now supports url format for spreadsheet url

### Removed

- Removed support for generic id for spreadsheets, have to explicit provide google spreadsheet shared URL

### Fixed

- Fix endIntent on dialogflow

### Added

- Added support for custom interaction file path
- Added test for Alexa
- Added to process local xlsx
- Added an assets processor to allow downloading media objects from a drive directory
- Added some unit tests (Dialogflow)

## [2.0.1] - [Tag](https://github.com/VoxaAI/voxa-cli/releases/tag/2.0.1) - 2019-03-05

### Added

- Added mapping for views and variables

### Fixed

- Dialogflow generator
- init and interaction command error on bad formatted URL
- Issue with root path and default interaction options

### Removed

- removed security vulnerabilities on dependencies

## [2.0.0] - [Tag](https://github.com/VoxaAI/voxa-cli/releases/tag/2.0.0) - 2019-02-25

### Added

- TS support
- Commander support (init, interaction)
- Add support for events, signinRequired (dialogflow)

### Changed

- Use native google spreadsheet API
- Default structure and support for schemas

## [1.0.0] - [Tag](https://github.com/VoxaAI/voxa-cli/releases/tag/1.0.0-alpha1) - 2018-04-10

### Added

- Add support for google spreadsheet
- Add support for multiple views, interaction model, publishing information
- Add support for Alexa, Dialogflow
- Add support to download other sheet

## Compare old version

[unreleased]: https://github.com/VoxaAI/voxa-cli/compare/2.3.1...staging
[2.3.1]: https://github.com/VoxaAI/voxa-cli/compare/2.3.0...2.3.1
[2.3.0]: https://github.com/VoxaAI/voxa-cli/compare/2.2.2...2.3.0
[2.2.2]: https://github.com/VoxaAI/voxa-cli/compare/2.2.1...2.2.2
[2.2.1]: https://github.com/VoxaAI/voxa-cli/compare/2.2.0...2.2.1
[2.2.0]: https://github.com/VoxaAI/voxa-cli/compare/2.1.2...2.2.0
[2.1.2]: https://github.com/VoxaAI/voxa-cli/compare/2.1.1...2.1.2
[2.1.1]: https://github.com/VoxaAI/voxa-cli/compare/2.1.0...2.1.1
[2.1.0]: https://github.com/VoxaAI/voxa-cli/compare/2.0.1...2.1.0
[2.0.1]: https://github.com/VoxaAI/voxa-cli/compare/2.0.0...2.0.1
[2.0.0]: https://github.com/VoxaAI/voxa-cli/compare/1.0.0-alpha1...2.0.0
[1.0.0]: https://github.com/VoxaAI/voxa-cli/releases/tag/1.0.0-alpha1
