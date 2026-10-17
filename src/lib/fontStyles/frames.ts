export interface FrameDef {
  left: string;
  right: string;
  /** Optional separator inserted between non-newline characters. */
  between?: string;
}

export const FRAMES: Record<string, FrameDef> = {
  "frame-hearts": { left: "♥ ", right: " ♥" },
  "frame-stars": { left: "★ ", right: " ★" },
  "frame-sparkles": { left: "✦ ", right: " ✦" },
  "frame-brackets": { left: "【", right: "】" },
  "frame-double-brackets": { left: "『", right: "』" },
  "frame-corners": { left: "⌜", right: "⌝" },
  "frame-flowers": { left: "❀ ", right: " ❀" },
  "frame-waves": { left: "≋ ", right: " ≋" },
  "frame-diamonds": { left: "◈ ", right: " ◈" },
  "frame-arrows": { left: "»", right: "«" },
  "frame-paren-stars": { left: "⋆｡˚ ", right: " ˚｡⋆" },
  "frame-box": { left: "▌", right: "▐" },
};

/** Wrap each non-empty line with the frame. */
export function applyFrame(text: string, frame: FrameDef): string {
  if (!text) return text;
  return text
    .split("\n")
    .map((line) => {
      if (!line) return line;
      const body = frame.between
        ? [...line].join(frame.between)
        : line;
      return `${frame.left}${body}${frame.right}`;
    })
    .join("\n");
}
