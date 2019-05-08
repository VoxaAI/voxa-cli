const _ = require("lodash");

class Model {
  constructor(data = {}) {
    this.name = "World";
    _.assign(this, data);
  }

  static deserialize(data) {
    return new this(data);
  }

  serialize() {
    return this;
  }
}

module.exports = Model;
