import { HighlightsApiError, type HighlightStory, type HighlightTray, type HighlightsResult } from "./types";

const APIFY_ACTOR_PATH = "seemuapps~instagram-highlights-scraper";

type ApifyStoryItem = {
  id?: string;
  mediaType?: string;
  imageUrl?: string;
  videoUrl?: string;
  timestamp?: number;
};

type ApifyHighlightItem = {
  username?: string;
  highlightId?: string;
  title?: string;
  coverUrl?: string;
  stories?: ApifyStoryItem[];
  error?: string;
  message?: string;
};

export type FetchHighlightsOptions = {
  /** Server-only Apify token. When omitted, callers should use the mock provider. */
  apifyToken?: string;
};

/** Map Apify dataset items into the UI HighlightTray shape. */
export function mapApifyItemsToResult(
  username: string,
  items: ApifyHighlightItem[],
): HighlightsResult {
  const trays: HighlightTray[] = [];

  for (const item of items) {
    const title = (item.title ?? "").trim() || "Highlight";
    const id = String(item.highlightId ?? title);
    const coverUrl = item.coverUrl?.trim() ?? "";
    const stories: HighlightStory[] = [];

    for (const [index, story] of (item.stories ?? []).entries()) {
      const isVideo = (story.mediaType ?? "").toLowerCase() === "video" && Boolean(story.videoUrl);
      const mediaUrl = (isVideo ? story.videoUrl : story.imageUrl)?.trim();
      if (!mediaUrl) continue;
      stories.push({
        id: String(story.id ?? `${id}-${String(index)}`),
        type: isVideo ? "video" : "image",
        mediaUrl,
        thumbnailUrl: story.imageUrl?.trim() || undefined,
        takenAt:
          typeof story.timestamp === "number" && Number.isFinite(story.timestamp)
            ? new Date(story.timestamp * 1000).toISOString()
            : undefined,
      });
    }

    if (!coverUrl && stories.length === 0) continue;
    trays.push({
      id,
      title,
      coverUrl: coverUrl || stories[0]?.thumbnailUrl || stories[0]?.mediaUrl || "",
      stories,
    });
  }

  if (trays.length === 0) {
    throw new HighlightsApiError(
      "NO_HIGHLIGHTS",
      "This account has no Highlights to show.",
      404,
    );
  }

  return { username, highlights: trays };
}

function messageLooksPrivate(text: string): boolean {
  return /private|not\s+authorized|forbidden/i.test(text);
}

function messageLooksNotFound(text: string): boolean {
  return /not\s+found|doesn't exist|does not exist|unknown user|no user/i.test(text);
}

/**
 * Call Apify run-sync-get-dataset-items for seemuapps/instagram-highlights-scraper.
 * Input schema field: `usernames` (string[]).
 */
export async function fetchHighlightsFromApify(
  username: string,
  apifyToken: string,
): Promise<HighlightsResult> {
  const url = new URL(
    `https://api.apify.com/v2/actors/${APIFY_ACTOR_PATH}/run-sync-get-dataset-items`,
  );
  url.searchParams.set("token", apifyToken);

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        usernames: [username],
        maxHighlightsPerUser: 0,
      }),
    });
  } catch {
    throw new HighlightsApiError(
      "UNKNOWN",
      "Could not reach the Highlights provider. Please try again.",
      503,
    );
  }

  if (response.status === 429) {
    throw new HighlightsApiError(
      "RATE_LIMITED",
      "Too many requests right now. Please try again in a minute.",
      429,
    );
  }

  const rawText = await response.text();
  let payload: unknown;
  try {
    payload = rawText ? JSON.parse(rawText) : null;
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const errText =
      typeof payload === "object" && payload !== null
        ? JSON.stringify(payload)
        : rawText.slice(0, 500);
    if (messageLooksPrivate(errText)) {
      throw new HighlightsApiError(
        "PRIVATE_ACCOUNT",
        "This account is private. Highlights are only available for public profiles.",
        403,
      );
    }
    if (messageLooksNotFound(errText)) {
      throw new HighlightsApiError(
        "NOT_FOUND",
        "No Instagram account found for that username.",
        404,
      );
    }
    if (response.status === 401 || response.status === 403) {
      throw new HighlightsApiError(
        "UNKNOWN",
        "Highlights provider authentication failed. Check APIFY_TOKEN.",
        response.status,
      );
    }
    throw new HighlightsApiError(
      "UNKNOWN",
      "Something went wrong loading Highlights from the provider.",
      response.status >= 400 ? response.status : 502,
    );
  }

  if (!Array.isArray(payload)) {
    throw new HighlightsApiError("UNKNOWN", "Unexpected response from the Highlights provider.", 502);
  }

  const items = payload as ApifyHighlightItem[];
  if (items.length === 0) {
    throw new HighlightsApiError(
      "NO_HIGHLIGHTS",
      "This account has no Highlights to show.",
      404,
    );
  }

  const combinedError = items
    .map((item) => `${item.error ?? ""} ${item.message ?? ""}`)
    .join(" ");
  if (messageLooksPrivate(combinedError)) {
    throw new HighlightsApiError(
      "PRIVATE_ACCOUNT",
      "This account is private. Highlights are only available for public profiles.",
      403,
    );
  }
  if (messageLooksNotFound(combinedError)) {
    throw new HighlightsApiError(
      "NOT_FOUND",
      "No Instagram account found for that username.",
      404,
    );
  }

  return mapApifyItemsToResult(username, items);
}
