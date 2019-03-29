import * as _Promise from "bluebird";
import * as _ from "lodash";
import { IVoxaSheet } from "../VoxaSheet";
import { buildFromLocalExcel } from "./Excel";
import { buildFromGoogleSheets } from "./Google";
import { buildFromOffice365 } from "./Office365";

export async function transform(options: any, authKeys: {}): Promise<IVoxaSheet[]> {
  const googleSheet = await buildFromGoogleSheets(options, authKeys);
  const excelSheet = await buildFromLocalExcel(options);
  const office365Sheet = await buildFromOffice365(options);

  const transformedSpreadsheet: IVoxaSheet[] = _.concat(googleSheet, excelSheet, office365Sheet);

  if (_.isEmpty(transformedSpreadsheet)) {
    throw new Error(
      "There are no spreadsheets to use. Make sure to copy/paste a spreadsheet URL, office 365 sharepoint url, a or local .xlsx, .ods or .fods"
    );
  }

  return transformedSpreadsheet;
}
