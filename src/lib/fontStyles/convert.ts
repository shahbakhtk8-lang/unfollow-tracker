import { applyCombining, type CombiningKind } from "./combining";
import { applyFrame, FRAMES } from "./frames";
import { MATH_ASCII_TABLES, MATH_MAPPERS, type LetterMapper } from "./mathMaps";
import { isEmojiCodePoint, plainSpanMask } from "./preserve";
import {
  BUBBLE,
  CIRCLED,
  FULLWIDTH,
  NEGATIVE_CIRCLED,
  NEGATIVE_SQUARED,
  PARENTHESIZED,
  SMALL_CAPS_MAP,
  SPECIAL_ASCII_TABLES,
  SQUARED,
  SUBSCRIPT,
  SUPERSCRIPT,
  flipLine,
} from "./specialMaps";
import { STYLE_BY_ID } from "./styles";
import type { ConvertOptions, ConvertResult } from "./types";

const DEFAULT_OPTIONS: Required<ConvertOptions> = {
  keepLinksMentionsHashtags: true,
  keepEmoji: true,
};

function isLetterOrDigit(ch: string): boolean {
  return /^[A-Za-z0-9]$/.test(ch);
}

function mapWithAsciiTable(
  text: string,
  table: (string | null)[],
  opts: Required<ConvertOptions>,
): { text: string; mapped: number; eligible: number } {
  const keepPlain = opts.keepLinksMentionsHashtags;
  const keepEmoji = opts.keepEmoji;
  const mask = plainSpanMask(text, keepPlain);
  let mapped = 0;
  let eligible = 0;
  const out: string[] = [];
  const len = text.length;

  for (let i = 0; i < len; ) {
    const code = text.charCodeAt(i);

    // Surrogate pair (emoji etc.)
    if (code >= 0xd800 && code <= 0xdbff && i + 1 < len) {
      const next = text.charCodeAt(i + 1);
      if (next >= 0xdc00 && next <= 0xdfff) {
        out.push(text[i] + text[i + 1]);
        i += 2;
        continue;
      }
    }

    if (code === 10) {
      out.push("\n");
      i += 1;
      continue;
    }
    if (keepPlain && mask[i]) {
      out.push(text[i]);
      i += 1;
      continue;
    }
    if (keepEmoji && isEmojiCodePoint(code)) {
      out.push(text[i]);
      i += 1;
      continue;
    }

    if (code < 128) {
      const repl = table[code];
      if (repl != null) {
        out.push(repl);
        if (
          (code >= 48 && code <= 57) ||
          (code >= 65 && code <= 90) ||
          (code >= 97 && code <= 122)
        ) {
          eligible += 1;
          mapped += 1;
        }
        i += 1;
        continue;
      }
    }

    if (
      (code >= 48 && code <= 57) ||
      (code >= 65 && code <= 90) ||
      (code >= 97 && code <= 122)
    ) {
      eligible += 1;
    }
    out.push(text[i]);
    i += 1;
  }

  return { text: out.join(""), mapped, eligible };
}

function mapWithMapper(
  text: string,
  mapper: LetterMapper,
  opts: Required<ConvertOptions>,
): { text: string; mapped: number; eligible: number } {
  const keepPlain = opts.keepLinksMentionsHashtags;
  const mask = plainSpanMask(text, keepPlain);
  let utf16 = 0;
  let mapped = 0;
  let eligible = 0;
  const out: string[] = [];

  for (const ch of text) {
    const start = utf16;
    utf16 += ch.length;
    const cp = ch.codePointAt(0)!;

    if (ch === "\n") {
      out.push(ch);
      continue;
    }
    if (opts.keepEmoji && isEmojiCodePoint(cp)) {
      out.push(ch);
      continue;
    }
    if (keepPlain && mask[start]) {
      out.push(ch);
      continue;
    }

    if (isLetterOrDigit(ch)) eligible += 1;
    const next = mapper(ch);
    if (next != null) {
      out.push(next);
      if (isLetterOrDigit(ch)) mapped += 1;
    } else {
      out.push(ch);
    }
  }

  return { text: out.join(""), mapped, eligible };
}

