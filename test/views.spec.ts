import { expect } from "chai";

describe("Views", () => {
  let views: any;
  before(async () => {
    views = await require("./out/views.json");
  });

  it("should generate an en-US Launch.say", () => {
    expect(views["en-US"].translation.Launch).to.deep.equal({
      say: ["Hello World!"]
    });
  });
});
