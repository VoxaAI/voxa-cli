import * as bluebird from "bluebird";
import crypto = require("crypto");
import fs = require("fs-extra");
import { auth, JWT } from "google-auth-library";
import { drive_v3, google } from "googleapis";
import * as path from "path";

export async function downloadDirs(dirs: string[], assetsRoot: string, key: any) {
  const jwtClient = new google.auth.JWT(
    key.client_email,
    undefined,
    key.private_key,
    [
      "https://www.googleapis.com/auth/drive.metadata.readonly",
      "https://www.googleapis.com/auth/drive"
    ],
    key.email
  );

  const drive = google.drive({ version: "v3", auth: jwtClient });

  for (const dir of dirs) {
    const reply = await resInFolder(drive, dir);
    const files = reply.data.files;
    if (files) {
      await bluebird.map(files, file => downloadFile(drive, file, assetsRoot));
    }
  }
}

async function downloadFile(
  driveService: drive_v3.Drive,
  fileResource: drive_v3.Schema$File,
  rootPath: string
) {
  if (fileResource.mimeType !== "application/vnd.google-apps.folder") {
    // tslint:disable-next-line
    const getOptions = {
      fileId: fileResource.id,
      alt: "media"
    } as drive_v3.Params$Resource$Files$Get;
    const destPath = path.join(rootPath, fileResource.name as string);

    let md5 = "";
    if (fs.pathExistsSync(destPath)) {
      md5 = await fileMd5(destPath);
    }

    if (md5 === fileResource.md5Checksum) {
      return;
    }

    const writer = fs.createWriteStream(destPath);
    const result = (await driveService.files.get(getOptions, { responseType: "stream" })) as any;

    result.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on("finish", resolve);
      writer.on("error", reject);
    });
  } else {
    const newRoot = path.join(rootPath, fileResource.name as string);
    await fs.mkdirp(newRoot);

    const reply = await resInFolder(driveService, fileResource.id as string);
    const files = reply.data.files;
    if (files) {
      await bluebird.map(files, file => downloadFile(driveService, file, newRoot));
    }
  }
}

async function resInFolder(driveService: drive_v3.Drive, folderId: string) {
  // tslint:disable-next-line
  const listOptions = {
    q: `'${folderId}' in parents`,
    fields: "files(md5Checksum, name, mimeType, id)"
  } as drive_v3.Params$Resource$Files$List;
  const fileList = await driveService.files.list(listOptions);

  return fileList;
}

export async function fileMd5(filepath: string): Promise<string> {
  const fd = fs.createReadStream(filepath);
  const hash = crypto.createHash("md5");
  hash.setEncoding("hex");

  // read all file and pipe it (write it) to the hash object
  fd.pipe(hash);

  return new Promise<string>((resolve, reject) => {
    hash.on("finish", () => {
      resolve(hash.read() as string);
    });
    hash.on("error", reject);
  });
}
