import { VoxaApp } from "voxa";

import { register as mainStates } from "./main.states";

export function register(voxaApp: VoxaApp) {
  mainStates(voxaApp);
}
