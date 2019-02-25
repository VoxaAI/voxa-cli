"use strict";

import * as commander from "commander";
import * as pkg from "../package.json";

module.exports = (argv: any) => {
  commander.version(pkg.version, "-v, --version");
  ["interaction", "init"].forEach(c => {
    commander.usage(c);

    const command = require(`./commands/${c}`);
    const { name, alias, options, description, action } = command;
    const result = commander
      .command(name || c)
      .alias(alias)
      .description(description);
    (options || []).forEach((option: any) => {
      const { flags } = option;
      const descriptionOption = option.description;
      result.option(flags, descriptionOption);
    });
    result.action(action);
  });

  commander.parse(argv);

  if (argv.length === 2) {
    commander.help();
  }
};
