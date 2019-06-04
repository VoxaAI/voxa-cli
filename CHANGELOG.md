# Changelog

All notable changes to this project will be documented in this file

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Unreleased

### Added

- Added support for per slot utterances in alexa (this is the beginning of dialog support)
- Added feature to generate a full Voxa 3 project in Typescript or Javascript. Generate boilerplate code with linting, analytics, serverless, suppport for all available platforms, save/get user information from DynamoDB, account linking.
- Added alexa dialog model implementation
- Added new spreadsheets keys for specific platforms in the interaction.json (alexaSpreadsheets, dialogflowSpreadsheets)

### Fixed

- Now alexa spec is splitted into smaller units testing specific functionality
- Fixed @sys. slots on dialogflow were converted into a different type

## [2.1.2] - 2019-05-08

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

## [2.1.1] - 2019-03-29

### Fixed

- Fixed support for having multiple UTTERANCES tabs in the spreadsheet, Eg: UTTERANCES_MAIN, UTTERANCES_NUMBER, UTTERANCES_ETC

### Added

- Added support for Office 365 workbooks
- Added support for OpenDocument spreadsheets in ods and fods format

## [2.1.0] - 2019-03-25

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

## [2.0.1] - 2019-03-05

### Added

- Added mapping for views and variables

### Fixed

- Dialogflow generator
- init and interaction command error on bad formatted URL
- Issue with root path and default interaction options

### Removed

- removed security vulnerabilities on dependencies

## [2.0.0] - 2019-02-25

### Added

- TS support
- Commander support (init, interaction)
- Add support for events, signinRequired (dialogflow)

### Changed

- Use native google spreadsheet API
- Default structure and support for schemas

## [1.0.0] - 2018-04-10

### Added

- Add support for google spreadsheet
- Add support for multiple views, interaction model, publishing information
- Add support for Alexa, Dialogflow
- Add support to download other sheet

[unreleased]: https://github.com/VoxaAI/voxa-cli/compare/2.1.2...staging
[2.1.2]: https://github.com/VoxaAI/voxa-cli/compare/2.1.1...2.1.2
[2.1.1]: https://github.com/VoxaAI/voxa-cli/compare/2.1.0...2.1.1
[2.1.0]: https://github.com/VoxaAI/voxa-cli/compare/2.0.1...2.1.0
[2.0.1]: https://github.com/VoxaAI/voxa-cli/compare/2.0.0...2.0.1
[2.0.0]: https://github.com/VoxaAI/voxa-cli/compare/1.0.0-alpha1...2.0.0
[1.0.0]: https://github.com/VoxaAI/voxa-cli/releases/tag/1.0.0-alpha1
