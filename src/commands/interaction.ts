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
/* tslint:disable:no-submodule-imports no-console */
"use strict";

import * as fs from "fs-extra";
import * as path from "path";
import { buildInteraction } from "../InteractionBuilder";

export const name = "interaction";
export const alias = "";
export const description = "create a interaction.json";
export const options = [{ flags: "-p, --path <path>", description: "overwrite root path" }];

export async function action(cmd: any) {
  const rootPath = cmd.path || process.cwd();
  const interactionFileName = cmd.interactionFileName || "interaction.json";
  const interactionPath = path.isAbsolute(interactionFileName)
    ? interactionFileName
    : path.join(rootPath, interactionFileName);

  let interaction = {} as any;
  try {
    interaction = await fs.readJSON(interactionPath);
  } catch (e) {
    const sampleInteraction = {
      spreadsheets: ["INTENT SPREADSHEET", "PUBLISHING SPREADSHEET"]
    };
    const sampleInteractionStr = JSON.stringify(sampleInteraction, null, 2);

    if (e.code === "MODULE_NOT_FOUND") {
      console.log(`mm... It seems you don\'t have a ${interactionPath}. Let me create it for you`);
      return fs.outputFileSync(interactionPath, sampleInteractionStr, { flag: "w" });
    }
  }

  interaction.rootPath = path.dirname(interactionFileName);
  await buildInteraction(interaction, getAuth(rootPath));
}

function getAuth(rootPath: string) {
  const authFileName = "client_secret.json";
  const authPath = path.join(rootPath, authFileName);
  let auth = {} as any;
  try {
    // a path we KNOW is totally bogus and not a module
    auth = require(authPath);
  } catch (e) {
    // if (e.code === "MODULE_NOT_FOUND") {
    //   console.log(`mm... Make sure to create ${authFileName} from Google console`);
    //   return;
    // }
  }
}