function spaceOut(text: string, gap: string, opts: Required<ConvertOptions>): ConvertResult {
  const mask = plainSpanMask(text, opts.keepLinksMentionsHashtags);
  const lines = text.split("\n");
  let utf16 = 0;
  const outLines: string[] = [];
  let mapped = 0;
  let eligible = 0;

  for (let li = 0; li < lines.length; li += 1) {
    const line = lines[li];
    const chars = [...line];
    const parts: string[] = [];
    for (const ch of chars) {
      const start = utf16;
      utf16 += ch.length;
      const cp = ch.codePointAt(0)!;
      if (opts.keepEmoji && isEmojiCodePoint(cp)) {
        parts.push(ch);
        continue;
      }
      if (mask[start]) {
        parts.push(ch);
        continue;
      }
      if (isLetterOrDigit(ch)) {
        eligible += 1;
        mapped += 1;
      }
      parts.push(ch);
    }
    outLines.push(parts.join(gap));
    if (li < lines.length - 1) utf16 += 1; // newline
  }

  const coverage = eligible === 0 ? 1 : mapped / eligible;
  return { text: outLines.join("\n"), coverage, partial: coverage < 1 && eligible > 0 };
}

function combineOn(
  text: string,
  kind: CombiningKind,
  opts: Required<ConvertOptions>,
): ConvertResult {
  // First strip plain spans by mapping only non-plain regions... simpler: apply combining then restore plain spans
  const mask = plainSpanMask(text, opts.keepLinksMentionsHashtags);
  const chars = [...text];
  let utf16 = 0;
  let mapped = 0;
  let eligible = 0;
  const out: string[] = [];

  for (let i = 0; i < chars.length; i += 1) {
    const ch = chars[i];
    const start = utf16;
    utf16 += ch.length;
    const cp = ch.codePointAt(0)!;

    if (ch === "\n" || ch === " " || ch === "\t" || mask[start]) {
      out.push(ch);
      continue;
    }
    if (opts.keepEmoji && isEmojiCodePoint(cp)) {
      out.push(ch);
      continue;
    }

    const piece = applyCombining(ch, kind);
    out.push(piece.text);
    mapped += piece.mapped;
    eligible += piece.eligible;
  }

  const coverage = eligible === 0 ? 1 : mapped / eligible;
  return { text: out.join(""), coverage, partial: coverage < 1 && eligible > 0 };
}

function separatorStyle(text: string, sep: string, opts: Required<ConvertOptions>): ConvertResult {
  return spaceOut(text, sep, opts);
}

function zalgoLight(text: string, opts: Required<ConvertOptions>): ConvertResult {
  const marks = ["\u0300", "\u0301", "\u0302"];
  const mask = plainSpanMask(text, opts.keepLinksMentionsHashtags);
  let utf16 = 0;
  let mapped = 0;
  let eligible = 0;
  const out: string[] = [];
  let mi = 0;

  for (const ch of [...text]) {
    const start = utf16;
    utf16 += ch.length;
    const cp = ch.codePointAt(0)!;
    if (ch === "\n" || ch === " " || mask[start] || (opts.keepEmoji && isEmojiCodePoint(cp))) {
      out.push(ch);
      continue;
    }
    eligible += 1;
    out.push(ch + marks[mi % marks.length]);
    mi += 1;
    mapped += 1;
  }

  const coverage = eligible === 0 ? 1 : mapped / eligible;
  return { text: out.join(""), coverage, partial: false };
}

