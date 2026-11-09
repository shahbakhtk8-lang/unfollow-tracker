import {
  HighlightsApiError,
  type HighlightsApiErrorBody,
  type HighlightsApiSuccessBody,
  type HighlightsErrorCode,
  type HighlightsResult,
} from "./types";

function isErrorBody(value: unknown): value is HighlightsApiErrorBody {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as HighlightsApiErrorBody).ok === false &&
    typeof (value as HighlightsApiErrorBody).code === "string" &&
    typeof (value as HighlightsApiErrorBody).message === "string"
  );
}

/** Browser helper — calls /api/highlights and maps failures to HighlightsApiError. */
export async function requestHighlights(username: string): Promise<HighlightsResult> {
  const url = `/api/highlights?username=${encodeURIComponent(username)}`;
  let response: Response;
  try {
    response = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
    });
  } catch {
    throw new HighlightsApiError(
      "UNKNOWN",
      "Could not reach the highlights service. Check your connection and try again.",
      503,
    );
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new HighlightsApiError("UNKNOWN", "Unexpected response from the server.", 502);
  }

  if (!response.ok || isErrorBody(body)) {
    if (isErrorBody(body)) {
      throw new HighlightsApiError(body.code, body.message, response.status);
    }
    throw new HighlightsApiError(
      "UNKNOWN" satisfies HighlightsErrorCode,
      "Something went wrong loading Highlights.",
      response.status,
    );
  }

  const success = body as HighlightsApiSuccessBody;
  if (!success.ok || !success.data) {
    throw new HighlightsApiError("UNKNOWN", "Unexpected response from the server.", 502);
  }
  return success.data;
}
