import { expect } from "chai";
import * as path from "path";
import { configurations } from "./mocha.spec";

configurations.forEach(interaction => {
  describe(`${interaction.name} Views`, () => {
    let views: any;
    before(async function before() {
      if (interaction.skip) {
        return this.skip();
      }

      views = await require(path.join(__dirname, interaction.viewsPath, "views.json"));
    });

    it("should generate an en-US Launch.say", () => {
      expect(views["en-US"].translation.Launch).to.deep.equal({
        say: ["Hello World!"]
      });
    });
  });
});
