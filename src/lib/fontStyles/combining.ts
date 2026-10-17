import { isCombiningMark, isEmojiCodePoint } from "./preserve";

export type CombiningKind =
  | "underline"
  | "double-underline"
  | "strikethrough"
  | "slash"
  | "overline"
  | "dots-below"
  | "tilde-overlay"
  | "diaeresis"
  | "smiley-above";

const MARKS: Record<CombiningKind, string> = {
  underline: "\u0332",
  "double-underline": "\u0333",
  strikethrough: "\u0336",
  slash: "\u0338",
  overline: "\u0305",
  "dots-below": "\u0324",
  "tilde-overlay": "\u0334",
  diaeresis: "\u0308",
  "smiley-above": "\u030A",
};

/**
 * Apply a combining mark after each base character, skipping spaces, newlines,
 * emoji, and characters that already carry combining marks.
 */
export function applyCombining(
  text: string,
  kind: CombiningKind,
): { text: string; mapped: number; eligible: number } {
  const mark = MARKS[kind];
  const chars = [...text];
  let mapped = 0;
  let eligible = 0;
  const out: string[] = [];

  for (let i = 0; i < chars.length; i += 1) {
    const ch = chars[i];
    const cp = ch.codePointAt(0)!;

    if (ch === "\n" || ch === " " || ch === "\t") {
      out.push(ch);
      continue;
    }
    if (isEmojiCodePoint(cp) || isCombiningMark(cp)) {
      out.push(ch);
      continue;
    }

    const next = chars[i + 1];
    if (next && isCombiningMark(next.codePointAt(0)!)) {
      out.push(ch);
      continue;
    }

    eligible += 1;
    out.push(ch + mark);
    mapped += 1;
  }

  return { text: out.join(""), mapped, eligible };
}
