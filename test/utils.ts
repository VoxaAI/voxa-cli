import fs = require("fs-extra");
import path = require("path");

export function hasAGoogleServiceAccount() {
  return fs.pathExists(path.join(__dirname, "client_secret.json"));
}
