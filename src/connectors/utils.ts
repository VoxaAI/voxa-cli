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
import * as _Promise from "bluebird";

import * as _ from "lodash";
import { IVoxaSheet, SheetTypes } from "../VoxaSheet";

export function findSheetType(spreadsheet: IVoxaSheet): IVoxaSheet | undefined {
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

export function rowFormatted(acc: any[], next: any, iindex: number, arr: any[]) {
  const item = (_.chain(arr).head() as any)
    .zip(next)
    .map((zipObj: any) => [zipObj[0], valueFormatted(zipObj[1])])
    .fromPairs()
    .value();

  acc.push(item);
  return acc;
}

function valueFormatted(val: any) {
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

  return val;
}
