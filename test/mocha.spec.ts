import { action } from "../src/commands/interaction";

before(async function before() {
  this.timeout(20000);
  await action({ path: __dirname });
});
