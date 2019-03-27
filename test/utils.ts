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

type interactionNames = "Google" | "Excel" | "OpenDocument";

async function loadInteraction(name: interactionNames) {
  try {
    const interactionFileName = `interaction-${name.toLowerCase()}.json`;
    const interaction = await require(`./${interactionFileName}`);
    return { ...interaction, interactionFileName, name };
  } catch {
    return { name, skip: true };
  }
}

export async function configurationToExecute() {
  const excelInteraction = await loadInteraction("Excel");
  const openDocumentInteraction = await loadInteraction("OpenDocument");
  const googleInteraction = await loadInteraction("Google");
  if (_.isEmpty(googleSecret)) {
    googleInteraction.skip = true;
  }
  return [googleInteraction, excelInteraction, openDocumentInteraction];
}
