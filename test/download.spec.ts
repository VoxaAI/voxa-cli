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

import { expect, use } from "chai";
import Chaifs from "chai-fs";
import path from "path";
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
