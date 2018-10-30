/// <reference types="node" />
///

import * as _ from 'lodash';
import * as _Promise from 'bluebird';
import { google } from 'googleapis';
import { JWT, auth } from 'google-auth-library';
import { VoxaSheet, SheetTypes  } from './VoxaSheet';

export async function transform (options: any, authKeys: {}): Promise<VoxaSheet[]> {
  const client = auth.fromJSON((authKeys)) as JWT;
  client.scopes = ['https://www.googleapis.com/auth/spreadsheets.readonly'];
  const sheets = google.sheets('v4');
  const readSpreadsheet: any = _Promise.promisify(sheets.spreadsheets.get, { context: sheets });
  const readSheetTab: any = _Promise.promisify(sheets.spreadsheets.values.get, { context: sheets });
  const spreadsheetsId = options.spreadsheets as string[];

  let spreadsheetResp = await _Promise.all(spreadsheetsId
    .map((spreadsheetId: string) => readSpreadsheet({ auth: client, spreadsheetId })));

  spreadsheetResp = _.chain(spreadsheetResp)
  .map((spreadsheet: string, index: number) => {
    const spreadsheetTitle = _.get(spreadsheet, 'data.properties.title');
    const spreadsheetId = spreadsheetsId[index];
    const sheets = _.chain(spreadsheet)
      .get('data.sheets', [])
      .map('properties.title')
      .value();

    return sheets.map((sheetTitle: string) => ({ spreadsheetId, spreadsheetTitle, sheetTitle } as VoxaSheet));
  })
  .flatten()
  .map((spreadsheet: VoxaSheet) => {
    let processorFound = _.chain(SheetTypes).invert().find((key: string, value: string) => {
      return spreadsheet.sheetTitle.indexOf(value) >= 0;
    }).value() as string;
    spreadsheet.type = processorFound;
    if (processorFound) return spreadsheet;

    return undefined;
  })
  .compact()
  .value();
  let sheetPromises = spreadsheetResp.map((sheet: VoxaSheet) => readSheetTab({
    auth: client,
    spreadsheetId: sheet.spreadsheetId,
    range: `${sheet.sheetTitle}!A1:ZZZ`,
  }));

  sheetPromises = await _Promise.all(sheetPromises);

  return spreadsheetResp.map((sheet: VoxaSheet, index: number) => {
    const data = _.chain(sheetPromises[index])
    .get('data.values', [])
    .reduce(rowFormatted, [])
    .drop()
    .value();

    // Apply processor
    sheet.data = data;
    return sheet;
  });
  // global.console.log('spreadsheetResp', JSON.stringify(spreadsheetResp, null, 2));
}

function rowFormatted(acc: any[], next: any, _index: number, arr: any[]) {
  const item = _.chain(arr)
  .head()
  .zip(next)
  .map((zipObj: any) => {
    const key = zipObj[0];
    let val = zipObj[1];
    const valTemp = _.toLower(val);

    if (_.includes(['true', 'yes'], valTemp)) {
      val = true;
    }

    if (_.includes(['false', 'no'], valTemp)) {
      val = false;
    }

    if ( typeof valTemp === 'string' && valTemp.length === 0) {
      val = undefined;
    }

    return [key, val];
  })
  .fromPairs()
  .value();

  acc.push(item);
  return acc;
}
