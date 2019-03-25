import { expect } from "chai";
import * as path from "path";
import { configurationToExecute } from "./utils";

const interactions = configurationToExecute();

interactions.forEach(interactionFile => {
  describe("Alexa", () => {
    let interaction: any;

    before(async () => {
      interaction = await require(path.join(
        __dirname,
        interactionFile.speechPath,
        "alexa/en-US/production-interaction.json"
      ));
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