import * as axios from "axios";
import { all } from "bluebird";
import * as fs from "fs-extra";
import * as _ from "lodash";
import * as path from "path";
import * as qs from "qs";
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

export async function buildFromOffice365(options: any) {
  const officeSharedIds = _.chain(options)
    .get("spreadsheets")
    .filter(sheet => sheet.includes(".sharepoint.com"))
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
  return createExcelFile(officeSharedIds, accessToken, options);
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

  const axiosOptions: axios.AxiosRequestConfig = {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    data: qs.stringify(data),
    url: `https://login.microsoftonline.com/${tenant_directory}/oauth2/token`
  };

  let accessToken: string | undefined;
  try {
    const resp = await axios.default.request(axiosOptions);
    accessToken = _.get(resp, "data.access_token");
  } catch (error) {
    throw error;
  }

  return accessToken;
}

async function createExcelFile(officeSharedIds: string[], accessToken: string, options: any) {
  const headers = {
    Authorization: `Bearer ${accessToken}`
  };

  const metadataPromises = _.chain(officeSharedIds)
    .map(sharedId => [
      axios.default.request({
        headers,
        url: `https://graph.microsoft.com/v1.0/shares/${sharedId}/driveitem`
      }),
      axios.default.request({
        responseType: "arraybuffer",
        headers,
        url: `https://graph.microsoft.com/v1.0/shares/${sharedId}/driveitem/content`
      })
    ])
    .flatten()
    .value();

  const files: any = await all(metadataPromises);
  await all(
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

  const spreadsheets = _.get(options, "spreadsheets");
  spreadsheets.push(OFFICE_PATH);

  return buildFromLocalExcel({ ...options, spreadsheets });
}
