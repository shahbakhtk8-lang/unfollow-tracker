export type SymbolGroup = "Dividers" | "Bullets" | "Hearts and stars" | "Arrows";

export interface SymbolItem {
  id: string;
  glyph: string;
  group: SymbolGroup;
  label: string;
}

/** Compact tray of copyable decorations (~40 items). */
export const SYMBOL_ITEMS: SymbolItem[] = [
  { id: "div-dots", glyph: "\u00B7\u00B7\u00B7\u00B7\u00B7\u00B7", group: "Dividers", label: "Dot divider" },
  { id: "div-dash", glyph: "\u2014\u2014\u2014\u2014\u2014", group: "Dividers", label: "Dash divider" },
  { id: "div-wave", glyph: "\u301C\u301C\u301C\u301C\u301C", group: "Dividers", label: "Wave divider" },
  { id: "div-starline", glyph: "\u22C6\uFF61\u02DA\u22C6\uFF61\u02DA\u22C6", group: "Dividers", label: "Star line" },
  { id: "div-heartline", glyph: "\u2665 \u2665 \u2665", group: "Dividers", label: "Heart line" },
  { id: "div-tilde", glyph: "~~~~~", group: "Dividers", label: "Tilde divider" },
  { id: "div-equals", glyph: "\u2550\u2550\u2550\u2550\u2550", group: "Dividers", label: "Double line" },
  { id: "div-sparks", glyph: "\u2726 \u00B7 \u2726 \u00B7 \u2726", group: "Dividers", label: "Spark divider" },
  { id: "div-flower", glyph: "\u2740 \u2014\u2014\u2014 \u2740", group: "Dividers", label: "Flower divider" },
  { id: "div-slash", glyph: "\u2044\u2044\u2044\u2044\u2044", group: "Dividers", label: "Slash divider" },

  { id: "bul-dot", glyph: "\u2022", group: "Bullets", label: "Bullet" },
  { id: "bul-hollow", glyph: "\u25E6", group: "Bullets", label: "Hollow bullet" },
  { id: "bul-tri", glyph: "\u25B9", group: "Bullets", label: "Triangle bullet" },
  { id: "bul-diamond", glyph: "\u25C6", group: "Bullets", label: "Diamond" },
  { id: "bul-square", glyph: "\u25AA", group: "Bullets", label: "Square bullet" },
  { id: "bul-dash", glyph: "\u2013", group: "Bullets", label: "En dash" },
  { id: "bul-arrow", glyph: "\u27A2", group: "Bullets", label: "Arrow bullet" },
  { id: "bul-check", glyph: "\u2713", group: "Bullets", label: "Check" },
  { id: "bul-star", glyph: "\u22C6", group: "Bullets", label: "Star bullet" },
  { id: "bul-flower", glyph: "\u273F", group: "Bullets", label: "Flower bullet" },

  { id: "hs-heart", glyph: "\u2665", group: "Hearts and stars", label: "Heart" },
  { id: "hs-white-heart", glyph: "\u2661", group: "Hearts and stars", label: "White heart" },
  { id: "hs-sparkle", glyph: "\u2728", group: "Hearts and stars", label: "Sparkles" },
  { id: "hs-star", glyph: "\u2605", group: "Hearts and stars", label: "Star" },
  { id: "hs-star-outline", glyph: "\u2606", group: "Hearts and stars", label: "Star outline" },
  { id: "hs-spark", glyph: "\u2726", group: "Hearts and stars", label: "Spark" },
  { id: "hs-diamond", glyph: "\u25C7", group: "Hearts and stars", label: "Diamond outline" },
  { id: "hs-flower", glyph: "\u2740", group: "Hearts and stars", label: "Flower" },
  { id: "hs-music", glyph: "\u266A", group: "Hearts and stars", label: "Music note" },
  { id: "hs-sun", glyph: "\u263C", group: "Hearts and stars", label: "Sun" },

  { id: "ar-right", glyph: "\u2192", group: "Arrows", label: "Right arrow" },
  { id: "ar-left", glyph: "\u2190", group: "Arrows", label: "Left arrow" },
  { id: "ar-up", glyph: "\u2191", group: "Arrows", label: "Up arrow" },
  { id: "ar-down", glyph: "\u2193", group: "Arrows", label: "Down arrow" },
  { id: "ar-dright", glyph: "\u21D2", group: "Arrows", label: "Double right" },
  { id: "ar-long", glyph: "\u27F6", group: "Arrows", label: "Long right" },
  { id: "ar-hook", glyph: "\u21AA", group: "Arrows", label: "Hook arrow" },
  { id: "ar-exchange", glyph: "\u21C4", group: "Arrows", label: "Exchange" },
  { id: "ar-heavy", glyph: "\u279C", group: "Arrows", label: "Heavy arrow" },
  { id: "ar-chevron", glyph: "\u203A", group: "Arrows", label: "Chevron" },
];

export const SYMBOL_GROUPS: SymbolGroup[] = [
  "Dividers",
  "Bullets",
  "Hearts and stars",
  "Arrows",
];
