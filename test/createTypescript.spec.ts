import { expect } from "chai";
import * as fs from "fs-extra";
import * as inquirer from "inquirer";
import * as path from "path";
import * as simple from "simple-mock";
import { action } from "../src/commands/create";

describe("Typescript project generator", () => {
  before(done => {
    simple.mock(process, "cwd").callFn(() => path.join(__dirname, "out", "typescript"));
    fs.remove(path.join(__dirname, "out", "typescript")).then(done);
  });

  after(() => {
    simple.restore();
  });

  function getFilePath(...args: any[]) {
    return path.join(__dirname, "out", "typescript", ...args);
  }

  describe("Generate a basic project", () => {
    before(async () => {
      simple.mock(inquirer, "prompt").callFn(() => {
        return Promise.resolve({
          appName: "my skill",
          author: "Rain",
          language: "typescript",
          voxaCli: false,
          canfulfill: true,
          analytics: [],
          platform: ["all"]
        });
      });
      await action();
    });

    it("should have a src folder", async () => {
      const filePath = getFilePath("my-skill", "src");
      const pathExists = await fs.pathExists(filePath);
      expect(pathExists).to.be.true;
    });

    it("should have a server.ts file", async () => {
      const filePath = getFilePath("my-skill", "server.ts");
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

    it("should have a test folder", async () => {
      const filePath = getFilePath("my-skill", "test");
      const pathExists = await fs.pathExists(filePath);
      expect(pathExists).to.be.true;
    });
  });

  describe("Generate a Typescript project with voxa-cli", () => {
    before(async () => {
      simple.mock(inquirer, "prompt").callFn(() => {
        return Promise.resolve({
          appName: "voxa cli skill",
          author: "Rain",
          language: "typescript",
          voxaCli: true,
          canfulfill: true,
          analytics: [],
          platform: ["all"]
        });
      });
      await action();
    });

    it("should have the interaction.json file", async () => {
      const filePath = getFilePath("voxa-cli-skill", "interaction.json");
      const pathExists = await fs.pathExists(filePath);
      expect(pathExists).to.be.true;
    });

    it("should have voxa-cli package in package.json", async () => {
      const filePath = getFilePath("voxa-cli-skill", "package.json");
      const fileContent = await fs.readFile(filePath, "utf8");
      expect(fileContent).to.contain('"voxa-cli": "2.1.2"');
      expect(fileContent).to.contain('"interaction": "voxa interaction"');
    });

    it("should have interaction usage in README file", async () => {
      const filePath = getFilePath("voxa-cli-skill", "README.md");
      const fileContent = await fs.readFile(filePath, "utf8");
      expect(fileContent).to.contain("## Interaction Model and Publishing Information");
      expect(fileContent).to.contain("$ yarn interaction");
      expect(fileContent).to.contain("- [Intents and Utterances](#)");
      expect(fileContent).to.contain("- [Publishing Information](#)");
    });
  });

  describe("Generate a Typescript project without voxa-cli", () => {
    before(async () => {
      simple.mock(inquirer, "prompt").callFn(() => {
        return Promise.resolve({
          appName: "no voxa cli skill",
          author: "Rain",
          language: "typescript",
          voxaCli: false,
          canfulfill: true,
          analytics: [],
          platform: ["all"]
        });
      });
      await action();
    });

    it("should not have the interaction.json file", async () => {
      const filePath = getFilePath("no-voxa-cli-skill", "interaction.json");
      const pathExists = await fs.pathExists(filePath);
      expect(pathExists).to.not.be.true;
    });

    it("should not have voxa-cli package in package.json", async () => {
      const filePath = getFilePath("no-voxa-cli-skill", "package.json");
      const fileContent = await fs.readFile(filePath, "utf8");
      expect(fileContent).to.not.contain('"voxa-cli": "2.1.2"');
      expect(fileContent).to.not.contain('"interaction": "voxa interaction"');
    });

    it("should not have interaction usage in README file", async () => {
      const filePath = getFilePath("no-voxa-cli-skill", "README.md");
      const fileContent = await fs.readFile(filePath, "utf8");
      expect(fileContent).to.not.contain("## Interaction Model and Publishing Information");
      expect(fileContent).to.not.contain("$ yarn interaction");
      expect(fileContent).to.not.contain("- [Intents and Utterances](#)");
      expect(fileContent).to.not.contain("- [Publishing Information](#)");
    });
  });

  describe("Generate a Typescript project that uses canfulfill intents", () => {
    before(async () => {
      simple.mock(inquirer, "prompt").callFn(() => {
        return Promise.resolve({
          appName: "can fulfill skill",
          author: "Rain",
          language: "typescript",
          voxaCli: false,
          canfulfill: true,
          analytics: [],
          platform: ["all"]
        });
      });
      await action();
    });

    it("should have canfulfill reference in index file", async () => {
      const filePath = getFilePath("can-fulfill-skill", "src", "app", "index.ts");
      const fileContent = await fs.readFile(filePath, "utf8");
      expect(fileContent).to.contain("defaultFulfillIntents");
    });
  });

  describe("Generate a Typescript project that uses all analytics", () => {
    before(async () => {
      simple.mock(inquirer, "prompt").callFn(() => {
        return Promise.resolve({
          appName: "all analytics skill",
          author: "Rain",
          language: "typescript",
          voxaCli: false,
          canfulfill: true,
          analytics: ["all"],
          platform: ["all"]
        });
      });
      await action();
    });

    it("should have all analytics in index file", async () => {
      const filePath = getFilePath("all-analytics-skill", "src", "app", "index.ts");
      const fileContent = await fs.readFile(filePath, "utf8");
      expect(fileContent).to.contain('import * as voxaGA from "voxa-ga";');
      expect(fileContent).to.contain('import { register as voxaDashbot } from "voxa-dashbot"');
      expect(fileContent).to.contain('import * as voxaChatbase from "voxa-chatbase"');
      expect(fileContent).to.contain("voxaGA(voxaApp, config.googleAnalytics);");
      expect(fileContent).to.contain("voxaDashbot(voxaApp, config.dashbot);");
      expect(fileContent).to.contain("voxaChatbase(voxaApp, config.chatbase);");
    });

    it("should have all analytics in the package.json file", async () => {
      const filePath = getFilePath("all-analytics-skill", "package.json");
      const fileContent = await fs.readFile(filePath, "utf8");
      expect(fileContent).to.contain('"voxa-chatbase": "0.1.1"');
      expect(fileContent).to.contain('"voxa-dashbot": "2.0.3"');
      expect(fileContent).to.contain('"voxa-ga": "2.0.1"');
    });

    it("should have all analytics basic configurations in the config files", async () => {
      const localPath = getFilePath("all-analytics-skill", "src", "config", "local.example.json");
      const stagingPath = getFilePath("all-analytics-skill", "src", "config", "staging.json");
      const prodPath = getFilePath("all-analytics-skill", "src", "config", "production.json");

      const localContent = JSON.parse(await fs.readFile(localPath, "utf8"));
      const stagingContent = JSON.parse(await fs.readFile(stagingPath, "utf8"));
      const prodContent = JSON.parse(await fs.readFile(prodPath, "utf8"));

      const ga =
        '"googleAnalytics":{"trackingId":"UA-XXXX-X","appName":"all-analytics-skill","ignoreUsers":[],"suppressSending":true}';
      const chatbase = '"dashbot":{"suppressSending":true,"alexa":"key"}';
      const dashbot =
        '"chatbase":{"apiKey":"<chatbase apiKey>","ignoreUsers":[],"suppressSending":true}';

      const prodGa =
        '"googleAnalytics":{"trackingId":"UA-XXXX-X","appName":"all-analytics-skill","ignoreUsers":[],"suppressSending":false}';
      const prodChatbase = '"dashbot":{"suppressSending":false,"alexa":"key"}';
      const prodDashbot =
        '"chatbase":{"apiKey":"<chatbase apiKey>","ignoreUsers":[],"suppressSending":false}';

      expect(JSON.stringify(localContent)).to.contain(ga);
      expect(JSON.stringify(localContent)).to.contain(chatbase);
      expect(JSON.stringify(localContent)).to.contain(dashbot);
      expect(JSON.stringify(stagingContent)).to.contain(ga);
      expect(JSON.stringify(stagingContent)).to.contain(chatbase);
      expect(JSON.stringify(stagingContent)).to.contain(dashbot);
      expect(JSON.stringify(prodContent)).to.contain(prodGa);
      expect(JSON.stringify(prodContent)).to.contain(prodChatbase);
      expect(JSON.stringify(prodContent)).to.contain(prodDashbot);
    });
  });

  describe("Generate a Typescript project doesn't use any analytics", () => {
    before(async () => {
      simple.mock(inquirer, "prompt").callFn(() => {
        return Promise.resolve({
          appName: "no analytics skill",
          author: "Rain",
          language: "typescript",
          voxaCli: false,
          canfulfill: true,
          analytics: ["none"],
          platform: ["all"]
        });
      });
      await action();
    });

    it("should not have analytics references in index file", async () => {
      const filePath = getFilePath("no-analytics-skill", "src", "app", "index.ts");
      const fileContent = await fs.readFile(filePath, "utf8");
      expect(fileContent).to.not.contain('import * as voxaGA from "voxa-ga";');
      expect(fileContent).to.not.contain('import { register as voxaDashbot } from "voxa-dashbot"');
      expect(fileContent).to.not.contain('import * as voxaChatbase from "voxa-chatbase"');
      expect(fileContent).to.not.contain("voxaGA(voxaApp, config.googleAnalytics);");
      expect(fileContent).to.not.contain("voxaDashbot(voxaApp, config.dashbot);");
      expect(fileContent).to.not.contain("voxaChatbase(voxaApp, config.chatbase);");
    });

    it("should not have analytics packages in the package.json file", async () => {
      const filePath = getFilePath("no-analytics-skill", "package.json");
      const fileContent = await fs.readFile(filePath, "utf8");
      expect(fileContent).to.not.contain('"voxa-chatbase": "0.1.1"');
      expect(fileContent).to.not.contain('"voxa-dashbot": "2.0.3"');
      expect(fileContent).to.not.contain('"voxa-ga": "2.0.1"');
    });

    it("should not have analytics basic configurations in the config files", async () => {
      const localPath = getFilePath("no-analytics-skill", "src", "config", "local.example.json");
      const stagingPath = getFilePath("no-analytics-skill", "src", "config", "staging.json");
      const prodPath = getFilePath("no-analytics-skill", "src", "config", "production.json");

      const localContent = JSON.parse(await fs.readFile(localPath, "utf8"));
      const stagingContent = JSON.parse(await fs.readFile(stagingPath, "utf8"));
      const prodContent = JSON.parse(await fs.readFile(prodPath, "utf8"));

      const ga =
        '"googleAnalytics":{"trackingId":"UA-XXXX-X","appName":"no-analytics-skill","ignoreUsers":[],"suppressSending":true}';
      const chatbase = '"dashbot":{"suppressSending":true,"alexa":"key"}';
      const dashbot =
        '"chatbase":{"apiKey":"<chatbase apiKey>","ignoreUsers":[],"suppressSending":true}';

      const prodGa =
        '"googleAnalytics":{"trackingId":"UA-XXXX-X","appName":"no-analytics-skill","ignoreUsers":[],"suppressSending":false}';
      const prodChatbase = '"dashbot":{"suppressSending":false,"alexa":"key"}';
      const prodDashbot =
        '"chatbase":{"apiKey":"<chatbase apiKey>","ignoreUsers":[],"suppressSending":false}';

      expect(JSON.stringify(localContent)).to.not.contain(ga);
      expect(JSON.stringify(localContent)).to.not.contain(chatbase);
      expect(JSON.stringify(localContent)).to.not.contain(dashbot);
      expect(JSON.stringify(stagingContent)).to.not.contain(ga);
      expect(JSON.stringify(stagingContent)).to.not.contain(chatbase);
      expect(JSON.stringify(stagingContent)).to.not.contain(dashbot);
      expect(JSON.stringify(prodContent)).to.not.contain(prodGa);
      expect(JSON.stringify(prodContent)).to.not.contain(prodChatbase);
      expect(JSON.stringify(prodContent)).to.not.contain(prodDashbot);
    });
  });

  describe("Generate a Typescript project that uses only Google Analytics", () => {
    before(async () => {
      simple.mock(inquirer, "prompt").callFn(() => {
        return Promise.resolve({
          appName: "ga analytics skill",
          author: "Rain",
          language: "typescript",
          voxaCli: false,
          canfulfill: true,
          analytics: ["ga"],
          platform: ["all"]
        });
      });
      await action();
    });

    it("should have only google analytics references in index file", async () => {
      const filePath = getFilePath("ga-analytics-skill", "src", "app", "index.ts");
      const fileContent = await fs.readFile(filePath, "utf8");
      expect(fileContent).to.contain('import * as voxaGA from "voxa-ga";');
      expect(fileContent).to.not.contain('import { register as voxaDashbot } from "voxa-dashbot"');
      expect(fileContent).to.not.contain('import * as voxaChatbase from "voxa-chatbase"');
      expect(fileContent).to.contain("voxaGA(voxaApp, config.googleAnalytics);");
      expect(fileContent).to.not.contain("voxaDashbot(voxaApp, config.dashbot);");
      expect(fileContent).to.not.contain("voxaChatbase(voxaApp, config.chatbase);");
    });

    it("should have only the voxa-ga package in the package.json file", async () => {
      const filePath = getFilePath("ga-analytics-skill", "package.json");
      const fileContent = await fs.readFile(filePath, "utf8");
      expect(fileContent).to.not.contain('"voxa-chatbase": "0.1.1"');
      expect(fileContent).to.not.contain('"voxa-dashbot": "2.0.3"');
      expect(fileContent).to.contain('"voxa-ga": "2.0.1"');
    });

    it("should have only the google analytics basic configuration in the config files", async () => {
      const localPath = getFilePath("ga-analytics-skill", "src", "config", "local.example.json");
      const stagingPath = getFilePath("ga-analytics-skill", "src", "config", "staging.json");
      const prodPath = getFilePath("ga-analytics-skill", "src", "config", "production.json");

      const localContent = JSON.parse(await fs.readFile(localPath, "utf8"));
      const stagingContent = JSON.parse(await fs.readFile(stagingPath, "utf8"));
      const prodContent = JSON.parse(await fs.readFile(prodPath, "utf8"));

      const ga =
        '"googleAnalytics":{"trackingId":"UA-XXXX-X","appName":"ga-analytics-skill","ignoreUsers":[],"suppressSending":true}';
      const chatbase = '"dashbot":{"suppressSending":true,"alexa":"key"}';
      const dashbot =
        '"chatbase":{"apiKey":"<chatbase apiKey>","ignoreUsers":[],"suppressSending":true}';

      const prodGa =
        '"googleAnalytics":{"trackingId":"UA-XXXX-X","appName":"ga-analytics-skill","ignoreUsers":[],"suppressSending":false}';
      const prodChatbase = '"dashbot":{"suppressSending":false,"alexa":"key"}';
      const prodDashbot =
        '"chatbase":{"apiKey":"<chatbase apiKey>","ignoreUsers":[],"suppressSending":false}';

      expect(JSON.stringify(localContent)).to.contain(ga);
      expect(JSON.stringify(localContent)).to.not.contain(chatbase);
      expect(JSON.stringify(localContent)).to.not.contain(dashbot);
      expect(JSON.stringify(stagingContent)).to.contain(ga);
      expect(JSON.stringify(stagingContent)).to.not.contain(chatbase);
      expect(JSON.stringify(stagingContent)).to.not.contain(dashbot);
      expect(JSON.stringify(prodContent)).to.contain(prodGa);
      expect(JSON.stringify(prodContent)).to.not.contain(prodChatbase);
      expect(JSON.stringify(prodContent)).to.not.contain(prodDashbot);
    });
  });

  describe("Generate a Typescript project that uses only Google Analytics and Dashbot", () => {
    before(async () => {
      simple.mock(inquirer, "prompt").callFn(() => {
        return Promise.resolve({
          appName: "ga dashbot analytics skill",
          author: "Rain",
          language: "typescript",
          voxaCli: false,
          canfulfill: true,
          analytics: ["ga", "dashbot"],
          platform: ["all"]
        });
      });
      await action();
    });

    it("should have only google analytics and dashbot references in index file", async () => {
      const filePath = getFilePath("ga-dashbot-analytics-skill", "src", "app", "index.ts");
      const fileContent = await fs.readFile(filePath, "utf8");
      expect(fileContent).to.contain('import * as voxaGA from "voxa-ga";');
      expect(fileContent).to.contain('import { register as voxaDashbot } from "voxa-dashbot"');
      expect(fileContent).to.not.contain('import * as voxaChatbase from "voxa-chatbase"');
      expect(fileContent).to.contain("voxaGA(voxaApp, config.googleAnalytics);");
      expect(fileContent).to.contain("voxaDashbot(voxaApp, config.dashbot);");
      expect(fileContent).to.not.contain("voxaChatbase(voxaApp, config.chatbase);");
    });

    it("should have only the voxa-ga and the voxa-dashbot packages in the package.json file", async () => {
      const filePath = getFilePath("ga-dashbot-analytics-skill", "package.json");
      const fileContent = await fs.readFile(filePath, "utf8");
      expect(fileContent).to.not.contain('"voxa-chatbase": "0.1.1"');
      expect(fileContent).to.contain('"voxa-dashbot": "2.0.3"');
      expect(fileContent).to.contain('"voxa-ga": "2.0.1"');
    });

    it("should have only the google analytics and dashbot basic configuration in the config files", async () => {
      const localPath = getFilePath(
        "ga-dashbot-analytics-skill",
        "src",
        "config",
        "local.example.json"
      );
      const stagingPath = getFilePath(
        "ga-dashbot-analytics-skill",
        "src",
        "config",
        "staging.json"
      );
      const prodPath = getFilePath(
        "ga-dashbot-analytics-skill",
        "src",
        "config",
        "production.json"
      );

      const localContent = JSON.parse(await fs.readFile(localPath, "utf8"));
      const stagingContent = JSON.parse(await fs.readFile(stagingPath, "utf8"));
      const prodContent = JSON.parse(await fs.readFile(prodPath, "utf8"));

      const ga =
        '"googleAnalytics":{"trackingId":"UA-XXXX-X","appName":"ga-dashbot-analytics-skill","ignoreUsers":[],"suppressSending":true}';
      const dashbot = '"dashbot":{"suppressSending":true,"alexa":"key"}';
      const chatbase =
        '"chatbase":{"apiKey":"<chatbase apiKey>","ignoreUsers":[],"suppressSending":true}';

      const prodGa =
        '"googleAnalytics":{"trackingId":"UA-XXXX-X","appName":"ga-dashbot-analytics-skill","ignoreUsers":[],"suppressSending":false}';
      const prodDashbot = '"dashbot":{"suppressSending":false,"alexa":"key"}';
      const prodChatbase =
        '"chatbase":{"apiKey":"<chatbase apiKey>","ignoreUsers":[],"suppressSending":false}';

      expect(JSON.stringify(localContent)).to.contain(ga);
      expect(JSON.stringify(localContent)).to.not.contain(chatbase);
      expect(JSON.stringify(localContent)).to.contain(dashbot);
      expect(JSON.stringify(stagingContent)).to.contain(ga);
      expect(JSON.stringify(stagingContent)).to.not.contain(chatbase);
      expect(JSON.stringify(stagingContent)).to.contain(dashbot);
      expect(JSON.stringify(prodContent)).to.contain(prodGa);
      expect(JSON.stringify(prodContent)).to.not.contain(prodChatbase);
      expect(JSON.stringify(prodContent)).to.contain(prodDashbot);
    });
  });

  describe("Generate a Typescript project that store user information in DynamoDB", () => {
    before(async () => {
      simple.mock(inquirer, "prompt").callFn(() => {
        return Promise.resolve({
          appName: "user skill",
          author: "Rain",
          language: "typescript",
          voxaCli: false,
          canfulfill: true,
          analytics: ["none"],
          saveUserInfo: true,
          platform: ["all"]
        });
      });
      await action();
    });

    it("should have a User service file", async () => {
      const filePath = getFilePath("user-skill", "src", "services", "User.ts");
      const pathExists = await fs.pathExists(filePath);
      expect(pathExists).to.be.true;
    });

    it("should have a dynamoDB table presets in the config files", async () => {
      const localFilePath = getFilePath("user-skill", "src", "config", "local.example.json");
      const stagingFilePath = getFilePath("user-skill", "src", "config", "staging.json");
      const prodFilePath = getFilePath("user-skill", "src", "config", "production.json");

      const localFileContent = JSON.parse(await fs.readFile(localFilePath, "utf8"));
      const stagingFileContent = JSON.parse(await fs.readFile(stagingFilePath, "utf8"));
      const prodFileContent = JSON.parse(await fs.readFile(prodFilePath, "utf8"));

      expect(JSON.stringify(localFileContent)).to.contain(
        '"dynamoDB":{"tables":{"users":"users"}}'
      );
      expect(JSON.stringify(stagingFileContent)).to.contain(
        '"dynamoDB":{"tables":{"users":"users"}}'
      );
      expect(JSON.stringify(prodFileContent)).to.contain('"dynamoDB":{"tables":{"users":"users"}}');
    });

    it("should have lifecycle methods to retrieve and save user info in the session", async () => {
      const filePath = getFilePath("user-skill", "src", "app", "index.ts");
      const fileContent = await fs.readFile(filePath, "utf8");
      expect(fileContent).to.contain('import { User } from "../services/User";');
      expect(fileContent).to.contain(
        "const model = voxaEvent.model as Model;\n  model.user = user;"
      );
      expect(fileContent).to.contain("user.newSession();");
      expect(fileContent).to.contain("await user.save({ userId: voxaEvent.user.userId });");
    });

    it("should have DynamoDB configurations for the user table in serverless file", async () => {
      const filePath = getFilePath("user-skill", "serverless.yml");
      const fileContent = await fs.readFile(filePath, "utf8");
      expect(fileContent).to.contain("DynamoDBCapacity:");
      expect(fileContent).to.contain("Resource: !GetAtt TableUsers.Arn");
      expect(fileContent).to.contain("TableUsers:");
      // tslint:disable-next-line:no-invalid-template-strings
      expect(fileContent).to.contain("TableName: ${self:custom.config.dynamodb.tables.users}");
    });

    it("should add a user attribute to the model", async () => {
      const filePath = getFilePath("user-skill", "src", "app", "model.ts");
      const fileContent = await fs.readFile(filePath, "utf8");
      expect(fileContent).to.contain('import { User } from "../services/User";');
      expect(fileContent).to.contain("public user: User;");
    });
  });

  describe("Generate a Typescript project that doesn't store user information in DynamoDB", () => {
    before(async () => {
      simple.mock(inquirer, "prompt").callFn(() => {
        return Promise.resolve({
          appName: "no user skill",
          author: "Rain",
          language: "typescript",
          voxaCli: false,
          canfulfill: true,
          analytics: ["none"],
          saveUserInfo: false,
          platform: ["all"]
        });
      });
      await action();
    });

    it("should not have a User service file", async () => {
      const filePath = getFilePath("no-user-skill", "src", "services", "User.ts");
      const pathExists = await fs.pathExists(filePath);
      expect(pathExists).to.be.false;
    });

    it("should not have a dynamoDB table presets in the config files", async () => {
      const localFilePath = getFilePath("no-user-skill", "src", "config", "local.example.json");
      const stagingFilePath = getFilePath("no-user-skill", "src", "config", "staging.json");
      const prodFilePath = getFilePath("no-user-skill", "src", "config", "production.json");

      const localFileContent = JSON.parse(await fs.readFile(localFilePath, "utf8"));
      const stagingFileContent = JSON.parse(await fs.readFile(stagingFilePath, "utf8"));
      const prodFileContent = JSON.parse(await fs.readFile(prodFilePath, "utf8"));

      expect(JSON.stringify(localFileContent)).to.not.contain(
        '"dynamoDB":{"tables":{"users":"users"}}'
      );
      expect(JSON.stringify(stagingFileContent)).to.not.contain(
        '"dynamoDB":{"tables":{"users":"users"}}'
      );
      expect(JSON.stringify(prodFileContent)).to.not.contain(
        '"dynamoDB":{"tables":{"users":"users"}}'
      );
    });

    it("should not have lifecycle methods to retrieve and save user info in the session", async () => {
      const filePath = getFilePath("no-user-skill", "src", "app", "index.ts");
      const fileContent = await fs.readFile(filePath, "utf8");
      expect(fileContent).to.not.contain('import { User } from "../services/User";');
      expect(fileContent).to.not.contain(
        "const model = voxaEvent.model as Model;\n  model.user = user;"
      );
      expect(fileContent).to.not.contain("user.newSession();");
      expect(fileContent).to.not.contain("await user.save({ userId: voxaEvent.user.userId });");
    });

    it("should not have DynamoDB configurations for the user table in serverless file", async () => {
      const filePath = getFilePath("no-user-skill", "serverless.yml");
      const fileContent = await fs.readFile(filePath, "utf8");
      expect(fileContent).to.not.contain("DynamoDBCapacity:");
      expect(fileContent).to.not.contain("Resource: !GetAtt TableUsers.Arn");
      expect(fileContent).to.not.contain("TableUsers:");
      // tslint:disable-next-line:no-invalid-template-strings
      expect(fileContent).to.not.contain("TableName: ${self:custom.config.dynamodb.tables.users}");
    });

    it("should not add a user attribute to the model", async () => {
      const filePath = getFilePath("no-user-skill", "src", "app", "model.ts");
      const fileContent = await fs.readFile(filePath, "utf8");
      expect(fileContent).to.not.contain('import { User } from "../services/User";');
      expect(fileContent).to.not.contain("public user: User;");
    });
  });

  describe("Generate a Typescript project only for Alexa", () => {
    before(async () => {
      simple.mock(inquirer, "prompt").callFn(() => {
        return Promise.resolve({
          appName: "my alexa skill",
          author: "Rain",
          language: "typescript",
          voxaCli: false,
          canfulfill: false,
          analytics: [],
          platform: ["alexa"]
        });
      });
      await action();
    });

    it("should have support only for Alexa platform in the index file", async () => {
      const filePath = getFilePath("my-alexa-skill", "src", "app", "index.ts");
      const fileContent = await fs.readFile(filePath, "utf8");
      expect(fileContent).to.contain("AlexaPlatform,");
      expect(fileContent).to.contain("export const alexaSkill = new AlexaPlatform(voxaApp);");
      expect(fileContent).to.not.contain("DialogflowPlatform,");
      expect(fileContent).to.not.contain(
        "export const telegramBot = new DialogflowPlatform(voxaApp);"
      );
      expect(fileContent).to.not.contain("FacebookPlatform,");
      expect(fileContent).to.not.contain(
        "export const facebookBot = new FacebookPlatform(voxaApp);"
      );
      expect(fileContent).to.not.contain("GoogleAssistantPlatform,");
      expect(fileContent).to.not.contain(
        "export const assistantAction = new GoogleAssistantPlatform(voxaApp);"
      );
    });

    it("should have an endpoint only for Alexa in the server file", async () => {
      const filePath = getFilePath("my-alexa-skill", "server.ts");
      const fileContent = await fs.readFile(filePath, "utf8");
      expect(fileContent).to.contain("alexaSkill,");
      expect(fileContent).to.contain('"/alexa": alexaSkill,');
      expect(fileContent).to.not.contain("assistantAction,");
      expect(fileContent).to.not.contain('"/googleAction": assistantAction,');
      expect(fileContent).to.not.contain("facebookBot,");
      expect(fileContent).to.not.contain('"/facebook": facebookBot,');
      expect(fileContent).to.not.contain("telegramBot,");
      expect(fileContent).to.not.contain('"/telegram": telegramBot,');
    });

    it("should have function configuration only for Alexa in serverless file", async () => {
      const filePath = getFilePath("my-alexa-skill", "serverless.yml");
      const fileContent = await fs.readFile(filePath, "utf8");
      expect(fileContent).to.contain("handler: src/handler.alexaHandler");
      expect(fileContent).to.not.contain("handler: src/handler.assistantHandler");
      expect(fileContent).to.not.contain("handler: src/handler.facebookHandler");
      expect(fileContent).to.not.contain("handler: src/handler.telegramHandler");
    });

    it("should export only the Alexa lambda handler in the handler file", async () => {
      const filePath = getFilePath("my-alexa-skill", "src", "handler.ts");
      const fileContent = await fs.readFile(filePath, "utf8");
      expect(fileContent).to.contain("alexaSkill,");
      expect(fileContent).to.contain("export const alexaHandler = alexaSkill.lambda();");
      expect(fileContent).to.not.contain("assistantAction,");
      expect(fileContent).to.not.contain(
        "export const assistantHandler = assistantAction.lambdaHTTP();"
      );
      expect(fileContent).to.not.contain("facebookBot,");
      expect(fileContent).to.not.contain(
        "export const facebookHandler = facebookBot.lambdaHTTP();"
      );
      expect(fileContent).to.not.contain("telegramBot,");
      expect(fileContent).to.not.contain(
        "export const telegramHandler = telegramBot.lambdaHTTP();"
      );
    });
  });

  describe("Generate a Typescript project only for Alexa and Google Assistant", () => {
    before(async () => {
      simple.mock(inquirer, "prompt").callFn(() => {
        return Promise.resolve({
          appName: "my alexa ga skill",
          author: "Rain",
          language: "typescript",
          voxaCli: false,
          canfulfill: false,
          analytics: [],
          platform: ["alexa", "google"]
        });
      });
      await action();
    });

    it("should have support only for Alexa platform in the index file", async () => {
      const filePath = getFilePath("my-alexa-ga-skill", "src", "app", "index.ts");
      const fileContent = await fs.readFile(filePath, "utf8");
      expect(fileContent).to.contain("AlexaPlatform,");
      expect(fileContent).to.contain("export const alexaSkill = new AlexaPlatform(voxaApp);");
      expect(fileContent).to.not.contain("DialogflowPlatform,");
      expect(fileContent).to.not.contain(
        "export const telegramBot = new DialogflowPlatform(voxaApp);"
      );
      expect(fileContent).to.not.contain("FacebookPlatform,");
      expect(fileContent).to.not.contain(
        "export const facebookBot = new FacebookPlatform(voxaApp);"
      );
      expect(fileContent).to.contain("GoogleAssistantPlatform,");
      expect(fileContent).to.contain(
        "export const assistantAction = new GoogleAssistantPlatform(voxaApp);"
      );
    });

    it("should have an endpoint only for Alexa in the server file", async () => {
      const filePath = getFilePath("my-alexa-ga-skill", "server.ts");
      const fileContent = await fs.readFile(filePath, "utf8");
      expect(fileContent).to.contain("alexaSkill,");
      expect(fileContent).to.contain('"/alexa": alexaSkill,');
      expect(fileContent).to.contain("assistantAction,");
      expect(fileContent).to.contain('"/googleAction": assistantAction,');
      expect(fileContent).to.not.contain("facebookBot,");
      expect(fileContent).to.not.contain('"/facebook": facebookBot,');
      expect(fileContent).to.not.contain("telegramBot,");
      expect(fileContent).to.not.contain('"/telegram": telegramBot,');
    });

    it("should have function configuration only for Alexa in serverless file", async () => {
      const filePath = getFilePath("my-alexa-ga-skill", "serverless.yml");
      const fileContent = await fs.readFile(filePath, "utf8");
      expect(fileContent).to.contain("handler: src/handler.alexaHandler");
      expect(fileContent).to.contain("handler: src/handler.assistantHandler");
      expect(fileContent).to.not.contain("handler: src/handler.facebookHandler");
      expect(fileContent).to.not.contain("handler: src/handler.telegramHandler");
    });

    it("should export only the Alexa lambda handler in the handler file", async () => {
      const filePath = getFilePath("my-alexa-ga-skill", "src", "handler.ts");
      const fileContent = await fs.readFile(filePath, "utf8");
      expect(fileContent).to.contain("alexaSkill,");
      expect(fileContent).to.contain("export const alexaHandler = alexaSkill.lambda();");
      expect(fileContent).to.contain("assistantAction,");
      expect(fileContent).to.contain(
        "export const assistantHandler = assistantAction.lambdaHTTP();"
      );
      expect(fileContent).to.not.contain("facebookBot,");
      expect(fileContent).to.not.contain(
        "export const facebookHandler = facebookBot.lambdaHTTP();"
      );
      expect(fileContent).to.not.contain("telegramBot,");
      expect(fileContent).to.not.contain(
        "export const telegramHandler = telegramBot.lambdaHTTP();"
      );
    });
  });

  describe("Generate a Typescript project only for Alexa, Google Assistant and Facebook Messenger", () => {
    before(async () => {
      simple.mock(inquirer, "prompt").callFn(() => {
        return Promise.resolve({
          appName: "my alexa ga fb skill",
          author: "Rain",
          language: "typescript",
          voxaCli: false,
          canfulfill: false,
          analytics: [],
          platform: ["alexa", "google", "facebook"]
        });
      });
      await action();
    });

    it("should have support only for Alexa platform in the index file", async () => {
      const filePath = getFilePath("my-alexa-ga-fb-skill", "src", "app", "index.ts");
      const fileContent = await fs.readFile(filePath, "utf8");
      expect(fileContent).to.contain("AlexaPlatform,");
      expect(fileContent).to.contain("export const alexaSkill = new AlexaPlatform(voxaApp);");
      expect(fileContent).to.not.contain("DialogflowPlatform,");
      expect(fileContent).to.not.contain(
        "export const telegramBot = new DialogflowPlatform(voxaApp);"
      );
      expect(fileContent).to.contain("FacebookPlatform,");
      expect(fileContent).to.contain("export const facebookBot = new FacebookPlatform(voxaApp);");
      expect(fileContent).to.contain("GoogleAssistantPlatform,");
      expect(fileContent).to.contain(
        "export const assistantAction = new GoogleAssistantPlatform(voxaApp);"
      );
    });

    it("should have an endpoint only for Alexa in the server file", async () => {
      const filePath = getFilePath("my-alexa-ga-fb-skill", "server.ts");
      const fileContent = await fs.readFile(filePath, "utf8");
      expect(fileContent).to.contain("alexaSkill,");
      expect(fileContent).to.contain('"/alexa": alexaSkill,');
      expect(fileContent).to.contain("assistantAction,");
      expect(fileContent).to.contain('"/googleAction": assistantAction,');
      expect(fileContent).to.contain("facebookBot,");
      expect(fileContent).to.contain('"/facebook": facebookBot,');
      expect(fileContent).to.not.contain("telegramBot,");
      expect(fileContent).to.not.contain('"/telegram": telegramBot,');
    });

    it("should have function configuration only for Alexa in serverless file", async () => {
      const filePath = getFilePath("my-alexa-ga-fb-skill", "serverless.yml");
      const fileContent = await fs.readFile(filePath, "utf8");
      expect(fileContent).to.contain("handler: src/handler.alexaHandler");
      expect(fileContent).to.contain("handler: src/handler.assistantHandler");
      expect(fileContent).to.contain("handler: src/handler.facebookHandler");
      expect(fileContent).to.not.contain("handler: src/handler.telegramHandler");
    });

    it("should export only the Alexa lambda handler in the handler file", async () => {
      const filePath = getFilePath("my-alexa-ga-fb-skill", "src", "handler.ts");
      const fileContent = await fs.readFile(filePath, "utf8");
      expect(fileContent).to.contain("alexaSkill,");
      expect(fileContent).to.contain("export const alexaHandler = alexaSkill.lambda();");
      expect(fileContent).to.contain("assistantAction,");
      expect(fileContent).to.contain(
        "export const assistantHandler = assistantAction.lambdaHTTP();"
      );
      expect(fileContent).to.contain("facebookBot,");
      expect(fileContent).to.contain("export const facebookHandler = facebookBot.lambdaHTTP();");
      expect(fileContent).to.not.contain("telegramBot,");
      expect(fileContent).to.not.contain(
        "export const telegramHandler = telegramBot.lambdaHTTP();"
      );
    });
  });

  describe("Generate a Typescript project for all platforms available", () => {
    before(async () => {
      simple.mock(inquirer, "prompt").callFn(() => {
        return Promise.resolve({
          appName: "my all platforms skill",
          author: "Rain",
          language: "typescript",
          voxaCli: false,
          canfulfill: false,
          analytics: [],
          platform: ["all"]
        });
      });
      await action();
    });

    it("should have support only for Alexa platform in the index file", async () => {
      const filePath = getFilePath("my-all-platforms-skill", "src", "app", "index.ts");
      const fileContent = await fs.readFile(filePath, "utf8");
      expect(fileContent).to.contain("AlexaPlatform,");
      expect(fileContent).to.contain("export const alexaSkill = new AlexaPlatform(voxaApp);");
      expect(fileContent).to.contain("DialogflowPlatform,");
      expect(fileContent).to.contain("export const telegramBot = new DialogflowPlatform(voxaApp);");
      expect(fileContent).to.contain("FacebookPlatform,");
      expect(fileContent).to.contain("export const facebookBot = new FacebookPlatform(voxaApp);");
      expect(fileContent).to.contain("GoogleAssistantPlatform,");
      expect(fileContent).to.contain(
        "export const assistantAction = new GoogleAssistantPlatform(voxaApp);"
      );
    });

    it("should have an endpoint only for Alexa in the server file", async () => {
      const filePath = getFilePath("my-all-platforms-skill", "server.ts");
      const fileContent = await fs.readFile(filePath, "utf8");
      expect(fileContent).to.contain("alexaSkill,");
      expect(fileContent).to.contain('"/alexa": alexaSkill,');
      expect(fileContent).to.contain("assistantAction,");
      expect(fileContent).to.contain('"/googleAction": assistantAction,');
      expect(fileContent).to.contain("facebookBot,");
      expect(fileContent).to.contain('"/facebook": facebookBot,');
      expect(fileContent).to.contain("telegramBot,");
      expect(fileContent).to.contain('"/telegram": telegramBot,');
    });

    it("should have function configuration only for Alexa in serverless file", async () => {
      const filePath = getFilePath("my-all-platforms-skill", "serverless.yml");
      const fileContent = await fs.readFile(filePath, "utf8");
      expect(fileContent).to.contain("handler: src/handler.alexaHandler");
      expect(fileContent).to.contain("handler: src/handler.assistantHandler");
      expect(fileContent).to.contain("handler: src/handler.facebookHandler");
      expect(fileContent).to.contain("handler: src/handler.telegramHandler");
    });

    it("should export only the Alexa lambda handler in the handler file", async () => {
      const filePath = getFilePath("my-all-platforms-skill", "src", "handler.ts");
      const fileContent = await fs.readFile(filePath, "utf8");
      expect(fileContent).to.contain("alexaSkill,");
      expect(fileContent).to.contain("export const alexaHandler = alexaSkill.lambda();");
      expect(fileContent).to.contain("assistantAction,");
      expect(fileContent).to.contain(
        "export const assistantHandler = assistantAction.lambdaHTTP();"
      );
      expect(fileContent).to.contain("facebookBot,");
      expect(fileContent).to.contain("export const facebookHandler = facebookBot.lambdaHTTP();");
      expect(fileContent).to.contain("telegramBot,");
      expect(fileContent).to.contain("export const telegramHandler = telegramBot.lambdaHTTP();");
    });
  });
});
