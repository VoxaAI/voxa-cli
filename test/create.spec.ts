import { expect } from "chai";
import * as fs from "fs-extra";
import * as inquirer from "inquirer";
import * as path from "path";
import * as simple from "simple-mock";
import { action } from "../src/commands/create";

describe("Javascript project generator", () => {
  before(done => {
    simple.mock(process, "cwd").callFn(() => path.join(__dirname, "out", "javascript"));
    fs.remove(path.join(__dirname, "out", "javascript")).then(done);
  });

  after(() => {
    simple.restore();
  });

  function getFilePath(...args: any[]) {
    return path.join(__dirname, "out", "javascript", ...args);
  }

  describe("Generate a basic project", () => {
    before(async () => {
      simple.mock(inquirer, "prompt").callFn(() => {
        return Promise.resolve({
          appName: "my skill",
          author: "Rain",
          language: "javascript",
          serverless: false,
          canfulfill: true
        });
      });
      await action();
    });

    it("should have a src folder", async () => {
      const filePath = getFilePath("my-skill", "src");
      const pathExists = await fs.pathExists(filePath);
      expect(pathExists).to.be.true;
    });

    it("should have a test folder", async () => {
      const filePath = getFilePath("my-skill", "test");
      const pathExists = await fs.pathExists(filePath);
      expect(pathExists).to.be.true;
    });

    it("should have a server.js file", async () => {
      const filePath = getFilePath("my-skill", "server.js");
      const pathExists = await fs.pathExists(filePath);
      expect(pathExists).to.be.true;
    });

    it("should have a README file with the name of the skill", async () => {
      const filePath = getFilePath("my-skill", "README.md");
      const pathExists = await fs.pathExists(filePath);
      const fileContent = await fs.readFile(filePath, "utf8");
      expect(pathExists).to.be.true;
      expect(fileContent).to.contain("my skill");
    });

    it("should have a package.json file with the name of the skill and author", async () => {
      const filePath = getFilePath("my-skill", "package.json");
      const fileContent = await fs.readFile(filePath, "utf8");
      expect(fileContent).to.contain('"name": "my-skill",');
      expect(fileContent).to.contain('"author": "Rain",');
    });
  });

  describe("Generate a Javascript project without serverless", () => {
    before(async () => {
      simple.mock(inquirer, "prompt").callFn(() => {
        return Promise.resolve({
          appName: "no serverless skill",
          author: "Rain",
          language: "javascript",
          serverless: false,
          canfulfill: true
        });
      });
      await action();
    });

    it("should not have a serverless file", async () => {
      const filePath = getFilePath("no-serverless-skill", "serverless.yml");
      const pathExists = await fs.pathExists(filePath);
      expect(pathExists).to.not.be.true;
    });
  });

  describe("Generate a Javascript project that uses canfulfill intents", () => {
    before(async () => {
      simple.mock(inquirer, "prompt").callFn(() => {
        return Promise.resolve({
          appName: "can fulfill skill",
          author: "Rain",
          language: "javascript",
          serverless: false,
          canfulfill: true
        });
      });
      await action();
    });

    it("should have canfulfill reference in index file", async () => {
      const filePath = getFilePath("can-fulfill-skill", "src", "app", "index.js");
      const fileContent = await fs.readFile(filePath, "utf8");
      expect(fileContent).to.contain("defaultFulfillIntents");
    });
  });
});
