/* tslint:disable:no-submodule-imports no-console */
import * as _Promise from "bluebird";
import * as fsExtra from "fs-extra";
import * as _ from "lodash";
import * as path from "path";
import { AlexaSchema } from "./AlexaSchema";
import { DialogflowSchema } from "./DialogflowSchema";
import { IFileContent } from "./Schema";
import { transform } from "./Spreadsheet";
const fs = _Promise.promisifyAll(fsExtra);

function defaultOptions(interactionOption: any) {
  const rootPath = _.get(interactionOption, "rootPath");

  const speechPath = _.get(interactionOption, "speechPath", path.join(rootPath, "speech-assets"));
  const synonymPath = _.get(interactionOption, "synonymPath", path.join(rootPath, "synonyms"));
  const viewsPath = _.get(interactionOption, "viewsPath", path.join(rootPath, "app"));
  const contentPath = _.get(interactionOption, "contentPath", path.join(rootPath, "content"));
  let platforms = _.get(interactionOption, "platforms", ["alexa"]);
  platforms = _.isString(platforms) ? [platforms] : platforms;

  let spreadsheets = _.get(interactionOption, "spreadsheets");
  spreadsheets = _.isString(spreadsheets) ? [spreadsheets] : spreadsheets;
  spreadsheets = spreadsheets.map((sheet: string) => {
    const matched = sheet.match(/docs\.google\.com\/spreadsheets\/d\/(.*)\/.*/);
    if (sheet.includes("docs.google.com/spreadsheets") && matched && _.isString(matched[1])) {
      return matched[1];
    }

    return sheet;
  });

  if (_.isEmpty(spreadsheets)) {
    throw Error("Spreadsheet were not specified in the right format");
  }
  return { rootPath, spreadsheets, speechPath, synonymPath, viewsPath, contentPath, platforms };
}
export const buildInteraction = async (interactionOption: any, authKeys: any) => {
  interactionOption = defaultOptions(interactionOption);
  console.time("all");
  console.time("timeframe");
  const sheets = await transform(interactionOption, authKeys);
  console.timeEnd("timeframe");
  const platforms = interactionOption.platforms;
  const schemas = [];

  if (platforms.includes("alexa")) {
    const schema = new AlexaSchema(_.cloneDeep(sheets), interactionOption);
    schemas.push(schema);
    await fs.remove(
      path.join(interactionOption.rootPath, interactionOption.speechPath, schema.NAMESPACE)
    );
  }

  if (platforms.includes("dialogflow")) {
    const schema = new DialogflowSchema(_.cloneDeep(sheets), interactionOption);
    schemas.push(schema);
    await fs.remove(
      path.join(interactionOption.rootPath, interactionOption.speechPath, schema.NAMESPACE)
    );
  }

  const fileContentsProcess = schemas
    .reduce(
      (acc, schema, index) => {
        if (index === 0) {
          schema.buildDownloads();
          schema.buildViews();
          schema.buildViewsMapping();
          schema.buildSynonyms();
        }

        schema.invocations.map(invoc => {
          schema.build(invoc.locale, invoc.environment);
        });
        acc = acc.concat(schema.fileContent);
        return acc;
      },
      [] as IFileContent[]
    )
    .map(file => fs.outputFile(file.path, JSON.stringify(file.content, null, 2), { flag: "w" }));

  await Promise.all(fileContentsProcess);
  console.timeEnd("all");
};
