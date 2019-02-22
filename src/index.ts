'use strict';

import * as pkg from '../package.json';
const commander = require('commander');

module.exports = function(argv: any) {


  commander.version(pkg.version, '-v, --version');
  [
    'interaction',
    'init',
  ].forEach(c => {
    commander.usage(c);

    const command = require(`./commands/${c}`)
    const { name, alias, options, description, action } = command;
    const result = commander.command(name || c)
      .alias(alias)
      .description(description);
    (options || []).forEach((option:any) => {
      const { flags, description } = option
      result.option(flags, description);
    })
    result.action(action);
  });

  commander.parse(argv);

  if (argv.length === 2) {
    commander.help();
  }
};
