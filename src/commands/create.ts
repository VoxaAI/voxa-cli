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
    descriptionOption: "Set a RAIN"
  }
];

export async function action() {
  async function executePrompt(): Promise<any> {
    return inquirer.prompt(observe).then(async (answers: any) => {
      try {
        const { appName, serverless, canfulfill } = answers;
        const folderName = _.kebabCase(appName);
        await copyPackageAndReadmeFiles(appName, serverless, folderName);
        if (serverless) {
          await copyServerless(folderName);
        }
        await copySrcFiles(folderName, canfulfill);
        await copyAllOtherFiles(folderName);
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
        choices: ["Javascript", "Typescript"],
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

function getTemplatePath(...args: any[]): string {
  const fileDir = [__dirname, "..", "..", "..", "templates", ...args];
  return path.join(...fileDir);
}

function getTemplateFile(...args: any[]) {
  return fs.readFile(path.join(__dirname, "..", "..", "..", "templates", ...args), "utf8");
}

async function copyPackageAndReadmeFiles(appName: string, serverless: boolean, folderName: string) {
  const readmeContent = await getTemplateFile("README.md");
  const readmeTemplate = Handlebars.compile(readmeContent);
  const readmeData = {
    appName,
    serverless
  };
  const readmeResult = readmeTemplate(readmeData);

  const nodePackageContent = await getTemplateFile("package.json");
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

async function copyServerless(folderName: string) {
  const content = await getTemplateFile("serverless.yml");
  const template = Handlebars.compile(content);
  const data = {
    service: folderName
  };
  const result = template(data);
  return fs.outputFile(path.join(process.cwd(), folderName, "serverless.yml"), result);
}

async function copySrcFiles(folderName: string, canfulfill: boolean) {
  try {
    const srcFolderPath = getTemplatePath("src");
    const destinationPath = path.join(process.cwd(), folderName, "src");
    await fs.copy(srcFolderPath, destinationPath);

    const content = await getTemplateFile("src", "app", "index.ts");
    const template = Handlebars.compile(content);
    const data = {
      canfulfill
    };
    const result = template(data);
    return fs.outputFile(path.join(process.cwd(), folderName, "src", "app", "index.ts"), result);
  } catch (error) {
    console.log(error);
  }
}

async function copyAllOtherFiles(folderName: string) {
  try {
    const rootFiles = await fs.readdir(path.join(__dirname, "..", "..", "..", "templates"));
    const unwantedFiles = ["README.md", "serverless.yml", "package.json", "src"];
    const filteredFiles = rootFiles.filter(file => !unwantedFiles.includes(file));
    return filteredFiles.map(file => {
      fs.copy(getTemplatePath(file), path.join(process.cwd(), folderName, file));
    });
  } catch (error) {
    console.log(error);
  }
}
