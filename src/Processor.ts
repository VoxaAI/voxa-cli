import { VoxaSheet, SheetTypes, getSheetType  } from './VoxaSheet';
import { Download, Intent, Invocation, SlotSynonymns, View, Slot, PublishingInformation } from './Schema';
import * as _ from 'lodash';
import * as _Promise from 'bluebird';

export function sheetLocale(voxaSheet: VoxaSheet, AVAILABLE_LOCALES: string[]) {
  let locale = AVAILABLE_LOCALES.find((loc: string) => _.includes(_.toLower(voxaSheet.spreadsheetTitle), _.toLower(loc)));
  locale = locale || AVAILABLE_LOCALES[0];

  return locale;
}

export function downloadProcessor(voxaSheets: VoxaSheet[], AVAILABLE_LOCALES: string[]) {
  const voxaSheetsDownloads = voxaSheets.filter(voxaSheet => _.includes([SheetTypes.DOWNLOAD], getSheetType(voxaSheet)));

  return voxaSheetsDownloads.map((voxaSheet: VoxaSheet) => {
    const locale = sheetLocale(voxaSheet, AVAILABLE_LOCALES);
    const sheetPlaceholder = getSheetType(voxaSheet);
    const name = voxaSheet.sheetTitle = voxaSheet.sheetTitle.replace(sheetPlaceholder, '');
    return { name, data: voxaSheet.data, locale } as Download;
  });
}

export function invocationProcessor(voxaSheets: VoxaSheet[], AVAILABLE_LOCALES: string[]) {
  const voxaSheetsInvocations = voxaSheets.filter(voxaSheet => _.includes([SheetTypes.INVOCATION], getSheetType(voxaSheet)));

  return voxaSheetsInvocations.reduce((acc, voxaSheet: VoxaSheet) => {
    const locale = sheetLocale(voxaSheet, AVAILABLE_LOCALES);
    voxaSheet.data.map((item:any) => {
      const { environment, invocationName} = item;
      acc.push({ name: invocationName, environment, locale });
    });

    return acc;
  }, [] as Invocation[]);
}

export function viewsProcessor(voxaSheets: VoxaSheet[], AVAILABLE_LOCALES: string[]) {
  function sanitizeView (text: string) {
    return text
      .replace(/’/g, '\'')
      .replace(/“/g, '"')
      .replace(/”/g, '"')
      .replace(/&/g, 'and')
      ;
  }

  const voxaSheetsViews = voxaSheets.filter(voxaSheet => _.includes([SheetTypes.VIEWS], getSheetType(voxaSheet)));

  return voxaSheetsViews.map((voxaSheet: VoxaSheet) => {
    const locale = voxaSheet.sheetTitle.split('@')[1] || AVAILABLE_LOCALES[0];
    const data = _.chain(voxaSheet.data)
    .reduce((acc, view) => {
      const { path } = view;
      let { value } = view;
      const shouldBeArray = ['.say', '.reprompt', '.tell', '.ask'].find(suffix => path.includes(suffix));

      if (shouldBeArray) {
        const temp = (<any>acc)[path] || [];
        temp.push(sanitizeView(value));
        value = temp;
      }

      _.set(acc, path, value);
      return acc;
    }, {})
    .value();
    return { data: data, locale } as View;
  });
}

export function slotProcessor(voxaSheets: VoxaSheet[], AVAILABLE_LOCALES: string[]) {
  const voxaSheetsSlots = voxaSheets.filter(voxaSheet => _.includes([SheetTypes.SLOTS], getSheetType(voxaSheet)));

  return voxaSheetsSlots.map((voxaSheet: VoxaSheet) => {
    const locale = sheetLocale(voxaSheet, AVAILABLE_LOCALES);
    const name = voxaSheet.sheetTitle;
    const values = _.chain(voxaSheet.data)
    .groupBy('synonym')
    .toPairs()
    .reduce((acc, slot) => {
      const key = slot[0];
      const synonyms = slot[1] || [];
      if (key === undefined || key === 'undefined') {
        acc.push(synonyms.map(synonymName => ({ name: synonymName[name], synonyms: []})));
      } else {
       acc.push({ name: key, synonyms: _.map(synonyms, name) });
      }
      return acc;
    }, [] as {}[])
    .value() as SlotSynonymns[];
    return { name, values, locale } as Slot;
  });
}

