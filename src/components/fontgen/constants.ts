import type { StyleCategory } from "@/lib/fontStyles";

export const EXAMPLE_TEXT =
  "Hello! Check out https://example.com @friend #vibes ✨";

export const FAVORITES_STORAGE_KEY = "igunfollowed-font-favorites";

export type FontTarget = "bio" | "name" | "caption";

export const TARGET_LIMITS: Record<FontTarget, number> = {
  bio: 150,
  name: 64,
  caption: 2200,
};

export const TARGET_LABELS: Record<FontTarget, string> = {
  bio: "Bio",
  name: "Display name",
  caption: "Caption",
};

export const CATEGORIES: StyleCategory[] = [
  "Minimal",
  "Bold",
  "Elegant",
  "Fun lettering",
  "Effects",
  "Frames",
];

/** Count Unicode code points (not UTF-16 code units). */
export function countCodePoints(text: string): number {
  return Array.from(text).length;
}
