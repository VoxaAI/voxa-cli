"use strict";

import * as commander from "commander";
import "source-map-support/register";
import * as pkg from "../package.json";

module.exports = async (argv: any) => {
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
    result.action(async cmd => {
      await action(cmd);
    });
  });

  commander.parse(argv);

  if (argv.length === 2) {
    commander.help();
  }
};
