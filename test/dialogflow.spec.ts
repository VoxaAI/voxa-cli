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
    });
  });
});
