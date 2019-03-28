/* tslint:disable:no-submodule-imports no-console */
"use strict";

import { all } from "bluebird";
import * as colors from "colors";
import * as fs from "fs-extra";
import * as inquirer from "inquirer";
import * as _ from "lodash";
import * as pad from "pad";
import * as path from "path";
import { Observable } from "rxjs";
import { DEFAULT_INTERACTION_OPTIONS } from "../InteractionBuilder";

export const name = "init";
export const alias = "";
export const description = "create a new interaction.json";

const ALLOWED_ATTRIBUTES = [
  "platforms",
  "spreadsheets",
  "speechPath",
  "content",
  "contentPath",
  "viewsPath"
];

export async function action() {
  const interactionFile = path.join(process.cwd(), "interaction.json");
  let hasAnInteractionFile = false;
  try {
    // a path we KNOW is totally bogus and not a module
    hasAnInteractionFile = require(interactionFile);
  } catch (e) {
    if (e.code === "MODULE_NOT_FOUND") {
      hasAnInteractionFile = false;
    }
  }

  const observe = Observable.create((obs: any) => {
    const override = (answers: any) => {
      return answers.interactionFile;
    };
    const onlyCommaAnswer = (input: string) => {
      return _.chain(input)
        .split(",")
        .map(_.trim)
        .compact()
        .value();
    };
    const noEmptyAnswer = (input: string) => !_.isEmpty(input);
    const mustBeSpreadsheetURLOrLength30 = async (input: string) => {
      let result: any = _.chain(input)
        .split(",")
        .map(_.trim)
        .compact()
        .map((i: string) => {
          if (i.includes("docs.google.com/spreadsheets")) {
            const matched = i.match(/docs\.google\.com\/spreadsheets\/d\/(.*)\/.*/);
            return matched && _.isString(matched[1]) && matched[1].length > 30;
          }

          if (i.includes(".sharepoint.com") && i.length > 30) {
            return true;
          }

          const customPath = i.indexOf("/") === 0 ? i : path.join(process.cwd(), i);

          return fs.pathExists(customPath);
        })
        .value();

      result = await all(result);
      result = result.every((r: boolean) => r);

      return noEmptyAnswer(input) && result
        ? true
        : "Insert a proper google spreadsheet url, Office 365 sharepoint url, local file or local directory path. e.g. https://docs.google.com/spreadsheets/d/XXXXXXX/edit#gid=0, https://XXXXXX.sharepoint.com/:x:/g/personal/YYYYYY/ZZZZZZZ, /Users/local/file.xlsx or /Users/local/sheets/";
    };

    const questions = [
      {
        type: "confirm",
        name: "interactionFile",
        message: `Do you want to override ${interactionFile}?`,
        when: () => hasAnInteractionFile,
        default: true
      },
      {
        type: "checkbox",
        name: "platforms",
        message: "Choose platforms",
        choices: ["alexa", "dialogflow"],
        when: override
      },
      {
        type: "input",
        name: "spreadsheets",
        message: "Specify all spreadsheets separated by comma (*)",
        validate: mustBeSpreadsheetURLOrLength30,
        filter: onlyCommaAnswer,
        when: override
      },
      {
        type: "input",
        name: "speechPath",
        message: "Specify folder path to save interaction model and manifest",
        default: DEFAULT_INTERACTION_OPTIONS.speechPath,
        when: override
      },
      {
        type: "input",
        name: "contentPath",
        message: "Specify folder path to save all downloable content",
        when: override,
        default: DEFAULT_INTERACTION_OPTIONS.contentPath
      },
      {
        type: "input",
        name: "viewsPath",
        message: "Specify folder path to save views file",
        default: DEFAULT_INTERACTION_OPTIONS.viewsPath,
        when: override
      },
      {
        type: "confirm",
        name: "isCorrect",
        message: `is Correct?`,
        when: (answers: any) => {
          if (override(answers)) {
            printVariables(_.cloneDeep(answers));
          }
          return override(answers);
        },
        default: true
      }
    ];
    questions.map(q => obs.next(q));

    obs.complete();
  });

  function printVariables(answers: any) {
    return _.chain(answers)
      .toPairs()
      .filter(item => !!ALLOWED_ATTRIBUTES.find(i => i === item[0]))
      .map(item => {
        const key = item[0];
        const value = item[1];
        console.log(pad(colors.blue(key), 20), colors.grey(value));
        return item;
      })
      .compact()
      .fromPairs()
      .value();
  }
  async function executePrompt(): Promise<any> {
    return inquirer.prompt(observe).then((answers: any) => {
      if (answers.interactionFile && !answers.isCorrect) {
        return executePrompt();
      }

      if (hasAnInteractionFile && !answers.interactionFile) {
        answers = hasAnInteractionFile;
      }
      if (!answers.interactionFile && !answers.isCorrect) {
        printVariables(answers);
      }
      answers = _.pick(answers, ALLOWED_ATTRIBUTES);
      return fs.outputFile(
        path.join(process.cwd(), "interaction.json"),
        JSON.stringify(answers, null, 2),
        { flag: "w" }
      );
    });
  }

  await executePrompt();
}
