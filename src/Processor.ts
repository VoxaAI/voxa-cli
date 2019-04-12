/*
 * Copyright (c) 2018 Rain Agency <contact@rain.agency>
 * Author: Rain Agency <contact@rain.agency>
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 * the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
 * FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 * COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
 * IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
/* tslint:disable:no-submodule-imports */
import * as _Promise from "bluebird";
import * as _ from "lodash";
import {
  IDownload,
  IIntent,
  IInvocation,
  IPublishingInformation,
  ISlot,
  ISlotSynonymns,
  IView
} from "./Schema";
import { getSheetType, IVoxaSheet, SheetTypes } from "./VoxaSheet";

export function sheetLocale(voxaSheet: IVoxaSheet, AVAILABLE_LOCALES: string[]) {
  let locale = AVAILABLE_LOCALES.find((loc: string) => {
    let lastDotIndex = _.lastIndexOf(voxaSheet.spreadsheetTitle, ".");
    lastDotIndex = lastDotIndex === -1 ? voxaSheet.spreadsheetTitle.length : lastDotIndex;

    const titleWithoutExtension = _.toLower(voxaSheet.spreadsheetTitle.slice(0, lastDotIndex));
    return _.endsWith(titleWithoutExtension, _.toLower(loc));
  });
  locale = locale || AVAILABLE_LOCALES[0];

  return locale;
}

export function downloadProcessor(voxaSheets: IVoxaSheet[], AVAILABLE_LOCALES: string[]) {
  const voxaSheetsDownloads = voxaSheets.filter(voxaSheet =>
    _.includes([SheetTypes.DOWNLOAD], getSheetType(voxaSheet))
  );

  return voxaSheetsDownloads.map((voxaSheet: IVoxaSheet) => {
    const locale = sheetLocale(voxaSheet, AVAILABLE_LOCALES);
    const sheetPlaceholder = getSheetType(voxaSheet);
    const name = (voxaSheet.sheetTitle = voxaSheet.sheetTitle.replace(sheetPlaceholder, ""));
    const data = _.chain(voxaSheet.data)
      .filter(item => {
        const tempItem = _.omitBy(item, _.isEmpty);
        return !_.isEmpty(tempItem);
      })
      .value();
    const download: IDownload = { name, data, locale };
    return download;
  });
}

export function invocationProcessor(voxaSheets: IVoxaSheet[], AVAILABLE_LOCALES: string[]) {
  const voxaSheetsInvocations = voxaSheets.filter(voxaSheet =>
    _.includes([SheetTypes.INVOCATION], getSheetType(voxaSheet))
  );

  return voxaSheetsInvocations.reduce(
    (acc, voxaSheet: IVoxaSheet) => {
      const locale = sheetLocale(voxaSheet, AVAILABLE_LOCALES);
      voxaSheet.data.map((item: any) => {
        const { environment, invocationName } = item;
        acc.push({ name: invocationName, environment, locale });
      });

      return acc;
    },
    [] as IInvocation[]
  );
}

export function viewsProcessor(voxaSheets: IVoxaSheet[], AVAILABLE_LOCALES: string[]) {
  function sanitizeView(text: string = "") {
    return text
      .replace(/’/g, "'")
      .replace(/’/g, "'")
      .replace(/“/g, '"')
      .replace(/”/g, '"')
      .replace(/&/g, "and");
  }

  const voxaSheetsViews = voxaSheets.filter(voxaSheet =>
    _.includes([SheetTypes.VIEWS], getSheetType(voxaSheet))
  );

  return voxaSheetsViews.map((voxaSheet: IVoxaSheet) => {
    const locale = voxaSheet.sheetTitle.split("@")[1] || AVAILABLE_LOCALES[0];
    const data = _.chain(voxaSheet.data)
      .reduce((acc, view) => {
        const { path } = view;
        const pathLowerCase = _.toLower(path) as string;
        let { value } = view;
        if (_.isEmpty(path)) {
          return acc;
        }
        const shouldBeArray = [".text", ".say", ".reprompt", ".tell", ".ask"].find(suffix =>
          path.includes(suffix)
        );
        const isASuggestionChip = [".dialogflowsuggestions", ".facebooksuggestionchips"].find(
          option => pathLowerCase.includes(option)
        );

        if (shouldBeArray && _.isString(value) && !_.isEmpty(value)) {
          const temp = _.get(acc, path, []) as string[];
          temp.push(sanitizeView(value));
          value = temp;
        }

        if (!_.isEmpty(value) && isASuggestionChip) {
          value = value.split("\n").map((v: string) => v.trim());
        }

        _.set(acc, path, value);
        return acc;
      }, {})
      .value();
    const viewResult: IView = { data, locale };
    return viewResult;
  });
}

