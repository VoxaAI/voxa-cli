export declare interface VoxaSheet {
    spreadsheetId: string;
    spreadsheetTitle: string;
    sheetTitle: string;
    type: string;
    data?: any;
}

export class SheetTypes {
  [key: string]: any;
  public static readonly DOWNLOAD = 'DOWNLOAD_';
  public static readonly SLOTS = 'LIST_OF_';
  public static readonly INTENT = 'INTENT';
  public static readonly UTTERANCE = 'UTTERANCES_';

  public static readonly INVOCATION = 'INVOCATION_NAMES';
  public static readonly SKILL_GENERAL_INFORMATION = 'SKILL_GENERAL_INFORMATION';
  public static readonly SKILL_LOCALE_INFORMATION = 'SKILL_LOCALE_INFORMATION';
  public static readonly SKILL_ENVIRONMENTS = 'SKILL_ENVIRONMENTS_INFORMATION';

  public static readonly VIEWS = 'VIEWS_FILE';
}

export function getSheetType(voxaSheet: VoxaSheet) {
  return (<any>SheetTypes)[voxaSheet.type];
}