function upsideDown(text: string, opts: Required<ConvertOptions>): ConvertResult {
  const mask = plainSpanMask(text, opts.keepLinksMentionsHashtags);
  const lines = text.split("\n");
  let offset = 0;
  let mapped = 0;
  let eligible = 0;

  const outLines = lines.map((line, idx) => {
    if (idx > 0) offset += 1;
    const chars = [...line];
    // Pair each code point with its absolute UTF-16 index (O(n))
    const indexed: { ch: string; abs: number }[] = [];
    let u = offset;
    for (const ch of chars) {
      indexed.push({ ch, abs: u });
      u += ch.length;
    }
    offset = u;

    const transformed: string[] = [];
    for (let i = indexed.length - 1; i >= 0; i -= 1) {
      const { ch, abs } = indexed[i];
      const cp = ch.codePointAt(0)!;
      if (mask[abs] || (opts.keepEmoji && isEmojiCodePoint(cp))) {
        transformed.push(ch);
        continue;
      }
      if (isLetterOrDigit(ch)) {
        eligible += 1;
        mapped += 1;
      }
      transformed.push(flipLine(ch));
    }
    return transformed.join("");
  });

  const coverage = eligible === 0 ? 1 : mapped / eligible;
  return { text: outLines.join("\n"), coverage, partial: coverage < 1 && eligible > 0 };
}

function altCaps(text: string, opts: Required<ConvertOptions>): ConvertResult {
  const mask = plainSpanMask(text, opts.keepLinksMentionsHashtags);
  let utf16 = 0;
  let i = 0;
  const out: string[] = [];
  for (const ch of [...text]) {
    const start = utf16;
    utf16 += ch.length;
    const cp = ch.codePointAt(0)!;
    if (mask[start] || (opts.keepEmoji && isEmojiCodePoint(cp)) || ch === "\n") {
      out.push(ch);
      continue;
    }
    if (/[A-Za-z]/.test(ch)) {
      out.push(i % 2 === 0 ? ch.toUpperCase() : ch.toLowerCase());
      i += 1;
    } else {
      out.push(ch);
    }
  }
  return { text: out.join(""), coverage: 1, partial: false };
}

function reverseWords(text: string, opts: Required<ConvertOptions>): ConvertResult {
  const mask = plainSpanMask(text, opts.keepLinksMentionsHashtags);
  // Reverse contiguous letter runs unless inside a plain span
  let utf16 = 0;
  const chars = [...text];
  const out: string[] = [];
  let run: string[] = [];
  let runPlain = false;

  const flush = () => {
    if (!run.length) return;
    out.push(runPlain ? run.join("") : run.reverse().join(""));
    run = [];
  };

  for (const ch of chars) {
    const start = utf16;
    utf16 += ch.length;
    const plain = mask[start];
    if (/[A-Za-z]/.test(ch) && !plain) {
      if (run.length && runPlain) flush();
      runPlain = false;
      run.push(ch);
    } else {
      flush();
      out.push(ch);
      runPlain = false;
    }
  }
  flush();
  void opts;
  return { text: out.join(""), coverage: 1, partial: false };
}

function wrapPlain(text: string, left: string, right: string): ConvertResult {
  if (!text) return { text, coverage: 1, partial: false };
  const result = text
    .split("\n")
    .map((line) => (line ? `${left}${line}${right}` : line))
    .join("\n");
  return { text: result, coverage: 1, partial: false };
}

function frameThen(
  text: string,
  frameId: string,
  inner: (t: string) => ConvertResult,
): ConvertResult {
  const innerRes = inner(text);
  const frame = FRAMES[frameId];
  if (!frame) return innerRes;
  return {
    text: applyFrame(innerRes.text, frame),
    coverage: innerRes.coverage,
    partial: innerRes.partial,
  };
}

function letterResult(
  mapped: { text: string; mapped: number; eligible: number },
): ConvertResult {
  const coverage = mapped.eligible === 0 ? 1 : mapped.mapped / mapped.eligible;
  return {
    text: mapped.text,
    coverage,
    partial: coverage < 0.999 && mapped.eligible > 0,
  };
}

/**
 * Convert plain text into a Unicode style. Pure, synchronous, no I/O.
 */