export function slotProcessor(voxaSheets: IVoxaSheet[], AVAILABLE_LOCALES: string[]) {
  const voxaSheetsSlots = voxaSheets.filter(voxaSheet =>
    _.includes([SheetTypes.SLOTS], getSheetType(voxaSheet))
  );

  return voxaSheetsSlots.map((voxaSheet: IVoxaSheet) => {
    const locale = sheetLocale(voxaSheet, AVAILABLE_LOCALES);
    const name = voxaSheet.sheetTitle;
    const values = _.chain(voxaSheet.data)
      .groupBy("synonym")
      .toPairs()
      .reduce(
        (acc, slot) => {
          const key = slot[0];
          const synonyms = slot[1] || [];

          if (key === undefined || key === "undefined") {
            acc.push(synonyms.map(synonymName => ({ value: synonymName[name], synonyms: [] })));
          } else {
            acc.push({ value: key, synonyms: _.map(synonyms, name) });
          }
          return acc;
        },
        [] as Array<{}>
      )
      .flattenDeep()
      .filter("value")
      .uniq()
      .value() as ISlotSynonymns[];
    const slotResult: ISlot = { name, values, locale };
    return slotResult;
  });
}

export function intentUtterProcessor(voxaSheets: IVoxaSheet[], AVAILABLE_LOCALES: string[]) {
  const voxaSheetsIntent = filterSheets(voxaSheets, [SheetTypes.INTENT]);

  const voxaSheetsUtter = _.reduce(
    filterSheets(voxaSheets, [SheetTypes.UTTERANCE]),
    reduceIntent("utterance"),
    [] as IVoxaSheet[]
  );

  const voxaSheetResponses = _.reduce(
    filterSheets(voxaSheets, [SheetTypes.RESPONSES]),
    reduceIntent("response"),
    [] as IVoxaSheet[]
  );

  const result = _.chain(voxaSheetsIntent)
    .map((voxaSheetIntent: IVoxaSheet) => {
      const locale = sheetLocale(voxaSheetIntent, AVAILABLE_LOCALES);
      let previousIntent: string;
      voxaSheetIntent.data = _.chain(voxaSheetIntent.data)
        .map(row => {
          const info = _.pick(row, [
            "Intent",
            "slotType",
            "slotName",
            "environment",
            "platformIntent",
            "events",
            "canFulfillIntent",
            "startIntent",
            "signInRequired",
            "endIntent",
            "platformSlot",
            "webhookForSlotFilling",
            "webhookUsed"
          ]);
          previousIntent = _.isEmpty(info.Intent) ? previousIntent : info.Intent;
          info.Intent = previousIntent;

          return info;
        })
        .uniq()
        .groupBy("Intent")
        .toPairs()
        .reduce(
          (acc: IIntent[], item: any) => {
            const intentName = item[0] as string;
            const head = _.head(item[1]);
            const events = _.chain(head)
              .get("events", "")
              .split(",")
              .map(_.trim)
              .compact()
              .value() as string[];
            const signInRequired = _.get(head, "signInRequired", false) as boolean;
            const environments = _.chain(head)
              .get("environment", "")
              .split(",")
              .map(_.trim)
              .compact()
              .value() as string[];
            const platforms = _.chain(head)
              .get("platformIntent", "")
              .split(",")
              .map(_.trim)
              .map(_.toLower)
              .compact()
              .value() as string[];

            const webhookForSlotFilling = (_.get(head, "webhookForSlotFilling", false) ||
              _.get(head, "useWebhookForSlotFilling", false)) as boolean;
            const webhookUsed = _.get(head, "webhookUsed", true) as boolean;
            const canFulfillIntent = _.get(head, "canFulfillIntent", false) as boolean;
            const startIntent = _.get(head, "startIntent", false) as boolean;
            const endIntent = _.get(head, "endIntent", false) as boolean;

            const samples = getIntentValueList(
              voxaSheetsUtter,
              voxaSheetIntent.spreadsheetId,
              intentName,
              "utterance"
            );

            const responses = getIntentValueList(
              voxaSheetResponses,
              voxaSheetIntent.spreadsheetId,
              intentName,
              "response"
            );

            const slotsDefinition = _.chain(item[1])
              .filter("slotName")
              .map((slot: any) => ({
                name: slot.slotName,
                type: slot.slotType,
                platform: slot.platformSlot
              }))
              .compact()
              .uniq()
              .value();

            const intent: IIntent = {
              name: intentName,
              samples,
              responses,
              slotsDefinition,
              webhookForSlotFilling,
              webhookUsed,
              canFulfillIntent,
              startIntent,
              endIntent,
              events,
              environments,
              platforms,
              locale,
              signInRequired
            };

            acc.push(intent);
            return acc;
          },
          [] as IIntent[]
        )
        .value();

      return voxaSheetIntent.data;
    })
    .flattenDeep()
    .value();

  return result as IIntent[];
}

