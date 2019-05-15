# {{ appName }}

This application is written using the [voxa3](https://github.com/mediarain/voxa) framework developed by RAIN.

## Development setup

- Install and use Node v8.10
- Run `yarn`
- Create a `src/config/local.json` file and customize it for your local setup, you can use `src/config/local.example.json`
- Start the development server with `yarn watch`

## Tests

This project has a test suite built using [mocha](https://mochajs.org/), [chai](https://www.chaijs.com/), [alexa-mime](https://www.npmjs.com/package/alexa-mime) and [virtual-alexa](https://www.npmjs.com/package/virtual-alexa)

### Running the tests

```sh
$ yarn test --watch --bail
```

{{#if voxaCli}}
## Interaction Model and Publishing Information

The interaction model and publishing information are managed using the voxa-cli, provided you have configured access to the google spreadsheets updating it can be accomplished by running the following command

```sh
$ yarn interaction
```

## Resources

- [State Machine Diagram](#)
- [Intents and Utterances](#)
- [Publishing Information](#)
- [Technical Architecture Document](#)
- [Google Drive Directory](#)
{{/if}}
