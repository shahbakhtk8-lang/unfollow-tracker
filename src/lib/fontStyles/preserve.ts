/** Detects characters we should leave plain when the matching option is on. */

const URL_RE = /https?:\/\/[^\s]+/gi;
const MENTION_RE = /@[A-Za-z0-9._]+/g;
const HASHTAG_RE = /#[\p{L}\p{N}_]+/gu;

/** Rough emoji / pictograph / ZWJ sequence detector (keep plain when asked). */
export function isEmojiCodePoint(cp: number): boolean {
  return (
    (cp >= 0x1f300 && cp <= 0x1faff) ||
    (cp >= 0x2600 && cp <= 0x27bf) ||
    (cp >= 0x1f000 && cp <= 0x1f2ff) ||
    cp === 0x200d ||
    cp === 0xfe0f ||
    (cp >= 0x1f1e6 && cp <= 0x1f1ff)
  );
}

export function isCombiningMark(cp: number): boolean {
  return (
    (cp >= 0x0300 && cp <= 0x036f) ||
    (cp >= 0x1ab0 && cp <= 0x1aff) ||
    (cp >= 0x20d0 && cp <= 0x20ff)
  );
}

/**
 * Build a boolean mask: true = leave this UTF-16 index plain (part of URL/@/#).
 * Fast path when disabled: empty sentinel (caller checks enabled flag first).
 */
let cachedText: string | null = null;
let cachedMask: boolean[] = [];

export function plainSpanMask(text: string, enabled: boolean): boolean[] {
  if (!enabled || text.length === 0) {
    return EMPTY_MASK;
  }
  // Fast reject when nothing preservable can appear
  if (!text.includes("@") && !text.includes("#") && !text.includes("http")) {
    return EMPTY_MASK;
  }
  if (cachedText === text) return cachedMask;

  const mask = new Array<boolean>(text.length);
  const mark = (re: RegExp) => {
    re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text))) {
      const end = m.index + m[0].length;
      for (let i = m.index; i < end; i += 1) mask[i] = true;
    }
  };

  mark(URL_RE);
  mark(MENTION_RE);
  mark(HASHTAG_RE);
  cachedText = text;
  cachedMask = mask;
  return mask;
}

const EMPTY_MASK: boolean[] = [];
