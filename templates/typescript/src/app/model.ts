import * as _ from "lodash";
{{#if saveUserInfo}}
import { User } from "../services/User";
{{/if}}

export default class Model {
  public static deserialize(data: any, voxaEvent: any): Promise<Model> | Model {
    return new this(data);
  }

  public name: string = "World";
  {{#if saveUserInfo}}
  public user: User;
  {{/if}}

  constructor(data: any = {}) {
    _.assign(this, data);
  }

  public serialize(): any | Promise<any> {
    return this;
  }
}
