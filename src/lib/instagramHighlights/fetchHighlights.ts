import { fetchHighlightsFromApify, type FetchHighlightsOptions } from "./apify";
import { buildMockHighlights } from "./mockData";
import { parseInstagramUsername } from "./parseUsername";
import { HighlightsApiError, type HighlightsResult } from "./types";

/**
 * THE ONLY place that should call an external Instagram data provider.
 *
 * When `options.apifyToken` is set (passed from api/highlights.ts / Vite middleware
 * via process.env.APIFY_TOKEN), calls Apify actor seemuapps/instagram-highlights-scraper.
 * When the token is missing, falls back to the local mock so UI/dev/tests still work.
 */
export async function fetchInstagramHighlights(
  rawUsername: string,
  options: FetchHighlightsOptions = {},
): Promise<HighlightsResult> {
  const username = parseInstagramUsername(rawUsername);
  if (!username) {
    throw new HighlightsApiError(
      "INVALID_USERNAME",
      "Enter a valid Instagram username or profile link.",
      400,
    );
  }

  const token = options.apifyToken?.trim();
  if (token) {
    return fetchHighlightsFromApify(username, token);
  }

  return fetchMockHighlights(username);
}

/** Deterministic mock paths for local/dev without APIFY_TOKEN. */
async function fetchMockHighlights(username: string): Promise<HighlightsResult> {
  await delay(280);

  if (username === "private" || username === "private_user") {
    throw new HighlightsApiError(
      "PRIVATE_ACCOUNT",
      "This account is private. Highlights are only available for public profiles.",
      403,
    );
  }
  if (username === "notfound" || username === "missing_user") {
    throw new HighlightsApiError(
      "NOT_FOUND",
      "No Instagram account found for that username.",
      404,
    );
  }
  if (username === "ratelimit" || username === "rate_limited") {
    throw new HighlightsApiError(
      "RATE_LIMITED",
      "Too many requests right now. Please try again in a minute.",
      429,
    );
  }
  if (username === "empty" || username === "nohighlights") {
    throw new HighlightsApiError(
      "NO_HIGHLIGHTS",
      "This account has no Highlights to show.",
      404,
    );
  }

  return buildMockHighlights(username);
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
