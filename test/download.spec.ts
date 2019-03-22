import { expect, use } from "chai";
import Chaifs = require("chai-fs");
import path = require("path");

use(Chaifs);

describe("Media Assets", () => {
  it("should create the assets directory", () => {
    expect(path.join(__dirname, "out/assets")).to.exist;
  });

  it("should download the files and those be valid", () => {
    const originalImage = path.join(__dirname, "out/assets/images/small.png");
    const downloadedImage = path.join(__dirname, "assets/images/small.png");
    expect(originalImage)
      .to.be.a.file()
      .and.equal(downloadedImage);
  });
});
