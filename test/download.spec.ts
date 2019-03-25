import { expect, use } from "chai";
import Chaifs = require("chai-fs");
import path = require("path");
import { configurationToExecute } from "./utils";

use(Chaifs);

const interactions = configurationToExecute();

interactions.forEach(interactionFile => {
  if (interactionFile.interactionFileName === "interaction-google.json") {
    describe("Media Assets", async () => {
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
