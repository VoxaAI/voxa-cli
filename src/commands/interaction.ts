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
  const interactionFileName = "interaction.json";
  const rootPath = cmd.path || process.cwd();
  const interationPath = path.join(rootPath, interactionFileName);
  const authFileName = "client_secret.json";
  const authPath = path.join(rootPath, authFileName);

  let interaction = {} as any;
  let auth = {} as any;
  try {
    interaction = require(interationPath);
  } catch (e) {
    const sampleInteraction = {
      spreadsheets: ["INTENT SPREADSHEET", "PUBLISHING SPREADSHEET"]
    };
    const sampleInteractionStr = JSON.stringify(sampleInteraction, null, 2);

    if (e.code === "MODULE_NOT_FOUND") {
      console.log(`mm... It seems you don\'t have a ${interationPath}. Let me create it for you`);
      return fs.outputFileSync(interationPath, sampleInteractionStr, { flag: "w" });
    }
  }

  try {
    // a path we KNOW is totally bogus and not a module
    auth = require(authPath);
  } catch (e) {
    if (e.code === "MODULE_NOT_FOUND") {
      console.log(`mm... Make sure to create ${authFileName} from Google console`);
      return;
    }
  }

  interaction.rootPath = rootPath;
  await buildInteraction(interaction, auth);
}
