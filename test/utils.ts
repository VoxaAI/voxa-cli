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

function loadInteraction(interactionFileName: string) {
  const interaction = require(`./${interactionFileName}`);
  return { ...interaction, interactionFileName };
}
export function configurationToExecute() {
  const interactions = [{ ...loadInteraction("interaction-excel.json"), ...{ name: "Excel" } }];

  if (!_.isEmpty(googleSecret)) {
    interactions.push({ ...loadInteraction("interaction-google.json"), ...{ name: "Google" } });
  } else {
    interactions.push({ name: "Google", skip: true });
  }

  return interactions;
}
