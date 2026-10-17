export type StyleCategory =
  | "Minimal"
  | "Bold"
  | "Elegant"
  | "Fun lettering"
  | "Effects"
  | "Frames";

/** high = widely supported in IG bio/captions; medium = often works but may degrade on some clients */
export type StyleCompatibility = "high" | "medium";

export interface ConvertOptions {
  /** Keep http(s) URLs, @mentions, and #hashtags in plain ASCII (default true). */
  keepLinksMentionsHashtags?: boolean;
  /** Leave emoji sequences unstyled (default true). */
  keepEmoji?: boolean;
}

export interface StyleMeta {
  id: string;
  name: string;
  category: StyleCategory;
  compatibility: StyleCompatibility;
  /** Why this compatibility rating was chosen. */
  compatibilityNote: string;
}

export interface ConvertResult {
  text: string;
  /** 0–1 share of letter/digit code points that were mapped. */
  coverage: number;
  partial: boolean;
}
