const mainStates = require("./main.states").register;

function register(voxaApp) {
  mainStates(voxaApp);
}

module.exports = { register };
