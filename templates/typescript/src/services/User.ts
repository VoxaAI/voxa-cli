import { DynamoDB } from "aws-sdk";
import * as _ from "lodash";
import { IVoxaEvent } from "voxa";
import * as config from "../config";

export interface IUserData {
  userId: string;
  sessionCount: number;
}

const client = new DynamoDB.DocumentClient();

export class User {

  public static async get(voxaEvent: IVoxaEvent): Promise<User> {
    const key = { userId: voxaEvent.user.userId };

    const item = await client
      .get({ Key: key, TableName: config.dynamoDB.tables.users })
      .promise();

    return new User(item.Item);
  }

  public data: IUserData;

  private defaults = {
    sessionCount: 0,
  };

  constructor(data: any) {
    this.data = { ...this.defaults, ...data };
  }

  public newSession() {
    this.data.sessionCount = this.data.sessionCount + 1;
  }

  public get isFirstTime(): boolean {
    return this.data.sessionCount === 1;
  }

  public get sessionCount(): number {
    return this.data.sessionCount;
  }

  public toJSON(): IUserData {
    return this.data;
  }

  public save(key: any) {
    const data = _.toPlainObject({ ...this.data, ...key });

    if (!data.createdDate) {
      data.createdDate = new Date().toISOString();
    }

    data.modifiedDate = new Date().toISOString();
    return client
      .put({
        Item: data,
        TableName: config.dynamoDB.tables.users
      })
      .promise();
  }
}
