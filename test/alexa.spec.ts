import { expect } from "chai";
import * as _ from "lodash";
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
      it("should add 4 intents", () => {
        const intents = _(interaction.interactionModel.languageModel.intents)
          .map("name")
          .value();

        expect(intents).to.eql([
          "AMAZON.NextIntent",
          "NumberIntent",
          "AMAZON.FallbackIntent",
          "TravelIntent"
        ]);
      });

      it("should set the invocationName", () => {
        expect(interaction.interactionModel.languageModel.invocationName).to.equal("voxa cli");
      });

      describe("NumberIntent", () => {
        let numberIntent: any;
        before(() => {
          numberIntent = interaction.interactionModel.languageModel.intents[1];
        });

        it("should add 2 utterances", () => {
          expect(numberIntent.samples).to.eql([
            "The number {number}",
            "Another number utterance {number}"
          ]);
        });

        it("should add just an AMAZON.Number as slot", () => {
          expect(numberIntent.slots).to.eql([
            {
              type: "AMAZON.Number",
              name: "number"
            }
          ]);
        });
      });

      describe("TravelIntent", () => {
        let travelIntent: any;
        before(() => {
          travelIntent = interaction.interactionModel.languageModel.intents[3];
        });

        it("should have 3 slots", () => {
          const slotNames = _(travelIntent.slots)
            .map("name")
            .value();
          expect(slotNames).to.eql(["originCity", "destinationCity", "date"]);
        });

        it("should have specific utterances for each slot", () => {
          const slotSamples = _(travelIntent.slots)
            .map("samples")
            .value();

          expect(slotSamples).to.eql([
            ["i'm leaving from {originCity}", "{originCity}", "i'm traveling from {originCity}"],
            ["i'm traveling to {destinationCity}", "{destinationCity}"],
            ["i'm traveling on {date}", "{date}", "i want to leave on {date}"]
          ]);
        });

        it("should have many utterances", () => {
          const utterances = travelIntent.samples;
          expect(utterances).to.have.lengthOf(10);
        });
      });
    });
  });
});
