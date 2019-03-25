import { expect } from "chai";
import * as path from "path";
import { configurationToExecute } from "./utils";

const interactions = configurationToExecute();

interactions.forEach(interaction => {
  describe("Views", () => {
    let views: any;
    before(async () => {
      views = await require(path.join(__dirname, interaction.viewsPath, "views.json"));
    });

    it("should generate an en-US Launch.say", () => {
      expect(views["en-US"].translation.Launch).to.deep.equal({
        say: ["Hello World!"]
      });
    });
  });
});