export function publishingProcessor(voxaSheets: IVoxaSheet[], AVAILABLE_LOCALES: string[]) {
  const voxaSheetsPublishing = voxaSheets.filter(voxaSheet =>
    _.includes(
      [
        SheetTypes.SKILL_ENVIRONMENTS,
        SheetTypes.SKILL_LOCALE_INFORMATION,
        SheetTypes.SKILL_GENERAL_INFORMATION
      ],
      getSheetType(voxaSheet)
    )
  );

  return voxaSheetsPublishing.reduce(
    (acc, voxaSheet: IVoxaSheet) => {
      voxaSheet.data.map((item: any) => {
        const locale = voxaSheet.sheetTitle.split("@")[1] || AVAILABLE_LOCALES[0];
        const environments = _.chain(item)
          .get("environment", "")
          .split(",")
          .map(_.trim)
          .compact()
          .value() as string[];
        const key = _.chain(item)
          .get("key", "")
          .replace("{locale}", locale)
          .value();
        const value = _.chain(item)
          .get("value", "")
          .value();

        const publishInfo: IPublishingInformation = { key, value, environments };
        acc.push(publishInfo);
      });

      return acc;
    },
    [] as IPublishingInformation[]
  );
}

function filterSheets(voxaSheets: IVoxaSheet[], sheetTypes: string[]): IVoxaSheet[] {
  return _.filter(voxaSheets, voxaSheet => _.includes(sheetTypes, getSheetType(voxaSheet)));
}

function reduceIntent(propName: string) {
  return (acc: any, row: any) => {
    row.data = _.chain(row.data)
      .reduce((accData: Array<{}>, item: any) => {
        _.map(item, (value, key) => {
          const obj: any = { intent: key };
          obj[propName] = value;
          accData.push(obj);
        });
        return accData;
      }, [])
      .groupBy("intent")
      .value();

    acc.push(row);
    return acc;
  };
}

function getIntentValueList(
  voxaSheets: IVoxaSheet[],
  spreadsheetId: string,
  intentName: string,
  key: string
): string[] {
  return _(voxaSheets)
    .filter(sheet => sheet.spreadsheetId === spreadsheetId)
    .map((spreadSheet: IVoxaSheet) => spreadSheet.data[intentName] || [])
    .flatten()
    .map(key)
    .compact()
    .uniq()
    .value();
}
