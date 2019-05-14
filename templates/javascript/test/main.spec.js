const mime = require("alexa-mime");
const nock = require("nock");
const path = require("path");
const simple = require("simple-mock");
const { alexaSkill } = require("../src/app");
const views = require("../src/app/views.json");

const describeWrapper = {
  clear: () => {
    simple.restore();
    nock.cleanAll();
  },
};

mime(
  { handler: alexaSkill.lambda() },
  views.en.translation,
  path.join(__dirname, "use-cases"),
  path.join(__dirname, "..", "reports", "simulate"),
  describeWrapper
);
