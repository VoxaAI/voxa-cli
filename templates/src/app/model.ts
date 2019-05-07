import * as _ from "lodash";

export default class Model {
  public static deserialize(data: any, voxaEvent: any): Promise<Model> | Model {
    return new this(data);
  }

  public name: string = "World";

  constructor(data: any = {}) {
    _.assign(this, data);
  }

  public serialize(): any | Promise<any> {
    return this;
  }
}
