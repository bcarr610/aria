export const allSymbols = [
  "~",
  "`",
  "!",
  "@",
  "#",
  "$",
  "%",
  "^",
  "&",
  "*",
  "(",
  ")",
  "-",
  "_",
  "+",
  "=",
  "\\",
  "|",
  "]",
  "}",
  "[",
  "{",
  "'",
  '"',
  ";",
  ":",
  "/",
  ".",
  ">",
  ",",
  "<",
];
export const safeSymbols = [
  "!",
  "@",
  "#",
  "$",
  "%",
  "^",
  "&",
  "*",
  "-",
  "_",
  "+",
  "=",
  "|",
  ".",
  ">",
  ",",
  "<",
];
export const unsafeSymbols = allSymbols.filter((f) => !safeSymbols.includes(f));
export const emailRgxBasic = new RegExp("\\w+@\\w+\\.\\w+", "gmi");

export const allSymbolsRgx = new RegExp(`[${allSymbols.join("|")}]`, "gmi");
export const safeSymbolsRgx = new RegExp(`[${safeSymbols.join("|")}]`, "gmi");
export const unsafeSymbolsRgx = new RegExp(`[${unsafeSymbols.join("|")}]`, "gmi");

export const isValidBasicEmail = (input: string) => input && !!String(input).match(emailRgxBasic);

export const hasMinChars = (input: string, amt: number) => String(input).length >= amt;
export const hasMinLetters = (input: string, amt: number) =>
  String(input).replace(/[^a-zA-Z]/gim, "").length >= amt;
export const hasMinUpperCase = (input: string, amt: number) =>
  String(input).replace(/[^A-Z]/gim, "").length >= amt;
export const hasMinLowerCase = (input: string, amt: number) =>
  String(input).replace(/[^a-z]/gim, "").length >= amt;
export const hasNoMoreThanChars = (input: string, amt: number) => String(input).length <= amt;
export const containsNumsAtLeast = (input: string, minNums: number) =>
  String(input).replace(/\D/gim, "").length >= minNums;
export const containsSymbolsAtLeast = (input: string, minSymbols: number) =>
  String(input).replace(/[a-zA-Z0-9]/gim, "").length >= minSymbols;
export const containsUnsafeSymbols = (input: string) => !!String(input).match(unsafeSymbolsRgx);
export const isOnlyAlphaNumeric = (input: string) => !!String(input).match(/[a-z0-9 ]/gim);
