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
import * as _ from "lodash";
import * as path from "path";

interface IAnswers {
  appName: string;
  canfulfill: boolean;
  language: string;
  author: string;
  analytics: string[];
  voxaCli: boolean;
  saveUserInfo: boolean;
  platform: string[];
}

interface IData {
  appName: string;
  folderName: string;
  canfulfill: boolean;
  language: string;
  ext: string;
  author: string;
  ga: boolean;
  dashbot: boolean;
  chatbase: boolean;
  voxaCli: boolean;
  saveUserInfo: boolean;
  usesAlexa: boolean;
  usesGoogleAssistant: boolean;
  usesFacebook: boolean;
  usesTelegram: boolean;
}

export default class VoxaGenerator {
  public data: IData;

  constructor(answers: IAnswers) {
    this.data = {
      appName: answers.appName,
      folderName: _.kebabCase(answers.appName),
      canfulfill: answers.canfulfill,
      language: answers.language,
      ext: answers.language === "javascript" ? "js" : "ts",
      author: answers.author,
      ga: answers.analytics.includes("ga") || answers.analytics.includes("all"),
      dashbot: answers.analytics.includes("dashbot") || answers.analytics.includes("all"),
      chatbase: answers.analytics.includes("chatbase") || answers.analytics.includes("all"),
      voxaCli: answers.voxaCli,
      saveUserInfo: answers.saveUserInfo,
      usesAlexa: answers.platform.includes("alexa") || answers.platform.includes("all"),
      usesGoogleAssistant: answers.platform.includes("google") || answers.platform.includes("all"),
      usesFacebook: answers.platform.includes("facebook") || answers.platform.includes("all"),
      usesTelegram: answers.platform.includes("telegram") || answers.platform.includes("all")
    };
  }

  public async generateProject() {
    try {
      await this.copyPackageFile();
      await this.copyReadmeFile();
      if (this.data.voxaCli) {
        await this.copyInteractionFile();
      }
      await this.copyServerless();
      await this.copyServer();
      await this.copySrcFiles();
      await this.copyAllOtherFiles();
      return Promise.resolve(true);
    } catch (error) {
      console.error(error);
      return Promise.resolve(false);
    }
  }

  private getTemplatePath(...args: any[]): string {
    let fileDir = [__dirname, "..", "..", "templates", this.data.language, ...args];

    if (path.basename(__filename) === "VoxaGenerator.ts") {
      fileDir = [__dirname, "..", "templates", this.data.language, ...args];
    }

    return path.join(...fileDir);
  }

  private async getTemplateFile(...args: any[]): Promise<string> {
    if (path.basename(__filename) === "VoxaGenerator.ts") {
      return fs.readFile(
        path.join(__dirname, "..", "templates", this.data.language, ...args),
        "utf8"
      );
    }

    return fs.readFile(
      path.join(__dirname, "..", "..", "templates", this.data.language, ...args),
      "utf8"
    );
  }

  private async generateHandlebarTemplateFile(...filePath: any[]) {
    const data = this.data;
    const content = await this.getTemplateFile(...filePath);
    const template = Handlebars.compile(content);
    const result = template(data);
    return fs.outputFile(path.join(process.cwd(), this.data.folderName, ...filePath), result);
  }

  private copyPackageFile() {
    return this.generateHandlebarTemplateFile("package.json");
  }

  private async copyReadmeFile() {
    return this.generateHandlebarTemplateFile("README.md");
  }

  private copyInteractionFile() {
    return fs.copy(
      this.getTemplatePath("interaction.json"),
      path.join(process.cwd(), this.data.folderName, "interaction.json")
    );
  }

  private copyServerless() {
    return this.generateHandlebarTemplateFile("serverless.yml");
  }

  private copyServer() {
    return this.generateHandlebarTemplateFile(`server.${this.data.ext}`);
  }

  private copySrcIndexFile() {
    return this.generateHandlebarTemplateFile("src", "app", `index.${this.data.ext}`);
  }

  private copySrcModelFile() {
    return this.generateHandlebarTemplateFile("src", "app", `model.${this.data.ext}`);
  }

  private copySrcHandlerFile() {
    return this.generateHandlebarTemplateFile("src", `handler.${this.data.ext}`);
  }

  private copySrcConfigFiles() {
    const configFilePaths = [
      ["src", "config", "local.example.json"],
      ["src", "config", "staging.json"],
      ["src", "config", "production.json"]
    ];

    return Promise.all(
      configFilePaths.map(filePath => this.generateHandlebarTemplateFile(...filePath))
    );
  }

  private async copySrcFiles() {
    const srcFolderPath = this.getTemplatePath("src");
    const destinationPath = path.join(process.cwd(), this.data.folderName, "src");
    await fs.copy(srcFolderPath, destinationPath);

    if (!this.data.saveUserInfo) {
      await fs.remove(
        path.join(process.cwd(), this.data.folderName, "src", "services", `User.${this.data.ext}`)
      );
    }

    const promises = [
      await this.copySrcIndexFile(),
      await this.copySrcModelFile(),
      await this.copySrcHandlerFile(),
      await this.copySrcConfigFiles()
    ];

    return Promise.all(promises);
  }

  private async copyAllOtherFiles() {
    const rootFiles = await fs.readdir(this.getTemplatePath());
    const PROCESSED_FILES = [
      "README.md",
      "serverless.yml",
      "package.json",
      "src",
      "interaction.json",
      `server.${this.data.ext}`
    ];
    const filteredFiles = rootFiles.filter(file => !PROCESSED_FILES.includes(file));
    return filteredFiles.map(file => {
      fs.copy(this.getTemplatePath(file), path.join(process.cwd(), this.data.folderName, file));
    });
  }
}
