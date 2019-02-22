#!/usr/bin/env node

/**
 * Module dependencies.
 */

const fs = require('fs-extra');
const program = require('commander');
const path = require('path');
const builder = require('./builder');

function list(val) {
  return val.split(',').map(Number);
}

const fileName = 'interaction.json';
const authFileName = 'client_secret.json';
const authPath = path.join(process.cwd(), authFileName);
let interaction = {};
program
  .version('0.0.1')
  .option(`-p, --path [/Users/etc/${fileName}]`, 'overwrite path to interaction file', path.join(process.cwd(), fileName))
  .parse(process.argv);

  try {
   // a path we KNOW is totally bogus and not a module
   interaction = require(program.path);
  } catch (e) {
    if (e.code === 'MODULE_NOT_FOUND') {
      console.log(`mm... It seems you don\'t have a ${fileName}. Let me create it for you`);
      return fs.outputFileSync(path.join(process.cwd(), fileName), JSON.stringify(require('./interaction.example.json'), null, 2), { flag: 'w' });
    }
  }

  try {
   // a path we KNOW is totally bogus and not a module
   interaction.auth = require(authPath);
  } catch (e) {
    if (e.code === 'MODULE_NOT_FOUND') {
      console.log(`mm... Make sure to create ${authFileName} from Google console`);
      return ;
    }
  }

  interaction.rootPath = process.cwd();
  builder(interaction);
