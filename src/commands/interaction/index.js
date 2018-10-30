'use strict';

const fs = require('fs-extra');
const path = require('path');
const builder = require('./builder');

module.exports.name = 'interaction';
module.exports.alias = '';
module.exports.description = '';
module.exports.options = [
  { flags: '-p, --path <path>', description: 'overwrite path to interaction file' }
];
module.exports.action = (cmd) => {
  const interationPath = cmd.path || path.join(process.cwd(), 'interaction.json');
  const authFileName = 'client_secret.json';

  let interaction = {};
  try {
    // a path we KNOW is totally bogus and not a module
    interaction = require(interationPath);
  } catch (e) {
    if (e.code === 'MODULE_NOT_FOUND') {
      console.log(`mm... It seems you don\'t have a ${interationPath}. Let me create it for you`);
      return fs.outputFileSync(interationPath, JSON.stringify(require('./interaction.example.json'), null, 2), { flag: 'w' });
    }
  }

  try {
    // a path we KNOW is totally bogus and not a module
    interaction.auth = require(authPath);
  } catch (e) {
    if (e.code === 'MODULE_NOT_FOUND') {
      console.log(`mm... Make sure to create ${authFileName} from Google console`);
      return;
    }
  }

  interaction.rootPath = process.cwd();
  builder(interaction);
};
