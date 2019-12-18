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
import _ from "lodash";
import { IVoxaSheet } from "../VoxaSheet";
import { buildFromLocalExcel } from "./Excel";
import { buildFromGoogleSheets } from "./Google";
import { buildFromOffice365 } from "./Office365";

export async function transform(
  options: any,
  authKeys: {},
  spreadsheetKey: string = "spreadsheets"
): Promise<IVoxaSheet[]> {
  const googleSheet = await buildFromGoogleSheets(options, authKeys, spreadsheetKey);
  const excelSheet = await buildFromLocalExcel(options, spreadsheetKey);
  const office365Sheet = await buildFromOffice365(options, spreadsheetKey);

  const transformedSpreadsheet: IVoxaSheet[] = _.concat(googleSheet, excelSheet, office365Sheet);

  return transformedSpreadsheet;
}
