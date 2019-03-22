import fs = require("fs-extra");
import path = require("path");
import { action } from "../src/commands/interaction";
import { hasAGoogleServiceAccount } from "./utils";

before(async function before() {
  this.timeout(20000);

  // make sure we delete the old assets
  await fs.remove(path.join(__dirname, "out"));

  // create an empty file just to make sure the download process overwrites it
  const imagePath = path.join(__dirname, "out/assets/images/large.png");
  await fs.mkdirp(path.dirname(imagePath));
  const file = await fs.open(imagePath, "w");
  await fs.close(file);

  // copy the other file to it's final destination, this makes it so we exercise the code path
  // were we don't download again a file if it's already present
  const original = path.join(__dirname, "assets/images/small.png");
  const destination = path.join(__dirname, "out/assets/images/small.png");
  await fs.copy(original, destination);

  // run the actual command

  const interactionToLoad = (await hasAGoogleServiceAccount())
    ? "interaction.json"
    : "interaction-no-secret.json";
  await action({ path: __dirname, interactionFileName: interactionToLoad });
});
