import { expect } from "chai";
import * as _ from "lodash";
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
      let intentUtterance: any;
      before(async () => {
        intent = await require(path.join(
          __dirname,
          interactionFile.speechPath,
          "dialogflow/production/intents/NumberIntent.json"
        ));
        intentUtterance = await require(path.join(
          __dirname,
          interactionFile.speechPath,
          "dialogflow/production/intents/NumberIntent_usersays_en.json"
        ));
      });

      it("should set slotRequired for the first slot to be false", () => {
        expect(intent.responses[0].parameters).to.have.lengthOf(1);
        expect(intent.responses[0].parameters[0].required).to.be.false;
      });

      it("should set webhookForSlotFilling to true", () => {
        expect(intent.webhookForSlotFilling).to.be.true;
      });

      it("should have @sys slot for numbers", () => {
        intentUtterance.forEach((utterance: any) => {
          const numberMetaPhrase = utterance.data.find((item: any) => item.meta === "@sys.number");
          expect(numberMetaPhrase).to.be.ok;

          expect(_.pick(numberMetaPhrase, ["meta", "alias", "text"])).to.be.eql({
            meta: "@sys.number",
            alias: "number",
            text: "{number}"
          });
        });
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
