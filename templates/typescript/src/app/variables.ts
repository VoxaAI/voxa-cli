import { IVoxaEvent } from "voxa";

export function name(voxaEvent: IVoxaEvent) {
  return voxaEvent.model.name;
}
