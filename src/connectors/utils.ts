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
  const item = _.chain(arr)
    .head()
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
