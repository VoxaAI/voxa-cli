import { expect } from "chai";
import * as path from "path";
import { configurations } from "./mocha.spec";

configurations.forEach(interactionFile => {
  describe(`${interactionFile.name} Dialogflow`, () => {
    let agent: any;

    before(async function before() {
      if (interactionFile.skip) {
        return this.skip();
      }

      agent = await require(path.join(
        __dirname,
        interactionFile.speechPath,
        "dialogflow/production/agent.json"
      ));
    });

    describe("GOOGLE_ASSISTANT_WELCOME", () => {
      let intent: any;
      before(async () => {
        intent = await require(path.join(
          __dirname,
          interactionFile.speechPath,
          "dialogflow/production/intents/GOOGLE_ASSISTANT_WELCOME.json"
        ));
      });

      it("should generate a GOOGLE_ASSISTANT_WELCOME intent", () => {
        expect(intent.name).to.equal("GOOGLE_ASSISTANT_WELCOME");
      });

      it("should set the GOOGLE_ASSISTANT_WELCOME intent as a startIntent", () => {
        expect(agent.googleAssistant.startIntents[0].intentId).to.equal(intent.id);
      });

      it("should set webhookForSlotFilling to false", () => {
        expect(intent.webhookForSlotFilling).to.be.false;
      });
    });

    describe("NumberIntent", () => {
      let intent: any;
      before(async () => {
        intent = await require(path.join(
          __dirname,
          interactionFile.speechPath,
          "dialogflow/production/intents/NumberIntent.json"
        ));
      });

      it("should set slotRequired for the first slot to be false", () => {
        expect(intent.responses[0].parameters).to.have.lengthOf(1);
        expect(intent.responses[0].parameters[0].required).to.be.false;
      });

      it("should set webhookForSlotFilling to true", () => {
        expect(intent.webhookForSlotFilling).to.be.true;
      });
    });

    describe("JokeIntent", () => {
      let intent: any;
      before(async () => {
        intent = await require(path.join(
          __dirname,
          interactionFile.speechPath,
          "dialogflow/production/intents/JokeIntent.json"
        ));
      });
      it("should set webhookUsed to false", () => {
        expect(intent.webhookUsed).to.be.false;
      });

      it("should create a messages key with an array of the responses", () => {
        expect(intent.responses[0].messages).to.have.lengthOf(1);
        expect(intent.responses[0].messages[0].speech).to.have.lengthOf(3);
      });
    });

    describe("DateIntent", () => {
      let intent: any;

      before(async () => {
        intent = await require(path.join(
          __dirname,
          interactionFile.speechPath,
          "dialogflow/production/intents/DateIntent.json"
        ));
      });

      it("should set slotRequired for the first slot to be true", () => {
        expect(intent.responses[0].parameters).to.have.lengthOf(1);
        expect(intent.responses[0].parameters[0].required).to.be.true;
      });
    });
  });
});
