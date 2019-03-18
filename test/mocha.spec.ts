import fs = require("fs-extra");
import path = require("path");
import { action } from "../src/commands/interaction";

before(async function before() {
  this.timeout(20000);

  // make sure we delete the old assets
  await fs.remove(path.join(__dirname, "out"));

  // create an empty file just to make sure the download process overwrites it
  const imagePath = path.join(__dirname, "out/assets/images/large.png");
  await fs.mkdirp(path.dirname(imagePath));
  const file = await fs.open(imagePath, "w");
  await fs.close(file);

  // run the actual command
  await action({ path: __dirname });
});
