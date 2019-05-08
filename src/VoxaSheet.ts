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
export declare interface IVoxaSheet {
  spreadsheetId: string;
  spreadsheetTitle: string;
  sheetTitle: string;
  type: string;
  data?: any;
}

export class SheetTypes {
  [key: string]: any;
  public static readonly DOWNLOAD = "DOWNLOAD_";
  public static readonly SLOTS = "LIST_OF_";
  public static readonly INTENT = "INTENT";
  public static readonly UTTERANCE = "UTTERANCES_";
  public static readonly RESPONSES = "RESPONSES_";

  public static readonly INVOCATION = "INVOCATION_NAMES";
  public static readonly SKILL_GENERAL_INFORMATION = "SKILL_GENERAL_INFORMATION";
  public static readonly SKILL_LOCALE_INFORMATION = "SKILL_LOCALE_INFORMATION";
  public static readonly SKILL_ENVIRONMENTS = "SKILL_ENVIRONMENTS_INFORMATION";

  public static readonly VIEWS = "VIEWS_FILE";
}

export function getSheetType(voxaSheet: IVoxaSheet): string {
  return (SheetTypes as any)[voxaSheet.type];
}
