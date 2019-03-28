/// <reference types="node" />
///

import * as _Promise from "bluebird";
import * as fs from "fs-extra";
import * as _ from "lodash";
import * as xlsx from "node-xlsx";
import * as path from "path";
import { IVoxaSheet } from "../VoxaSheet";
import { findSheetType, rowFormatted } from "./utils";

function findLocalFiles(spreadsheet: string): string[] {
  const fsStats = fs.lstatSync(spreadsheet);
  if (fsStats.isDirectory()) {
    return fs
      .readdirSync(spreadsheet)
      .filter(f => _.endsWith(f, ".xlsx") || _.endsWith(f, ".ods") || _.endsWith(f, ".fods"))
      .map(f => path.join(spreadsheet, f));
  }
  return [spreadsheet];
}

function readFileCreateWorkbook(f: string) {
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
    data: processBookData(book.data)
  }));
}

function refactorExcelData(sheet: IVoxaSheet) {
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
}

export async function buildFromLocalExcel(options: any): Promise<IVoxaSheet[]> {
  const vsheet = (_.chain(options)
    .get("spreadsheets")
    .map(f => (f.indexOf("/") === 0 ? f : path.join(options.rootPath, f)))
    .filter(spreadsheet => fs.pathExistsSync(spreadsheet))
    .map(findLocalFiles)
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

function processBookData(data: string[][]) {
  // this is all because of a bug in node-xlsx where the first cell of the first tab get's a lot
  // of garbage appended to it's content
  const titleRow = data[0];
  const firstColumnTitle = titleRow[0];
  const split = firstColumnTitle.split("\n");
  if (split.length > 1) {
    titleRow[0] = split[split.length - 1];
  }

  return data;
}
