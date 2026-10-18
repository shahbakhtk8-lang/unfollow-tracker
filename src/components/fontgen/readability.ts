import { plainSpanMask } from "@/lib/fontStyles/preserve";
import type { FontTarget } from "./constants";

const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/;
const PHONE_RE = /(?:\+?\d[\d\s().-]{7,}\d)/;
const URL_RE = /https?:\/\/|[A-Za-z0-9-]+\.[A-Za-z]{2,}(?:\/\S*)?/i;

export function hasContactLikeDetails(text: string): boolean {
  if (!text.trim()) return false;
  return EMAIL_RE.test(text) || PHONE_RE.test(text) || URL_RE.test(text);
}

/**
 * Share of letters (A–Z / a–z) that would be candidates for styling
 * under keepLinksMentionsHashtags (plain spans excluded).
 */
export function styledLetterShare(text: string, keepLinksMentionsHashtags = true): number {
  if (!text) return 0;
  const mask = plainSpanMask(text, keepLinksMentionsHashtags);
  let letters = 0;
  let stylable = 0;
  let i = 0;
  for (const ch of text) {
    const start = i;
    i += ch.length;
    if (!/[A-Za-z]/.test(ch)) continue;
    letters += 1;
    if (!mask[start]) stylable += 1;
  }
  if (letters === 0) return 0;
  return stylable / letters;
}

export function shouldShowReadabilityHint(
  text: string,
  target: FontTarget,
  keepLinksMentionsHashtags = true,
): boolean {
  if (target !== "bio" && target !== "name") return false;
  if (!text.trim()) return false;
  if (hasContactLikeDetails(text)) return true;
  return styledLetterShare(text, keepLinksMentionsHashtags) > 0.4;
}

export const READABILITY_HINT =
  "Screen readers may spell out styled letters. Keep key details like links and contact info in plain text.";