export function convert(
  text: string,
  styleId: string,
  options: ConvertOptions = {},
): ConvertResult {
  const opts: Required<ConvertOptions> = { ...DEFAULT_OPTIONS, ...options };

  if (!text) return { text: "", coverage: 1, partial: false };
  if (!STYLE_BY_ID[styleId]) {
    return { text, coverage: 1, partial: false };
  }

  const mathTable = MATH_ASCII_TABLES[styleId];
  if (mathTable) return letterResult(mapWithAsciiTable(text, mathTable, opts));
  const specialTable = SPECIAL_ASCII_TABLES[styleId];
  if (specialTable) return letterResult(mapWithAsciiTable(text, specialTable, opts));
  const math = MATH_MAPPERS[styleId];
  if (math) return letterResult(mapWithMapper(text, math, opts));

  switch (styleId) {
    case "plain":
      return { text, coverage: 1, partial: false };
    case "spaced":
      return spaceOut(text, " ", opts);
    case "wide-spaced":
      return spaceOut(text, "  ", opts);
    case "small-caps":
      return letterResult(mapWithMapper(text, SMALL_CAPS_MAP, opts));
    case "fullwidth":
    case "vaporwave":
      return letterResult(mapWithMapper(text, FULLWIDTH, opts));
    case "superscript":
      return letterResult(mapWithMapper(text, SUPERSCRIPT, opts));
    case "subscript":
      return letterResult(mapWithMapper(text, SUBSCRIPT, opts));
    case "circled":
    case "bubble":
      return letterResult(mapWithMapper(text, CIRCLED, opts));
    case "squared":
      return letterResult(mapWithMapper(text, SQUARED, opts));
    case "negative-squared":
      return letterResult(mapWithMapper(text, NEGATIVE_SQUARED, opts));
    case "negative-circled":
      return letterResult(mapWithMapper(text, NEGATIVE_CIRCLED, opts));
    case "parenthesized":
      return letterResult(mapWithMapper(text, PARENTHESIZED, opts));
    case "upside-down":
      return upsideDown(text, opts);
    case "effect-underline":
      return combineOn(text, "underline", opts);
    case "effect-double-underline":
      return combineOn(text, "double-underline", opts);
    case "effect-strikethrough":
      return combineOn(text, "strikethrough", opts);
    case "effect-slash":
    case "mirror-slash":
      return combineOn(text, "slash", opts);
    case "effect-overline":
      return combineOn(text, "overline", opts);
    case "dotted":
      return combineOn(text, "dots-below", opts);
    case "effect-tilde":
      return combineOn(text, "tilde-overlay", opts);
    case "diaeresis":
      return combineOn(text, "diaeresis", opts);
    case "smiley-ring":
      return combineOn(text, "smiley-above", opts);
    case "zalgo-light":
      return zalgoLight(text, opts);
    case "wavey":
      return separatorStyle(text, "≋", opts);
    case "dot-separator":
      return separatorStyle(text, "·", opts);
    case "slash-separator":
      return separatorStyle(text, "/", opts);
    case "comma-separator":
      return separatorStyle(text, ",", opts);
    case "underscore-wrap":
      return wrapPlain(text, "_", "_");
    case "frame-hearts-script":
      return frameThen(text, "frame-hearts", (t) =>
        letterResult(mapWithAsciiTable(t, MATH_ASCII_TABLES["math-script"], opts)),
      );
    case "frame-stars-bold":
      return frameThen(text, "frame-stars", (t) =>
        letterResult(mapWithAsciiTable(t, MATH_ASCII_TABLES["math-bold"], opts)),
      );
    case "frame-sparkles-sans":
      return frameThen(text, "frame-sparkles", (t) =>
        letterResult(mapWithAsciiTable(t, MATH_ASCII_TABLES["math-sans"], opts)),
      );
    case "frame-hearts-bold":
      return frameThen(text, "frame-hearts", (t) =>
        letterResult(mapWithAsciiTable(t, MATH_ASCII_TABLES["math-bold"], opts)),
      );
    case "alt-caps":
      return altCaps(text, opts);
    case "reverse-words":
      return reverseWords(text, opts);
    default: {
      if (FRAMES[styleId]) {
        return {
          text: applyFrame(text, FRAMES[styleId]),
          coverage: 1,
          partial: false,
        };
      }
      // unused import guard
      void BUBBLE;
      return { text, coverage: 1, partial: false };
    }
  }
}
