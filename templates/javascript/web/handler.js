const serverless = require("serverless-http");
const { expressApp } = require("../server");

exports.expressHandler = serverless(expressApp);
