/*
 * Copyright (c) 2018 Rain Agency <contact@rain.agency>
 * Author: Rain Agency <contact@rain.agency>
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 * the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
 * FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 * COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
 * IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

import { expect } from "chai";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";
import { configurations } from "./mocha.spec";

configurations.forEach(interactionFile => {
  if (!_.includes(interactionFile.platforms, "alexa") && !interactionFile.alexaSpreadsheets) {
    return;
  }

  describe(`${interactionFile.name} Alexa`, () => {
    let interaction: any;

    before(async function before() {
      if (interactionFile.skip) {
        return this.skip();
      }

      const interactionPath = path.join(
        path.dirname(interactionFile.interactionFileName),
        interactionFile.speechPath,
        "alexa/en-US/production-interaction.json"
      );

      interaction = JSON.parse((await fs.readFile(interactionPath)).toString("utf-8"));
    });

    describe("Interaction Model", () => {
      it("should add 5 intents", () => {
        const intents = _(interaction.interactionModel.languageModel.intents)
          .map("name")
          .value();

        expect(intents).to.eql([
          "AMAZON.NextIntent",
          "NumberIntent",
          "AMAZON.FallbackIntent",
          "TravelIntent",
          "BearIntent",
          "HumanIntent"
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
          travelIntentDialog = _.get(interaction, "interactionModel.dialog.intents[0]");
          prompts = interaction.interactionModel.prompts;
        });

        it("should have 3 slots", () => {
          const slotNames = _(travelIntent.slots)
            .map("name")
            .value();
          expect(slotNames).to.eql(["originCity", "destinationCity", "date"]);
        });

        it("should have many utterances", () => {
          const utterances = travelIntent.samples;
          expect(utterances).to.have.lengthOf(10);
        });

        describe("Dialog", () => {
          if (!_.includes(interactionFile.interactionFileName, "no-dialog")) {
            it("should have specific utterances for each slot", () => {
              const slotSamples = _(travelIntent.slots)
                .map("samples")
                .value();

              expect(slotSamples).to.eql([
                [
                  "i'm leaving from {originCity}",
                  "{originCity}",
                  "i'm traveling from {originCity}"
                ],
                ["i'm traveling to {destinationCity}", "{destinationCity}"],
                ["i'm traveling on {date}", "{date}", "i want to leave on {date}"]
              ]);
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
          } else {
            it("should not generate a dialog model", () => {
              expect(travelIntentDialog).to.be.undefined;
            });
            it("should not generate prompts", () => {
              expect(prompts).to.be.undefined;
            });
          }
        });
      });

      describe("HumanIntent", () => {
        let humanIntent: any;
        before(() => {
          humanIntent = interaction.interactionModel.languageModel.intents[5];
        });

        it("should not have slots", () => {
          expect(_.get(humanIntent, "slots")).to.be.empty;
        });

        it("should not have samples", () => {
          expect(_.get(humanIntent, "samples")).to.be.empty;
        });
      });
    });
  });
});
