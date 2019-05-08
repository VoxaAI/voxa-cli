const _ = require("lodash");
const views = require("./src/app/views.json");

function getView(viewName, variables, locale) {
  function getStatement(path) {
    const viewObject = _.get(views, `${locale}.translation.${path}`);
    if (!viewObject) {
      throw new Error(`${path} not found`);
    }

    const view = _.isArray(viewObject) ? viewObject[0] : viewObject;

    const errors = [];
    _(variables)
      .keys()
      .map(variableKey => {
        // eslint-disable-line
        if (view.indexOf(`{${variableKey}}`) === -1) {
          errors.push(`Extra variable: ${variableKey}`);
        }
      })
      .value();
    const rendered = view.replace(/\{(\w+)\}/g, (m, offset) => {
      if (variables && !_.isUndefined(variables[offset])) {
        return variables[offset];
      }

      errors.push(`Variable ${offset} missing`);
    });

    if (errors.length > 0) {
      throw new Error(errors.join("\n"));
    }

    return rendered;
  }

  if (!_.isArray(viewName)) {
    const reply = getStatement(viewName);
    return reply;
  } else {
    const reply = _.reduce(
      viewName,
      (acc, view) => {
        const statement = getStatement(view);
        acc.push(statement);
        return acc;
      },
      []
    ).join("\n");

    return reply;
  }
}

module.exports = { getView };
