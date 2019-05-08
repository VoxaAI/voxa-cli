function register(voxaApp) {
  voxaApp.onIntent("LaunchIntent", {
    flow: "terminate",
    reply: "Launch.StartResponse",
  });
}

module.exports = register;
