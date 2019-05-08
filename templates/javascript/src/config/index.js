"use strict";

const path = require("path");
const env = process.env.NODE_ENV || "local";

const configFile = require(path.join(__dirname, `${env}.json`));
configFile.env = env;

module.exports = configFile;
module.exports.asFunction = () => configFile;
