/*
 * Copyright (c) 2018 Rain Agency <contact@rain.agency>
 * Author: Rain Agency <contact@rain.agency>
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 * the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
 * FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 * COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
 * IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

import fs from "fs";
import _ from "lodash";

let googleSecret: any;
let officeSecret: any;
try {
  // tslint:disable-next-line: no-var-requires
  googleSecret = require("./client_secret.json");
} catch (e) {
  // tslint:disable-next-line: no-console
  console.log("No client secret for google");
}

try {
  // tslint:disable-next-line: no-var-requires
  officeSecret = require("./azure_secret.json");
} catch (e) {
  // tslint:disable-next-line: no-console
  console.log("No client secret for azure");
}

type interactionNames =
  | "Google"
  | "Excel"
  | "OpenDocument-FODS"
  | "OpenDocument-ODS"
  | "platform-specific"
  | "Excel-No-Dialog";

function loadInteraction(name: interactionNames) {
  try {
    const interactionFileName = `${__dirname}/interaction-files/interaction-${name.toLowerCase()}.json`;
    const interaction = JSON.parse(fs.readFileSync(interactionFileName).toString());
    return { ...interaction, interactionFileName, name };
  } catch {
    return { name, skip: true };
  }
}

export function configurationToExecute() {
  const excelInteraction = loadInteraction("Excel");
  const openDocumentFODSInteraction = loadInteraction("OpenDocument-FODS");
  const openDocumentODSInteraction = loadInteraction("OpenDocument-ODS");
  const googleInteraction = loadInteraction("Google");
  const platformSpecificInteraction = loadInteraction("platform-specific");
  const excelNoDialogInteraction = loadInteraction("Excel-No-Dialog");

  if (_.isEmpty(googleSecret)) {
    googleInteraction.skip = true;
  }

  return [
    googleInteraction,
    excelInteraction,
    openDocumentFODSInteraction,
    openDocumentODSInteraction,
    platformSpecificInteraction,
    excelNoDialogInteraction
  ];
}
