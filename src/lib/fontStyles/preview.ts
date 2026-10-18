import { convert } from "./convert";
import type { ConvertOptions, ConvertResult } from "./types";

/** Max code points converted for gallery / card previews. */
export const PREVIEW_CODE_POINTS = 300;

/** Slice text to the first N Unicode code points (keeps emoji pairs intact). */
export function sliceForPreview(text: string, maxCodePoints = PREVIEW_CODE_POINTS): string {
  if (!text) return text;
  const chars = [...text];
  if (chars.length <= maxCodePoints) return text;
  return chars.slice(0, maxCodePoints).join("");
}

/** Convert only a preview slice — for gallery cards. */
export function convertPreview(
  text: string,
  styleId: string,
  options?: ConvertOptions,
): ConvertResult {
  return convert(sliceForPreview(text), styleId, options);
}

/** Full conversion for Copy / phone preview. */
export function convertFull(
  text: string,
  styleId: string,
  options?: ConvertOptions,
): ConvertResult {
  return convert(text, styleId, options);
}
