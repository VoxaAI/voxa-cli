# Changelog

All notable changes to this project will be documented in this file

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed

- Fix endIntent on dialogflow

### Added

- Added an assets processor to allow downloading media objects from a drive directory
- Added some unit tests

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

[unreleased]: https://github.com/VoxaAI/voxa-cli/compare/2.0.1...staging
[2.0.1]: https://github.com/VoxaAI/voxa-cli/compare/2.0.0...2.0.1
[2.0.0]: https://github.com/VoxaAI/voxa-cli/compare/1.0.0-alpha1...2.0.0
[1.0.0]: https://github.com/VoxaAI/voxa-cli/releases/tag/1.0.0-alpha1
