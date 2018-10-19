'use strict';

const commander = require('commander');

module.exports = function(argv) {
  const pkg = require('../package.json');

  commander.version(pkg.version);
  let description = 'Run a generator. Type can be\n';


  [
    'interaction',
    'init',
  ].forEach(c => {
    commander.usage(c);

    const command = require(`./commands/${c}`)
    const { name, alias, description } = command;
    commander.command(name || c)
      .alias(alias)
      .description(description)
      .action(command);
  });

  commander.parse(argv);
  
  if (argv.length === 2) {
    commander.help();
  }
};
