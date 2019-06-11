const { DynamoDB } = require("aws-sdk");
const _ = require("lodash");
const config = require("../config");

const client = new DynamoDB.DocumentClient();

class User {

  static async get(voxaEvent) {
    const key = { userId: voxaEvent.user.userId };

    const item = await client
      .get({ Key: key, TableName: config.dynamoDB.tables.users })
      .promise();

    return new User(item.Item);
  }

  constructor(data) {
    const defaults = {
      sessionCount: 0,
    };
    this.data = { ...defaults, ...data };
  }

  newSession() {
    this.data.sessionCount = this.data.sessionCount + 1;
  }

  get isFirstTime() {
    return this.data.sessionCount === 1;
  }

  get sessionCount() {
    return this.data.sessionCount;
  }

  toJSON() {
    return this.data;
  }

  save(key) {
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

module.exports = User;
