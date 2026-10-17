import type { LetterMapper } from "./mathMaps";

function tableMap(table: Record<string, string>): LetterMapper {
  return (ch) => table[ch] ?? null;
}

/** Circled Latin letters + digits. */
export const CIRCLED: LetterMapper = (ch) => {
  if (ch >= "A" && ch <= "Z") return String.fromCodePoint(0x24b6 + (ch.charCodeAt(0) - 65));
  if (ch >= "a" && ch <= "z") return String.fromCodePoint(0x24d0 + (ch.charCodeAt(0) - 97));
  if (ch === "0") return "\u24EA";
  if (ch >= "1" && ch <= "9") return String.fromCodePoint(0x2460 + (ch.charCodeAt(0) - 49));
  return null;
};

/** Negative circled (uppercase only in Unicode). */
export const NEGATIVE_CIRCLED: LetterMapper = (ch) => {
  const u = ch.toUpperCase();
  if (u >= "A" && u <= "Z") return String.fromCodePoint(0x1f150 + (u.charCodeAt(0) - 65));
  return null;
};

/** Squared Latin. */
export const SQUARED: LetterMapper = (ch) => {
  const u = ch.toUpperCase();
  if (u >= "A" && u <= "Z") return String.fromCodePoint(0x1f130 + (u.charCodeAt(0) - 65));
  return null;
};

/** Negative squared. */
export const NEGATIVE_SQUARED: LetterMapper = (ch) => {
  const u = ch.toUpperCase();
  if (u >= "A" && u <= "Z") return String.fromCodePoint(0x1f170 + (u.charCodeAt(0) - 65));
  return null;
};

/** Parenthesized Latin. */
export const PARENTHESIZED: LetterMapper = (ch) => {
  if (ch >= "a" && ch <= "z") return String.fromCodePoint(0x249c + (ch.charCodeAt(0) - 97));
  if (ch >= "A" && ch <= "Z") return String.fromCodePoint(0x1f110 + (ch.charCodeAt(0) - 65));
  if (ch >= "1" && ch <= "9") return String.fromCodePoint(0x2474 + (ch.charCodeAt(0) - 49));
  return null;
};

/** Fullwidth / vaporwave. */
export const FULLWIDTH: LetterMapper = (ch) => {
  if (ch === " ") return "\u3000";
  const code = ch.charCodeAt(0);
  if (code >= 0x21 && code <= 0x7e) return String.fromCodePoint(0xff00 + (code - 0x20));
  return null;
};

const SMALL_CAPS: Record<string, string> = {
  a: "\u1D00", b: "\u0299", c: "\u1D04", d: "\u1D05", e: "\u1D07",
  f: "\uA730", g: "\u0262", h: "\u029C", i: "\u026A", j: "\u1D0A",
  k: "\u1D0B", l: "\u029F", m: "\u1D0D", n: "\u0274", o: "\u1D0F",
  p: "\u1D18", q: "\u01EB", r: "\u0280", s: "\uA731", t: "\u1D1B",
  u: "\u1D1C", v: "\u1D20", w: "\u1D21", x: "x", y: "\u028F", z: "\u1D22",
};

export const SMALL_CAPS_MAP: LetterMapper = (ch) => SMALL_CAPS[ch.toLowerCase()] ?? null;

const SUPER: Record<string, string> = {
  "0": "\u2070", "1": "\u00B9", "2": "\u00B2", "3": "\u00B3", "4": "\u2074",
  "5": "\u2075", "6": "\u2076", "7": "\u2077", "8": "\u2078", "9": "\u2079",
  a: "\u1D43", b: "\u1D47", c: "\u1D9C", d: "\u1D48", e: "\u1D49",
  f: "\u1DA0", g: "\u1D4D", h: "\u02B0", i: "\u2071", j: "\u02B2",
  k: "\u1D4F", l: "\u02E1", m: "\u1D50", n: "\u207F", o: "\u1D52",
  p: "\u1D56", r: "\u02B3", s: "\u02E2", t: "\u1D57", u: "\u1D58",
  v: "\u1D5B", w: "\u02B7", x: "\u02E3", y: "\u02B8", z: "\u1DBB",
  A: "\u1D2C", B: "\u1D2E", D: "\u1D30", E: "\u1D31", G: "\u1D33",
  H: "\u1D34", I: "\u1D35", J: "\u1D36", K: "\u1D37", L: "\u1D38",
  M: "\u1D39", N: "\u1D3A", O: "\u1D3C", P: "\u1D3E", R: "\u1D3F",
  T: "\u1D40", U: "\u1D41", V: "\u2C7D", W: "\u1D42",
};

export const SUPERSCRIPT: LetterMapper = tableMap(SUPER);

const SUB: Record<string, string> = {
  "0": "\u2080", "1": "\u2081", "2": "\u2082", "3": "\u2083", "4": "\u2084",
  "5": "\u2085", "6": "\u2086", "7": "\u2087", "8": "\u2088", "9": "\u2089",
  a: "\u2090", e: "\u2091", h: "\u2095", i: "\u1D62", j: "\u2C7C",
  k: "\u2096", l: "\u2097", m: "\u2098", n: "\u2099", o: "\u2092",
  p: "\u209A", r: "\u1D63", s: "\u209B", t: "\u209C", u: "\u1D64",
  v: "\u1D65", x: "\u2093",
};

export const SUBSCRIPT: LetterMapper = tableMap(SUB);

export const BUBBLE: LetterMapper = CIRCLED;

const FLIP: Record<string, string> = {
  a: "\u0250", b: "q", c: "\u0254", d: "p", e: "\u01DD", f: "\u025F",
  g: "\u0183", h: "\u0265", i: "\u1D09", j: "\u027E", k: "\u029E", l: "l",
  m: "\u026F", n: "u", o: "o", p: "d", q: "b", r: "\u0279", s: "s",
  t: "\u0287", u: "n", v: "\u028C", w: "\u028D", x: "x", y: "\u028E", z: "z",
  A: "\u2200", B: "\u15FA", C: "\u0186", D: "\u15E1", E: "\u018E", F: "\u2132",
  G: "\u2141", H: "H", I: "I", J: "\u017F", K: "\u029E", L: "\u02E5",
  M: "W", N: "N", O: "O", P: "\u0500", Q: "\u038C", R: "\u1D1A", S: "S",
  T: "\u22A5", U: "\u2229", V: "\u039B", W: "M", X: "X", Y: "\u2144", Z: "Z",
  "0": "0", "1": "\u0196", "2": "\u1105", "3": "\u0190", "4": "\u3123",
  "5": "\u03DB", "6": "9", "7": "\u3125", "8": "8", "9": "6",
  "?": "\u00BF", "!": "\u00A1", ".": "\u02D9", ",": "'", "'": ",",
  '"': ",,", "(": ")", ")": "(", "[": "]", "]": "[", "{": "}", "}": "{",
  "<": ">", ">": "<", "&": "\u214B", _: "\u203E",
};

export const UPSIDE_DOWN_CHAR: LetterMapper = (ch) => FLIP[ch] ?? null;

export function flipLine(line: string): string {
  const chars = [...line];
  const out: string[] = [];
  for (let i = chars.length - 1; i >= 0; i -= 1) {
    out.push(FLIP[chars[i]] ?? chars[i]);
  }
  return out.join("");
}
