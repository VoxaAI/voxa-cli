import * as _ from "lodash";
import * as views from "../src/app/views.json";

export function getView(
  viewName: string,
  variables: any = {},
  locale: string = "en"
) {
  function getStatement(path: string): any {
    const viewObject = _.get(views, `${locale}.translation.${path}`);
    if (!viewObject) {
      throw new Error(`${path} not found`);
    }

    const view = _.isArray(viewObject) ? viewObject[0] : viewObject;

    const errors: string[] = [];
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
    const reply: string = getStatement(viewName);
    return reply;
  } else {
    const reply: string = _.reduce(
      viewName,
      (acc: string[], view) => {
        const statement = getStatement(view);
        acc.push(statement);
        return acc;
      },
      []
    ).join("\n");

    return reply;
  }
}
