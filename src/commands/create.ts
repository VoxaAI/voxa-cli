/*
 * Copyright (c) 2018 Rain Agency <contact@rain.agency>
 * Author: Rain Agency <contact@rain.agency>
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 * the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
 * FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 * COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
 * IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
/* tslint:disable:no-submodule-imports no-console */
"use strict";

import * as fs from "fs-extra";
import * as Handlebars from "handlebars";
import * as inquirer from "inquirer";
import * as _ from "lodash";
import * as os from "os";
import * as path from "path";
import { Observable } from "rxjs";

export const name = "create";
export const alias = "";
export const description = "Create a Voxa app";
export const options = [
  {
    flags: "-r, --rain",
    descriptionOption: "Set a RAIN project"
  }
];

export async function action() {
  async function executePrompt(): Promise<any> {
    return inquirer.prompt(observe).then(async (answers: any) => {
      try {
        const { appName, serverless, canfulfill, language } = answers;
        const folderName = _.kebabCase(appName);
        await copyPackageAndReadmeFiles(appName, serverless, folderName, language);
        if (serverless) {
          await copyServerless(folderName, language);
        }
        await copySrcFiles(folderName, canfulfill, language);
        await copyAllOtherFiles(folderName, language);
      } catch (error) {
        console.log(error);
      }
    });
  }

  const observe = Observable.create((obs: any) => {
    const questions = [
      {
        type: "input",
        name: "appName",
        message: "What's the name of your Voxa app?"
      },
      {
        type: "list",
        name: "language",
        message: "Choose a language",
        choices: [
          { name: "Javascript", value: "javascript" },
          { name: "Typescript", value: "typescript" }
        ],
        default: "Javascript"
      },
      {
        type: "confirm",
        name: "serverless",
        message: "Will you use Serverless to deploy?",
        default: true
      },
      {
        type: "confirm",
        name: "canfulfill",
        message: "Will you use the Canfulfill intent?",
        default: false
      }
    ];
    questions.map(q => obs.next(q));

    obs.complete();
  });

  await executePrompt();
}

function getTemplatePath(language: string, ...args: any[]): string {
  const fileDir = [__dirname, "..", "..", "..", "templates", language, ...args];
  return path.join(...fileDir);
}

function getTemplateFile(language: string, ...args: any[]) {
  return fs.readFile(
    path.join(__dirname, "..", "..", "..", "templates", language, ...args),
    "utf8"
  );
}

async function copyPackageAndReadmeFiles(
  appName: string,
  serverless: boolean,
  folderName: string,
  language: string
) {
  const readmeContent = await getTemplateFile(language, "README.md");
  const readmeTemplate = Handlebars.compile(readmeContent);
  const readmeData = {
    appName,
    serverless
  };
  const readmeResult = readmeTemplate(readmeData);

  const nodePackageContent = await getTemplateFile(language, "package.json");
  const nodePackageTemplate = Handlebars.compile(nodePackageContent);
  const nodePackageData = {
    name: folderName,
    author: os.userInfo().username
  };
  const nodePackageResult = nodePackageTemplate(nodePackageData);
  const outputFilePromises = [
    fs.outputFile(path.join(process.cwd(), folderName, "README.md"), readmeResult),
    fs.outputFile(path.join(process.cwd(), folderName, "package.json"), nodePackageResult)
  ];
  return Promise.all(outputFilePromises);
}

async function copyServerless(folderName: string, language: string) {
  const content = await getTemplateFile(language, "serverless.yml");
  const template = Handlebars.compile(content);
  const data = {
    service: folderName
  };
  const result = template(data);
  return fs.outputFile(path.join(process.cwd(), folderName, "serverless.yml"), result);
}

async function copySrcFiles(folderName: string, canfulfill: boolean, language: string) {
  try {
    const ext = language === "javascript" ? "js" : "ts";
    const srcFolderPath = getTemplatePath(language, "src");
    const destinationPath = path.join(process.cwd(), folderName, "src");
    await fs.copy(srcFolderPath, destinationPath);

    const content = await getTemplateFile(language, "src", "app", `index.${ext}`);
    const template = Handlebars.compile(content);
    const data = {
      canfulfill
    };
    const result = template(data);
    return fs.outputFile(
      path.join(process.cwd(), folderName, "src", "app", `index.${ext}`),
      result
    );
  } catch (error) {
    console.log(error);
  }
}

async function copyAllOtherFiles(folderName: string, language: string) {
  try {
    const rootFiles = await fs.readdir(
      path.join(__dirname, "..", "..", "..", "templates", language)
    );
    const unwantedFiles = ["README.md", "serverless.yml", "package.json", "src"];
    const filteredFiles = rootFiles.filter(file => !unwantedFiles.includes(file));
    return filteredFiles.map(file => {
      fs.copy(getTemplatePath(language, file), path.join(process.cwd(), folderName, file));
    });
  } catch (error) {
    console.log(error);
  }
}
