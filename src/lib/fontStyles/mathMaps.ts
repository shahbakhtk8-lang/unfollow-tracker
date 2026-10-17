/**
 * Mathematical Alphanumeric Symbols (U+1D400+) plus Letterlike Symbols holes.
 * Each style exposes a 128-slot ASCII lookup for the hot path.
 */

export type LetterMapper = (ch: string) => string | null;

function offsetMap(
  upperBase: number,
  lowerBase: number | null,
  digitBase: number | null,
  upperExceptions: Record<string, string> = {},
  lowerExceptions: Record<string, string> = {},
): LetterMapper {
  return (ch: string) => {
    if (ch >= "A" && ch <= "Z") {
      if (upperExceptions[ch]) return upperExceptions[ch];
      return String.fromCodePoint(upperBase + (ch.charCodeAt(0) - 65));
    }
    if (ch >= "a" && ch <= "z" && lowerBase != null) {
      if (lowerExceptions[ch]) return lowerExceptions[ch];
      return String.fromCodePoint(lowerBase + (ch.charCodeAt(0) - 97));
    }
    if (ch >= "0" && ch <= "9" && digitBase != null) {
      return String.fromCodePoint(digitBase + (ch.charCodeAt(0) - 48));
    }
    return null;
  };
}

/** Precompute ASCII (0–127) replacements for a mapper. */
export function buildAsciiTable(mapper: LetterMapper): (string | null)[] {
  const table = new Array<string | null>(128).fill(null);
  for (let i = 0; i < 128; i += 1) {
    table[i] = mapper(String.fromCharCode(i));
  }
  return table;
}

/** Script holes: B E F H I L M R; small e g o */
const SCRIPT_UPPER: Record<string, string> = {
  B: "\u212C",
  E: "\u2130",
  F: "\u2131",
  H: "\u210B",
  I: "\u2110",
  L: "\u2112",
  M: "\u2133",
  R: "\u211B",
};
const SCRIPT_LOWER: Record<string, string> = {
  e: "\u212F",
  g: "\u210A",
  o: "\u2134",
};

/** Fraktur holes: C H I R Z */
const FRAKTUR_UPPER: Record<string, string> = {
  C: "\u212D",
  H: "\u210C",
  I: "\u2111",
  R: "\u211C",
  Z: "\u2128",
};

/** Double-struck holes: C H N P Q R Z */
const DOUBLE_UPPER: Record<string, string> = {
  C: "\u2102",
  H: "\u210D",
  N: "\u2115",
  P: "\u2119",
  Q: "\u211A",
  R: "\u211D",
  Z: "\u2124",
};

/** Italic hole: small h */
const ITALIC_LOWER: Record<string, string> = {
  h: "\u210E",
};

export const MATH_MAPPERS: Record<string, LetterMapper> = {
  "math-bold": offsetMap(0x1d400, 0x1d41a, 0x1d7ce),
  "math-italic": offsetMap(0x1d434, 0x1d44e, null, {}, ITALIC_LOWER),
  "math-bold-italic": offsetMap(0x1d468, 0x1d482, null),
  "math-script": offsetMap(0x1d49c, 0x1d4b6, null, SCRIPT_UPPER, SCRIPT_LOWER),
  "math-bold-script": offsetMap(0x1d4d0, 0x1d4ea, null),
  "math-fraktur": offsetMap(0x1d504, 0x1d51e, null, FRAKTUR_UPPER),
  "math-bold-fraktur": offsetMap(0x1d56c, 0x1d586, null),
  "math-double-struck": offsetMap(0x1d538, 0x1d552, 0x1d7d8, DOUBLE_UPPER),
  "math-sans": offsetMap(0x1d5a0, 0x1d5ba, 0x1d7e2),
  "math-sans-bold": offsetMap(0x1d5d4, 0x1d5ee, 0x1d7ec),
  "math-sans-italic": offsetMap(0x1d608, 0x1d622, null),
  "math-sans-bold-italic": offsetMap(0x1d63c, 0x1d656, null),
  "math-monospace": offsetMap(0x1d670, 0x1d68a, 0x1d7f6),
};

export const MATH_ASCII_TABLES: Record<string, (string | null)[]> = Object.fromEntries(
  Object.entries(MATH_MAPPERS).map(([id, mapper]) => [id, buildAsciiTable(mapper)]),
);

/** Styles that map letters and have NFKC round-trips we should verify. */
export const NFKC_LETTER_STYLES = Object.keys(MATH_MAPPERS);
