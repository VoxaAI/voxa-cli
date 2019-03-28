import { expect, use } from "chai";
import Chaifs = require("chai-fs");
import path = require("path");
import { configurations } from "./mocha.spec";

use(Chaifs);

configurations.forEach(interactionFile => {
  if (interactionFile.name === "Google") {
    describe("Media Assets", async () => {
      before(function before() {
        if (interactionFile.skip) {
          return this.skip();
        }
      });

      it("should create the assets directory", () => {
        expect(path.join(__dirname, interactionFile.assetsPath)).to.exist;
      });

      it("should download the files and those be valid", () => {
        const originalImage = path.join(__dirname, interactionFile.assetsPath, "images/small.png");
        const downloadedImage = path.join(
          __dirname,
          interactionFile.assetsPath,
          "images/small.png"
        );
        expect(originalImage)
          .to.be.a.file()
          .and.equal(downloadedImage);
      });
    });
  }
});
