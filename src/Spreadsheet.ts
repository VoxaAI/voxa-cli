/// <reference types="node" />
///

import * as _Promise from "bluebird";
import { auth, JWT } from "google-auth-library";
import { google } from "googleapis";
import * as _ from "lodash";
import { IVoxaSheet, SheetTypes } from "./VoxaSheet";

export async function transform(options: any, authKeys: {}): Promise<IVoxaSheet[]> {
  const client = auth.fromJSON(authKeys) as JWT;
  client.scopes = ["https://www.googleapis.com/auth/spreadsheets.readonly"];
  const sheets = google.sheets("v4");
  const readSpreadsheet: any = _Promise.promisify(sheets.spreadsheets.get, { context: sheets });
  const readSheetTab: any = _Promise.promisify(sheets.spreadsheets.values.get, { context: sheets });
  const spreadsheetsId = options.spreadsheets as string[];

  // TODO: error on getting spreadsheet
  let spreadsheetResp = [] as any[];

  try {
    spreadsheetResp = await _Promise.all(
      spreadsheetsId.map((spreadsheetId: string) =>
        readSpreadsheet({ auth: client, spreadsheetId })
      )
    );
  } catch (e) {
    throw Error("User doesn't have access to the spreadsheet");
  }

  spreadsheetResp = _.chain(spreadsheetResp)
    .map((spreadsheet: string, index: number) => {
      const spreadsheetTitle = _.get(spreadsheet, "data.properties.title");
      const spreadsheetId = spreadsheetsId[index];
      const sheetNames = _.chain(spreadsheet)
        .get("data.sheets", [])
        .map("properties.title")
        .value();
      return sheetNames.map((sheetTitle: string) => {
        const voxaSheet: IVoxaSheet = { spreadsheetId, spreadsheetTitle, sheetTitle, type: "none" };
        return voxaSheet;
      });
    })
    .flatten()
    .map((spreadsheet: IVoxaSheet) => {
      const processorFound = _.chain(SheetTypes)
        .invert()
        .find((key: string, value: string) => {
          return spreadsheet.sheetTitle.indexOf(value) >= 0;
        })
        .value() as string;
      spreadsheet.type = processorFound;
      if (processorFound) {
        return spreadsheet;
      }

      return undefined;
    })
    .compact()
    .value();
  let sheetPromises = spreadsheetResp.map((sheet: IVoxaSheet) =>
    readSheetTab({
      auth: client,
      spreadsheetId: sheet.spreadsheetId,
      range: `${sheet.sheetTitle}!A1:ZZZ`
    })
  );

  sheetPromises = await _Promise.all(sheetPromises);

  return spreadsheetResp.map((sheet: IVoxaSheet, index: number) => {
    const data = _.chain(sheetPromises[index])
      .get("data.values", [])
      .reduce(rowFormatted, [])
      .drop()
      .value();

    // Apply processor
    sheet.data = data;
    return sheet;
  });
  // global.console.log('spreadsheetResp', JSON.stringify(spreadsheetResp, null, 2));
}

function rowFormatted(acc: any[], next: any, iindex: number, arr: any[]) {
  const item = _.chain(arr)
    .head()
    .zip(next)
    .map((zipObj: any) => {
      const key = zipObj[0];
      let val = zipObj[1];
      const valTemp = _.toLower(val);

      if (_.includes(["true", "yes"], valTemp)) {
        val = true;
      }

      if (_.includes(["false", "no"], valTemp)) {
        val = false;
      }

      if (typeof valTemp === "string" && valTemp.length === 0) {
        val = undefined;
      }

      return [key, val];
    })
    .fromPairs()
    .value();

  acc.push(item);
  return acc;
}
