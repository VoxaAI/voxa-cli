import fs = require("fs-extra");
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

      const viewsPath = path.join(
        path.dirname(interaction.interactionFileName),
        interaction.viewsPath,
        "views.json"
      );

      views = JSON.parse((await fs.readFile(viewsPath)).toString());
    });

    it("should generate an en-US Launch.say", () => {
      expect(views["en-US"].translation.Launch).to.deep.equal({
        say: ["Hello World!", "Hi World!"]
      });
    });
  });
});
