import { VoxaApp } from "voxa";

export function register(voxaApp: VoxaApp) {
  voxaApp.onIntent("LaunchIntent", {
    flow: "terminate",
    reply: "Launch.StartResponse",
  });
}
