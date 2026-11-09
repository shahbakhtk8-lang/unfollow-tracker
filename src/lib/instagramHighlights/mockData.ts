import type { HighlightTray, HighlightsResult } from "./types";

/** Tiny SVG data URLs — same-origin friendly, no external network. */
function svgDataUrl(label: string, fill: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="640" viewBox="0 0 640 640"><rect width="640" height="640" fill="${fill}"/><text x="320" y="330" text-anchor="middle" fill="#fff" font-family="system-ui,sans-serif" font-size="42" font-weight="700">${label}</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function tray(
  id: string,
  title: string,
  fill: string,
  storyCount: number,
): HighlightTray {
  const coverUrl = svgDataUrl(title, fill);
  return {
    id,
    title,
    coverUrl,
    stories: Array.from({ length: storyCount }, (_, i) => ({
      id: `${id}-story-${String(i + 1)}`,
      type: "image" as const,
      mediaUrl: svgDataUrl(`${title} ${String(i + 1)}`, fill),
      takenAt: new Date(Date.UTC(2026, 9, i + 1)).toISOString(),
    })),
  };
}

/** Deterministic mock trays used until a real provider is wired. */
export function buildMockHighlights(username: string): HighlightsResult {
  return {
    username,
    highlights: [
      tray("travel", "Travel", "#4f46e5", 3),
      tray("food", "Food", "#7c3aed", 2),
      tray("behind", "BTS", "#2563eb", 4),
    ],
  };
}
