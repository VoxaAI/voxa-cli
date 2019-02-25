/* tslint:disable:no-submodule-imports no-console */
"use strict";

import * as colors from "colors";
import * as fs from "fs-extra";
import * as inquirer from "inquirer";
import * as _ from "lodash";
import * as pad from "pad";
import * as path from "path";
import { Observable } from "rxjs";

export const name = "init";
export const alias = "";
export const description = "create a new interaction.json";

const ALLOWED_ATTRIBUTES = [
  "platform",
  "spreadsheets",
  "speechPath",
  "content",
  "contentPath",
  "viewsPath"
];

export function action() {
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
    const mustBeSpreadsheetURLOrLength30 = (input: string) => {
      const result = _.chain(input)
        .split(",")
        .map(_.trim)
        .compact()
        .every((i: string) => {
          const matched = i.match(/docs\.google\.com\/spreadsheets\/d\/(.*)\/.*/);
          if (i.includes("docs.google.com/spreadsheets") && matched && _.isString(matched[1])) {
            i = matched[1];
          }
          return i.length > 30;
        })
        .value();
      return noEmptyAnswer(input) && result
        ? true
        : "Insert a proper spreadsheet url or id eg. https://docs.google.com/spreadsheets/d/XXXXXXX/edit#gid=0";
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
        type: "list",
        name: "platform",
        message: "Choose platform",
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
        message: "Specify folder path to save interaction model",
        default: "speech-assets",
        when: override
      },

      {
        type: "input",
        name: "content",
        message: "Specify all other sheets to download separated by comma",
        default: "",
        filter: onlyCommaAnswer,
        when: override
      },
      {
        type: "input",
        name: "contentPath",
        message: "Specify folder path to save all downloable content",
        when: (answers: any) => !_.isEmpty(answers.content),
        default: "content"
      },
      {
        type: "input",
        name: "viewsPath",
        message: "Specify folder path to save views file",
        default: "/",
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
  function executePrompt(): any {
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
      return fs.outputFileSync(
        path.join(process.cwd(), "interaction.json"),
        JSON.stringify(answers, null, 2),
        { flag: "w" }
      );
    });
  }

  executePrompt();
}
