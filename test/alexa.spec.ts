import { expect } from "chai";
import fs = require("fs-extra");
import * as _ from "lodash";
import * as path from "path";
import { promisify } from "util";
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

      interaction = JSON.parse((await fs.readFile(interactionPath)).toString("utf-8"));
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
          "TravelIntent",
          "BearIntent"
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

        it("should add just an AMAZON.NUMBER as slot", () => {
          expect(numberIntent.slots).to.eql([
            {
              type: "AMAZON.NUMBER",
              name: "number"
            }
          ]);
        });
      });

      describe("TravelIntent", () => {
        let travelIntent: any;
        let travelIntentDialog: any;
        let prompts: any;

        before(() => {
          travelIntent = interaction.interactionModel.languageModel.intents[3];
          travelIntentDialog = interaction.interactionModel.dialog.intents[0];
          prompts = interaction.interactionModel.prompts;
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

        it("should generate a dialog model", () => {
          expect(travelIntentDialog.name).to.equal("TravelIntent");
        });

        it("should require confirmation for the TravelIntent dialog", () => {
          expect(travelIntentDialog.confirmationRequired).to.be.true;
        });

        it("should require confirmation for the {originCity} slot", () => {
          const originCitySlot = travelIntentDialog.slots[0];
          expect(originCitySlot.confirmationRequired).to.be.true;
        });

        it("should have a confirmation and an elicit dialog for {originCity}", () => {
          const originCitySlot = travelIntentDialog.slots[0];
          expect(originCitySlot.prompts.elicitation).to.exist;
          expect(originCitySlot.prompts.confirmation).to.exist;
        });

        it("should have an elicit dialog but not a confirmation for {date}", () => {
          const originCitySlot = travelIntentDialog.slots[2];
          expect(originCitySlot.prompts.elicitation).to.exist;
          expect(originCitySlot.prompts.confirmation).to.not.exist;
        });

        it("should have 6 prompts", () => {
          expect(prompts).to.have.lengthOf(6);
        });

        it("shoudl have 11 variations", () => {
          const variations = _(prompts)
            .map("variations")
            .flatten()
            .value();
          expect(variations).to.have.lengthOf(11);
        });
      });
    });
  });
});
