import fs = require("fs-extra");
import path = require("path");
import { action } from "../src/commands/interaction";

before(async function before() {
  this.timeout(20000);
  await fs.remove(path.join(__dirname, "out"));
  await action({ path: __dirname });
});
