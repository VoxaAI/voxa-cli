#!/usr/bin/env node

/**
 * Module dependencies.
 */

const program = require('commander');
const path = require('path');
const builder = require('./builder');

function list(val) {
  return val.split(',').map(Number);
}

program
  .version('0.0.1')
  .option('-p, --path [/Users/etc/interaction.json]', 'overwrite path to interaction file', path.join(process.cwd(), 'interaction.json'))
  .parse(process.argv);


  try {
   // a path we KNOW is totally bogus and not a module
   const interaction = require(program.path);
   interaction.rootPath = process.cwd();
   builder(interaction);
  }
  catch (e) {
   console.log('oh no!. There was a problem finding', program.path)
  }
