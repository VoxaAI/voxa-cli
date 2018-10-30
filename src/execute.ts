import * as authKeys from '../client_secret.json';
import * as interactionOption from '../interaction.json';
import { transform } from './Spreadsheet';
import { AlexaSchema } from './AlexaSchema';
import { DialogFlowSchema } from './DialogFlowSchema';
import { Schema, Intent, PublishingInformation, Event, FileContent } from './Schema';
import * as _ from 'lodash';
import * as fsExtra from 'fs-extra';
import * as _Promise from 'bluebird';
const fs = _Promise.promisifyAll(fsExtra);

const execute = async function (interactionOption: any, authKeys: any) {
  console.time('all');
  console.time('timeframe');
  const sheets = await transform(interactionOption, authKeys);
  console.timeEnd('timeframe');
  // const alexa = new AlexaSchema(sheets, interactionOption);
  const platforms = ['alexa', 'dialogflow'];
  const schemas = [];

  if (platforms.includes('alexa')) {
    const schema = new AlexaSchema(_.cloneDeep(sheets), interactionOption);
    schemas.push(schema);
  }

  if (platforms.includes('dialogflow')) {
    const schema = new DialogFlowSchema(_.cloneDeep(sheets), interactionOption);
    schemas.push(schema);
  }

  const fileContents = schemas.reduce((acc, schema, index) => {
    if (index === 0) {
      schema.buildDownloads();
      schema.buildViews();
    }

    schema.invocations.map(invoc => {
      schema.build(invoc.locale, invoc.environment);
    });
    acc = acc.concat(schema.fileContent);
    return acc;
  }, [] as FileContent[])
  .map(file => fs.outputFile(file.path, JSON.stringify(file.content, null, 2), { flag: 'w' }));

  // await Promise.all(dialogFlow.fileContent.map(file => fs.outputFile(file.path, JSON.stringify(file.content, null, 2), { flag: 'w' })));
  await Promise.all(fileContents);
  console.timeEnd('all');
}


execute(interactionOption, authKeys);