export function intentUtterProcessor(voxaSheets: VoxaSheet[], AVAILABLE_LOCALES: string[]) {
  const voxaSheetsIntent = voxaSheets.filter(voxaSheet => _.includes([SheetTypes.INTENT], getSheetType(voxaSheet)));
  let voxaSheetsUtter = voxaSheets.filter(voxaSheet => _.includes([SheetTypes.UTTERANCE], getSheetType(voxaSheet)));

  voxaSheetsUtter = _.chain(voxaSheetsUtter)
  .reduce((acc, utter) => {
    utter.data = _.chain(utter.data)
    .reduce((accData: {}[], item: any) => {
      _.map(item, (value, key) => {
        accData.push({ intent: key, utterance: value});
      });
      return accData;
    }, [])
    .groupBy('intent')
    .value();

    acc.push(utter);
    return acc;
  }, [] as VoxaSheet[])
  .value();

  const result = _.chain(voxaSheetsIntent)
  .map(voxaSheetIntent => {
     const locale = sheetLocale(voxaSheetIntent, AVAILABLE_LOCALES);
    let previousIntent: string;
    voxaSheetIntent.data = _.chain(voxaSheetIntent.data)
    .map((row) => {
      const info = _.pick(row, ['Intent', 'slotType', 'slotName', 'environment', 'platformIntent', 'events', 'canFulfillIntent', 'startIntent', 'endIntent']);
      previousIntent = _.isEmpty(info.Intent) ? previousIntent : info.Intent;
      info.Intent = previousIntent;

      return info;
    })
    .uniq()
    .groupBy('Intent')
    .toPairs()
    .reduce((acc, item) => {
      const intentName = item[0] as string;
      const head = _.head(item[1]);
      const events = _.chain(head).get('events', '').split(',').map(_.trim).compact().value() as string[];
      const environments = _.chain(head).get('environment', '').split(',').map(_.trim).compact().value() as string[];
      const platforms = _.chain(head).get('platformIntent', '').split(',').map(_.trim).map(_.toLower).compact().value() as string[];
      const canFulfillIntent = _.get(head, 'canFulfillIntent', false) as boolean;
      const startIntent = _.get(head, 'startIntent', false) as boolean;
      const endIntent = _.get(head, 'endIntent', false) as boolean;
      const samples = _.chain(voxaSheetsUtter)
                      .find({ spreadsheetId: voxaSheetIntent.spreadsheetId })
                      .get(`data.${intentName}`, [])
                      .map('utterance')
                      .compact()
                      .value();

      const slotsDefinition = _.chain(item[1])
      .filter('slotName')
      .map(slot => ({
        name: slot.slotName,
        type: slot.slotType,
      }))
      .compact()
      .uniq()
      .value();

      const intent = {
        name: intentName,
        samples,
        slotsDefinition,
        canFulfillIntent,
        startIntent,
        endIntent,
        events,
        environments,
        platforms,
        locale,
      } as Intent;

      acc.push(intent);
      return acc;
    }, [] as Intent[])
    .value();

    return voxaSheetIntent.data;
  })
  .flattenDeep()
  .value();

  console.log('result', result);
  return result as Intent[];
}

export function publishingProcessor(voxaSheets: VoxaSheet[], AVAILABLE_LOCALES: string[]) {
  const voxaSheetsPublishing = voxaSheets.filter(voxaSheet => _.includes([SheetTypes.SKILL_ENVIRONMENTS, SheetTypes.SKILL_LOCALE_INFORMATION, SheetTypes.SKILL_GENERAL_INFORMATION], getSheetType(voxaSheet)));

  return voxaSheetsPublishing.reduce((acc, voxaSheet: VoxaSheet) => {
    voxaSheet.data.map((item:any) => {
      const locale = voxaSheet.sheetTitle.split('@')[1] || AVAILABLE_LOCALES[0];
      const environments = _.chain(item).get('environment', '').split(',').map(_.trim).compact().value() as string[];
      let key = _.chain(item).get('key', '').replace('{locale}', locale).value();
      const value = _.chain(item).get('value', '').value();

      acc.push({ key, value, environments } as PublishingInformation) ;
    });

    return acc;
  }, [] as PublishingInformation[])
}
