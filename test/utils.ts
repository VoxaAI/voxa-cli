import fs = require("fs-extra");
import * as _ from "lodash";
import path = require("path");

let googleSecret: any;
try {
  // tslint:disable-next-line: no-var-requires
  googleSecret = require("./client_secret.json");
} catch (e) {
  // tslint:disable-next-line: no-console
  console.log("No client secret for google");
}

type interactionNames = "Google" | "Excel";

function loadInteraction(name: interactionNames) {
  try {
    const interactionFileName = `interaction-${name.toLowerCase()}.json`;
    const interaction = require(`./${interactionFileName}`);
    return { ...interaction, interactionFileName, name };
  } catch {
    return { name, skip: true };
  }
}

export function configurationToExecute() {
  return [loadInteraction("Excel"), loadInteraction("Google")];
}
