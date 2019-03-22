/// <reference types="node" />
///

import * as _Promise from "bluebird";
import * as fs from "fs-extra";
import { auth, JWT } from "google-auth-library";
import { google } from "googleapis";
import * as _ from "lodash";
import * as xlsx from "node-xlsx";
import * as path from "path";
import { IVoxaSheet, SheetTypes } from "./VoxaSheet";

async function transformGoogleSheets(options: any, authKeys: {}): Promise<IVoxaSheet[]> {
  const client = auth.fromJSON(authKeys) as JWT;
  client.scopes = ["https://www.googleapis.com/auth/spreadsheets.readonly"];
  const sheets = google.sheets("v4");
  const readSpreadsheet: any = _Promise.promisify(sheets.spreadsheets.get, { context: sheets });
  const readSheetTab: any = _Promise.promisify(sheets.spreadsheets.values.get, { context: sheets });
  const spreadsheetsId = _.chain(options)
    .get("spreadsheets")
    .map(getSpreadsheetId)
    .compact()
    .value() as string[];

  let spreadsheetResp = [] as any[];

  if (_.isEmpty(spreadsheetsId)) {
    return [];
  }

  try {
    spreadsheetResp = await _Promise.all(
      spreadsheetsId.map((spreadsheetId: string) =>
        readSpreadsheet({ auth: client, spreadsheetId })
      )
    );
    // tslint:disable-next-line: no-empty
  } catch (e) {
    throw new Error(`Unable to read spreadsheets. Make sure user has access. ${e}`);
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
    .map(findSheetType)
    .compact()
    .value();
  let sheetPromises = spreadsheetResp.map((sheet: IVoxaSheet) =>
    readSheetTab({
      auth: client,
      spreadsheetId: sheet.spreadsheetId,
      range: `${sheet.sheetTitle}!A1:ZZZ`
    })
  );

  try {
    sheetPromises = await _Promise.all(sheetPromises);
  } catch (e) {
    throw new Error(`Unable to get spreadsheet ${e}`);
  }

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
}

export async function transformLocalExcel(options: any, authKeys: {}): Promise<IVoxaSheet[]> {
  const findFiles = (spreadsheet: string): string[] => {
    const fsStats = fs.lstatSync(spreadsheet);
    if (fsStats.isDirectory()) {
      return fs
        .readdirSync(spreadsheet)
        .filter(f => _.includes(f, "xlsx"))
        .map(f => path.join(spreadsheet, f));
    }
    return [spreadsheet];
  };

  const readFileCreateWorkbook = (f: string) => {
    const workbook = xlsx.parse(f);
    const spreadsheetTitle = _.last(f.split("/"));
    const spreadsheetId = f;
    if (!_.isString(spreadsheetTitle)) {
      return undefined;
    }
    return workbook.map(book => ({
      spreadsheetId,
      spreadsheetTitle,
      sheetTitle: book.name,
      type: "none",
      data: book.data
    }));
  };

  const refactorExcelData = (sheet: IVoxaSheet) => {
    sheet.data = _.chain(sheet)
      .get("data")
      .map((next, index: number, arr) => {
        if (index === 0) {
          return next;
        }
        const head = arr[0];

        const extraColumns = head.length - next.length;
        if (extraColumns > 0) {
          next = _.concat(next, _.fill(Array(extraColumns), undefined));
        }
        return next;
      })
      .reduce(rowFormatted, [] as any[])
      .drop()
      .value();
    return sheet;
  };

  const vsheet = (_.chain(options)
    .get("spreadsheets")
    .map(f => (f.indexOf("/") === 0 ? f : path.join(options.rootPath, f)))
    .filter(spreadsheet => fs.pathExistsSync(spreadsheet))
    .map(findFiles)
    .flatten()
    .map(readFileCreateWorkbook)
    .flatten()
    .compact()
    .map(findSheetType)
    .filter((sheet: IVoxaSheet) => _.get(sheet, "type") !== "none" && !_.isEmpty(sheet))
    .map(refactorExcelData)

    .value() as unknown) as IVoxaSheet[];

  return vsheet;
}

export async function transform(options: any, authKeys: {}): Promise<IVoxaSheet[]> {
  const googleSheet = await transformGoogleSheets(options, authKeys);
  const excelSheet = await transformLocalExcel(options, authKeys);

  const transformedSpreadsheet: IVoxaSheet[] = _.concat(googleSheet, excelSheet);

  if (_.isEmpty(transformedSpreadsheet)) {
    throw new Error("There are no spreadsheets to use");
  }

  return transformedSpreadsheet;
}

function findSheetType(spreadsheet: IVoxaSheet): IVoxaSheet | undefined {
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

function getSpreadsheetId(sheet: string): string | undefined {
  const matched = sheet.match(/docs\.google\.com\/spreadsheets\/d\/(.*)\/.*/);
  return sheet.includes("docs.google.com/spreadsheets") && matched && _.isString(matched[1])
    ? matched[1]
    : undefined;
}
