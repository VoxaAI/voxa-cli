import { expect } from "chai";
import * as fs from "fs-extra";
import * as inquirer from "inquirer";
import * as path from "path";
import * as simple from "simple-mock";
import * as createCommand from "../lib/src/commands/create";

describe("Generate a Javascript project without serverless and with canfulfill intents", () => {
  before(async () => {
    await fs.remove(path.join(__dirname, "out", "javascript", "my-skill"));
    simple.mock(inquirer, "prompt").callFn(() => {
      return Promise.resolve({
        appName: "my skill",
        author: "Rain",
        language: "javascript",
        serverless: false,
        canfulfill: true
      });
    });
    simple.mock(process, "cwd").callFn(() => path.join(__dirname, "out", "javascript"));
    simple.mock(createCommand, "getTemplatePath").callFn(
      (language: string, ...args: any[]): string => {
        const fileDir = [__dirname, "..", "templates", language, ...args];
        return path.join(...fileDir);
      }
    );
    simple.mock(createCommand, "getTemplateFile").callFn(
      (language: string, ...args: any[]): Promise<string> => {
        return fs.readFile(
          path.join(__dirname, "..", "..", "..", "templates", language, ...args),
          "utf8"
        );
      }
    );
    await createCommand.action();
  });

  after(async () => {
    simple.restore();
  });

  function getFilePath(...args: any[]) {
    return path.join(__dirname, "out", "javascript", "my-skill", ...args);
  }

  it("should have a src folder", async () => {
    const filePath = getFilePath("src");
    const pathExists = await fs.pathExists(filePath);
    expect(pathExists).to.be.true;
  });

  it("should have a test folder", async () => {
    const filePath = getFilePath("test");
    const pathExists = await fs.pathExists(filePath);
    expect(pathExists).to.be.true;
  });

  it("should have a server.js file", async () => {
    const filePath = getFilePath("server.js");
    const pathExists = await fs.pathExists(filePath);
    expect(pathExists).to.be.true;
  });

  it("should have a README file with the name of the skill", async () => {
    const filePath = getFilePath("README.md");
    const pathExists = await fs.pathExists(filePath);
    const fileContent = await fs.readFile(filePath, "utf8");
    expect(pathExists).to.be.true;
    expect(fileContent).to.contain("my skill");
  });

  it("should not have a serverless file", async () => {
    const filePath = getFilePath("serverless.yml");
    const pathExists = await fs.pathExists(filePath);
    expect(pathExists).to.not.be.true;
  });

  it("should have canfulfill reference in index file", async () => {
    const filePath = getFilePath("src", "app", "index.js");
    const fileContent = await fs.readFile(filePath, "utf8");
    expect(fileContent).to.contain("defaultFulfillIntents");
  });

  it("should have a package.json file with the name of the skill and author", async () => {
    const filePath = getFilePath("package.json");
    const fileContent = await fs.readFile(filePath, "utf8");
    expect(fileContent).to.contain('"name": "my-skill",');
    expect(fileContent).to.contain('"author": "Rain",');
  });
});

describe("Generate a Typescript project without serverless and with canfulfill intents", () => {
  before(async () => {
    await fs.remove(path.join(__dirname, "out", "typescript", "my-ts-skill"));
    simple.mock(inquirer, "prompt").callFn(() => {
      return Promise.resolve({
        appName: "my ts skill",
        author: "Rain",
        language: "typescript",
        serverless: false,
        canfulfill: true
      });
    });
    simple.mock(process, "cwd").callFn(() => path.join(__dirname, "out", "typescript"));
    simple.mock(createCommand, "getTemplatePath").callFn(
      (language: string, ...args: any[]): string => {
        const fileDir = [__dirname, "..", "templates", language, ...args];
        return path.join(...fileDir);
      }
    );
    simple.mock(createCommand, "getTemplateFile").callFn(
      (language: string, ...args: any[]): Promise<string> => {
        return fs.readFile(
          path.join(__dirname, "..", "..", "..", "templates", language, ...args),
          "utf8"
        );
      }
    );
    await createCommand.action();
  });

  after(async () => {
    simple.restore();
  });

  function getFilePath(...args: any[]) {
    return path.join(__dirname, "out", "typescript", "my-ts-skill", ...args);
  }

  it("should have a src folder", async () => {
    const filePath = getFilePath("src");
    const pathExists = await fs.pathExists(filePath);
    expect(pathExists).to.be.true;
  });

  it("should have a test folder", async () => {
    const filePath = getFilePath("test");
    const pathExists = await fs.pathExists(filePath);
    expect(pathExists).to.be.true;
  });

  it("should have a server.js file", async () => {
    const filePath = getFilePath("server.ts");
    const pathExists = await fs.pathExists(filePath);
    expect(pathExists).to.be.true;
  });

  it("should have a README file with the name of the skill", async () => {
    const filePath = getFilePath("README.md");
    const pathExists = await fs.pathExists(filePath);
    const fileContent = await fs.readFile(filePath, "utf8");
    expect(pathExists).to.be.true;
    expect(fileContent).to.contain("my ts skill");
  });

  it("should not have a serverless file", async () => {
    const filePath = getFilePath("serverless.yml");
    const pathExists = await fs.pathExists(filePath);
    expect(pathExists).to.not.be.true;
  });

  it("should have canfulfill reference in index file", async () => {
    const filePath = getFilePath("src", "app", "index.ts");
    const fileContent = await fs.readFile(filePath, "utf8");
    expect(fileContent).to.contain("defaultFulfillIntents");
  });

  it("should have a package.json file with the name of the skill and author", async () => {
    const filePath = getFilePath("package.json");
    const fileContent = await fs.readFile(filePath, "utf8");
    expect(fileContent).to.contain('"name": "my-ts-skill",');
    expect(fileContent).to.contain('"author": "Rain",');
  });
});
