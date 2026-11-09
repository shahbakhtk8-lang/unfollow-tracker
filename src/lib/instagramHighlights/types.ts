export type HighlightMediaType = "image" | "video";

export type HighlightStory = {
  id: string;
  type: HighlightMediaType;
  /** Absolute or data URL for the full media */
  mediaUrl: string;
  /** Optional poster/thumbnail for videos */
  thumbnailUrl?: string;
  takenAt?: string;
};

export type HighlightTray = {
  id: string;
  title: string;
  coverUrl: string;
  stories: HighlightStory[];
};

export type HighlightsResult = {
  username: string;
  highlights: HighlightTray[];
};

export type HighlightsErrorCode =
  | "INVALID_USERNAME"
  | "NOT_FOUND"
  | "PRIVATE_ACCOUNT"
  | "NO_HIGHLIGHTS"
  | "RATE_LIMITED"
  | "UNKNOWN";

export class HighlightsApiError extends Error {
  readonly code: HighlightsErrorCode;
  readonly status: number;

  constructor(code: HighlightsErrorCode, message: string, status: number) {
    super(message);
    this.name = "HighlightsApiError";
    this.code = code;
    this.status = status;
  }
}

export type HighlightsApiErrorBody = {
  ok: false;
  code: HighlightsErrorCode;
  message: string;
};

export type HighlightsApiSuccessBody = {
  ok: true;
  data: HighlightsResult;
};
