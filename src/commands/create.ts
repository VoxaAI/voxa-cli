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

export async function action() {
  async function executePrompt(): Promise<any> {
    return inquirer.prompt(observe).then(async (answers: any) => {
      try {
        const {
          appName,
          canfulfill,
          language,
          author,
          analytics,
          voxaCli,
          saveUserInfo,
          platform
        } = answers;

        const folderName = _.kebabCase(appName);
        await copyPackageAndReadmeFiles(appName, voxaCli, folderName, author, analytics, language);
        if (voxaCli) {
          copyInteractionFile(folderName, language);
        }
        await copyServerless(folderName, saveUserInfo, platform, language);
        await copyServer(folderName, platform, language);
        await copySrcFiles(folderName, canfulfill, analytics, saveUserInfo, platform, language);
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
        message: "Please enter the name of your app"
      },
      {
        type: "input",
        name: "author",
        message: "Please enter your name/company",
        default: os.userInfo().username
      },
      {
        type: "checkbox",
        name: "platform",
        message: "Which platform will the app use?",
        choices: [
          { name: "All of them", value: "all" },
          { name: "Amazon Alexa", value: "alexa", default: true },
          { name: "Google Assistant", value: "google" },
          { name: "Telegram", value: "telegram" },
          { name: "Facebook Messenger", value: "facebook" }
        ]
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
        name: "voxaCli",
        message:
          "Will you use Voxa-CLI to generate the interacion model and publishing information?",
        default: true
      },
      {
        type: "confirm",
        name: "canfulfill",
        message: "Will you use the Canfulfill intent?",
        default: false
      },
      {
        type: "confirm",
        name: "saveUserInfo",
        message: "Will you use DynamoDB to save user's info?",
        default: false
      },
      {
        type: "checkbox",
        name: "analytics",
        message: "What analytics will you be using for this app?",
        choices: [
          { name: "None", value: "none" },
          { name: "All of them", value: "all" },
          { name: "Google Analytics", value: "ga" },
          { name: "Dashbot", value: "dashbot" },
          { name: "Chatbase", value: "chatbase" }
        ]
      }
    ];
    questions.map(q => obs.next(q));

    obs.complete();
  });

  await executePrompt();
}

export function getTemplatePath(language: string, ...args: any[]): string {
  let fileDir = [__dirname, "..", "..", "..", "templates", language, ...args];

  if (path.basename(__filename) === "create.ts") {
    fileDir = [__dirname, "..", "..", "templates", language, ...args];
  }

  return path.join(...fileDir);
}

export function getTemplateFile(language: string, ...args: any[]): Promise<string> {
  if (path.basename(__filename) === "create.ts") {
    return fs.readFile(path.join(__dirname, "..", "..", "templates", language, ...args), "utf8");
  }

  return fs.readFile(
    path.join(__dirname, "..", "..", "..", "templates", language, ...args),
    "utf8"
  );
}

async function copyPackageAndReadmeFiles(
  appName: string,
  voxaCli: boolean,
  folderName: string,
  author: string,
  analytics: string,
  language: string
) {
  const readmeContent = await getTemplateFile(language, "README.md");
  const readmeTemplate = Handlebars.compile(readmeContent);
  const readmeData = { appName, voxaCli };
  const readmeResult = readmeTemplate(readmeData);

  const ga = analytics.includes("ga") || analytics.includes("all");
  const dashbot = analytics.includes("dashbot") || analytics.includes("all");
  const chatbase = analytics.includes("chatbase") || analytics.includes("all");
  const nodePackageContent = await getTemplateFile(language, "package.json");
  const nodePackageTemplate = Handlebars.compile(nodePackageContent);
  const nodePackageData = {
    name: folderName,
    author,
    ga,
    dashbot,
    chatbase,
    voxaCli
  };
  const nodePackageResult = nodePackageTemplate(nodePackageData);
  const outputFilePromises = [
    fs.outputFile(path.join(process.cwd(), folderName, "README.md"), readmeResult),
    fs.outputFile(path.join(process.cwd(), folderName, "package.json"), nodePackageResult)
  ];
  return Promise.all(outputFilePromises);
}

function copyInteractionFile(folderName: string, language: string) {
  return fs.copy(
    getTemplatePath(language, "interaction.json"),
    path.join(process.cwd(), folderName, "interaction.json")
  );
}

async function copyServerless(
  folderName: string,
  saveUserInfo: boolean,
  platform: string[],
  language: string
) {
  const usesAlexa = platform.includes("alexa") || platform.includes("all");
  const usesGoogleAssistant = platform.includes("google") || platform.includes("all");
  const usesFacebook = platform.includes("facebook") || platform.includes("all");
  const usesTelegram = platform.includes("telegram") || platform.includes("all");

  const content = await getTemplateFile(language, "serverless.yml");
  const template = Handlebars.compile(content);
  const data = {
    service: folderName,
    saveUserInfo,
    usesAlexa,
    usesGoogleAssistant,
    usesFacebook,
    usesTelegram
  };
  const result = template(data);
  return fs.outputFile(path.join(process.cwd(), folderName, "serverless.yml"), result);
}

