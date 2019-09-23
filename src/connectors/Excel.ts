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
import fs from "fs-extra";
import _ from "lodash";
import xlsx from "node-xlsx";
import path from "path";
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
  const spreadsheetTitle = _.last(f.split("/")) as string;
  const spreadsheetId = f;
  if (!_.isString(spreadsheetTitle)) {
    return undefined;
  }
  return workbook.map(book => ({
    spreadsheetId,
    spreadsheetTitle,
    sheetTitle: book.name,
    type: "none",
    data: processBookData(book.data).filter(row => row.length)
  }));
}

function refactorExcelData(sheet: IVoxaSheet) {
  sheet.data = (_.chain(sheet).get("data") as any)
    .map((next: any, index: number, arr: any) => {
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

export async function buildFromLocalExcel(
  options: any,
  spreadsheetKey: string
): Promise<IVoxaSheet[]> {
  const vsheet = ((_.chain(options).get(spreadsheetKey) as any)
    .map((f: string) => (f.indexOf("/") === 0 ? f : path.join(options.rootPath, f)))
    .filter((spreadsheet: string) => fs.pathExistsSync(spreadsheet))
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
  const titleRow = _.get(data, "[0]", "");
  const firstColumnTitle = _.get(titleRow, "[0]", "");
  const split = firstColumnTitle.split("\n");
  if (split.length > 1) {
    titleRow[0] = split[split.length - 1];
  }

  return data;
}
