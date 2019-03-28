import { expect } from "chai";
import * as path from "path";
import { configurations } from "./mocha.spec";

configurations.forEach(interactionFile => {
  describe(`${interactionFile.name} Alexa`, () => {
    let interaction: any;

    before(async function before() {
      if (interactionFile.skip) {
        return this.skip();
      }

      const interactionPath = path.join(
        __dirname,
        interactionFile.speechPath,
        "alexa/en-US/production-interaction.json"
      );

      interaction = await require(interactionPath);
    });

    describe("Interaction Model", () => {
      it("should generate a production interaction model", () => {
        expect(interaction).to.eql({
          interactionModel: {
            languageModel: {
              invocationName: "voxa cli",
              intents: [
                {
                  name: "AMAZON.NextIntent",
                  samples: [],
                  slots: []
                },
                {
                  name: "NumberIntent",
                  samples: ["The number {number}"],
                  slots: [
                    {
                      type: "AMAZON.Number",
                      name: "number"
                    }
                  ]
                },
                {
                  name: "AMAZON.FallbackIntent",
                  samples: [],
                  slots: []
                }
              ],
              types: []
            }
          }
        });
      });
    });
  });
});