async function copyServer(folderName: string, platform: string[], language: string) {
  const ext = language === "javascript" ? "js" : "ts";
  const content = await getTemplateFile(language, `server.${ext}`);
  const template = Handlebars.compile(content);
  const usesAlexa = platform.includes("alexa") || platform.includes("all");
  const usesGoogleAssistant = platform.includes("google") || platform.includes("all");
  const usesFacebook = platform.includes("facebook") || platform.includes("all");
  const usesTelegram = platform.includes("telegram") || platform.includes("all");

  const data = {
    usesAlexa,
    usesGoogleAssistant,
    usesFacebook,
    usesTelegram
  };
  const result = template(data);
  return fs.outputFile(path.join(process.cwd(), folderName, `server.${ext}`), result);
}

async function copySrcFiles(
  folderName: string,
  canfulfill: boolean,
  analytics: string,
  saveUserInfo: boolean,
  platform: string[],
  language: string
) {
  try {
    const usesAlexa = platform.includes("alexa") || platform.includes("all");
    const usesGoogleAssistant = platform.includes("google") || platform.includes("all");
    const usesFacebook = platform.includes("facebook") || platform.includes("all");
    const usesTelegram = platform.includes("telegram") || platform.includes("all");
    const ext = language === "javascript" ? "js" : "ts";
    const srcFolderPath = getTemplatePath(language, "src");
    const destinationPath = path.join(process.cwd(), folderName, "src");
    await fs.copy(srcFolderPath, destinationPath);

    if (!saveUserInfo) {
      await fs.remove(path.join(process.cwd(), folderName, "src", "services", `User.${ext}`));
    }

    const ga = analytics.includes("ga") || analytics.includes("all");
    const dashbot = analytics.includes("dashbot") || analytics.includes("all");
    const chatbase = analytics.includes("chatbase") || analytics.includes("all");

    const indexContent = await getTemplateFile(language, "src", "app", `index.${ext}`);
    const handlerContent = await getTemplateFile(language, "src", `handler.${ext}`);
    const localConfigContent = await getTemplateFile(
      language,
      "src",
      "config",
      "local.example.json"
    );
    const stagingConfigContent = await getTemplateFile(language, "src", "config", "staging.json");
    const prodConfigContent = await getTemplateFile(language, "src", "config", "production.json");

    const indexTemplate = Handlebars.compile(indexContent);
    const handlerTemplate = Handlebars.compile(handlerContent);
    const localConfigTemplate = Handlebars.compile(localConfigContent);
    const stagingConfigTemplate = Handlebars.compile(stagingConfigContent);
    const prodConfigTemplate = Handlebars.compile(prodConfigContent);

    const indexData = {
      canfulfill,
      ga,
      dashbot,
      chatbase,
      saveUserInfo,
      usesAlexa,
      usesGoogleAssistant,
      usesFacebook,
      usesTelegram
    };
    const handlerData = {
      usesAlexa,
      usesGoogleAssistant,
      usesFacebook,
      usesTelegram
    };
    const configData = {
      folderName,
      ga,
      dashbot,
      chatbase,
      saveUserInfo
    };
    const indexResult = indexTemplate(indexData);
    const handlerResult = handlerTemplate(handlerData);
    const localConfigResult = localConfigTemplate(configData);
    const stagingConfigResult = stagingConfigTemplate(configData);
    const prodConfigResult = prodConfigTemplate(configData);

    const outputFilePromises = [
      fs.outputFile(
        path.join(process.cwd(), folderName, "src", "app", `index.${ext}`),
        indexResult
      ),
      fs.outputFile(path.join(process.cwd(), folderName, "src", `handler.${ext}`), handlerResult),
      fs.outputFile(
        path.join(process.cwd(), folderName, "src", "config", "local.example.json"),
        localConfigResult
      ),
      fs.outputFile(
        path.join(process.cwd(), folderName, "src", "config", "staging.json"),
        stagingConfigResult
      ),
      fs.outputFile(
        path.join(process.cwd(), folderName, "src", "config", "production.json"),
        prodConfigResult
      )
    ];

    return Promise.all(outputFilePromises);
  } catch (error) {
    console.log(error);
  }
}

async function copyAllOtherFiles(folderName: string, language: string) {
  try {
    const ext = language === "javascript" ? "js" : "ts";
    const rootFiles = await fs.readdir(getTemplatePath(language));
    const unwantedFiles = [
      "README.md",
      "serverless.yml",
      "package.json",
      "src",
      "interaction.json",
      `server.${ext}`
    ];
    const filteredFiles = rootFiles.filter(file => !unwantedFiles.includes(file));
    return filteredFiles.map(file => {
      fs.copy(getTemplatePath(language, file), path.join(process.cwd(), folderName, file));
    });
  } catch (error) {
    console.log(error);
  }
}
