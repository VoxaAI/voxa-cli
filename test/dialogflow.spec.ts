import { expect } from "chai";

describe("Dialogflow", () => {
  let agent: any;

  before(async () => {
    agent = await require("./out/speech-assets/dialogflow/production/agent.json");
  });

  describe("GOOGLE_ASSISTANT_WELCOME", () => {
    let intent: any;
    before(async () => {
      intent = await require("./out/speech-assets/dialogflow/production/intents/GOOGLE_ASSISTANT_WELCOME.json");
    });

    it("should generate a GOOGLE_ASSISTANT_WELCOME intent", () => {
      expect(intent.name).to.equal("GOOGLE_ASSISTANT_WELCOME");
    });

    it("should set the GOOGLE_ASSISTANT_WELCOME intent as a startIntent", () => {
      expect(agent.googleAssistant.startIntents[0].intentId).to.equal(intent.id);
    });
  });
});
