import { expect } from "chai";

describe("Alexa", () => {
  let interaction: any;

  before(async () => {
    interaction = await require("./out/speech-assets/alexa/en-US/production-interaction.json");
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
