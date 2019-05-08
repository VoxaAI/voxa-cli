const _ = require("lodash");

class Model {
  static deserialize(data, voxaEvent) {
    return new this(data);
  }

  name = "World";

  constructor(data = {}) {
    _.assign(this, data);
  }

  serialize() {
    return this;
  }
}

module.exports = Model;
