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
import axios from "axios";
// tslint:disable-next-line
import { AxiosRequestConfig, AxiosPromise } from "axios";

import fs from "fs-extra";
import _ from "lodash";
import path from "path";
import qs from "qs";
import { IFileContent } from "../Schema";
import { buildFromLocalExcel } from "./Excel";

declare interface IAzureSecret {
  client_secret?: string;
  client_id?: string;
  username?: string;
  password?: string;
  tenant_directory?: string;
}

const OFFICE_PATH = ".voxa/office";

export async function buildFromOffice365(options: any, spreadsheetKey: string) {
  const officeSharedIds = (_.chain(options).get(spreadsheetKey) as any)
    .filter((sheet: string) => sheet.includes(".sharepoint.com"))
    .map(getOfficeShareId)
    .compact()
    .value() as string[];

  let auth: IAzureSecret = {};
  const authPath = path.join(options.rootPath, "azure_secret.json");

  try {
    auth = require(authPath);
    // tslint:disable-next-line: no-empty
  } catch (e) {}

  if (_.isEmpty(auth) || _.isEmpty(officeSharedIds)) {
    return [];
  }

  const accessToken = await getAccessToken(auth);
  if (!_.isString(accessToken)) {
    return [];
  }

  await fs.remove(path.join(options.rootPath, OFFICE_PATH));
  return downloadExcelFiles(officeSharedIds, accessToken, options, spreadsheetKey);
}

function getOfficeShareId(sheet: string): string {
  // how to encode shareId URL
  // https://docs.microsoft.com/en-us/graph/api/shares-get?view=graph-rest-1.0#encoding-sharing-urls
  const base64 = _.trimEnd(Buffer.from(sheet).toString("base64"), "=");
  const sharedId = `u!${base64.replace("/", "_").replace("+", "-")}`;
  return sharedId;
}

async function getAccessToken(auth: IAzureSecret) {
  const { client_secret, client_id, tenant_directory } = auth;

  const data: any = {
    client_id,
    client_secret,
    grant_type: "client_credentials",
    resource: "https://graph.microsoft.com"
  };

  const axiosOptions: AxiosRequestConfig = {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    data: qs.stringify(data),
    url: `https://login.microsoftonline.com/${tenant_directory}/oauth2/token`
  };

  let accessToken: string | undefined;
  try {
    const resp = await axios.request(axiosOptions);
    accessToken = _.get(resp, "data.access_token");
  } catch (error) {
    throw error;
  }

  return accessToken;
}

async function downloadExcelFiles(
  officeSharedIds: string[],
  accessToken: string,
  options: any,
  spreadsheetKey: string
) {
  const headers = {
    Authorization: `Bearer ${accessToken}`
  };

  const metadataPromises = _.chain(officeSharedIds)
    .map(sharedId => [
      axios.request({
        headers,
        url: `https://graph.microsoft.com/v1.0/shares/${sharedId}/driveitem`
      }),
      axios.request({
        responseType: "arraybuffer",
        headers,
        url: `https://graph.microsoft.com/v1.0/shares/${sharedId}/driveitem/content`
      })
    ])
    .flatten()
    .value();

  await outputExcelFiles(options, metadataPromises);

  const spreadsheets = _.get(options, spreadsheetKey);
  spreadsheets.push(OFFICE_PATH);

  return buildFromLocalExcel({ ...options, spreadsheets }, spreadsheetKey);
}

async function outputExcelFiles(options: any, metadataPromises: Array<AxiosPromise<any>>) {
  const files: any = await Promise.all(metadataPromises);
  await Promise.all(
    _.chain(files)
      .chunk(2)
      .map(item => {
        const name = _.get(item[0], "data.name") as string;
        const content = _.get(item[1], "data") as string;

        const file: IFileContent = {
          content,
          path: path.join(options.rootPath, OFFICE_PATH, name)
        };

        return fs.outputFile(file.path, file.content, { flag: "w" });
      })
      .value()
  );
}
