import type { IncomingMessage, ServerResponse } from "node:http";
import {
  fetchInstagramHighlights,
  HighlightsApiError,
  type HighlightsApiErrorBody,
  type HighlightsApiSuccessBody,
} from "../src/lib/instagramHighlights/index";

type VercelRequest = IncomingMessage & {
  method?: string;
  query?: Record<string, string | string[] | undefined>;
  url?: string;
};

type VercelResponse = ServerResponse & {
  status: (code: number) => VercelResponse;
  json: (body: unknown) => void;
};

function readUsername(req: VercelRequest): string {
  const fromQuery = req.query?.username;
  if (typeof fromQuery === "string") return fromQuery;
  if (Array.isArray(fromQuery) && typeof fromQuery[0] === "string") return fromQuery[0];
  if (req.url) {
    try {
      const url = new URL(req.url, "http://localhost");
      return url.searchParams.get("username") ?? "";
    } catch {
      return "";
    }
  }
  return "";
}

function sendJson(res: VercelResponse, status: number, body: unknown): void {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(body));
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method && req.method !== "GET") {
    sendJson(res, 405, {
      ok: false,
      code: "UNKNOWN",
      message: "Method not allowed.",
    } satisfies HighlightsApiErrorBody);
    return;
  }

  try {
    // Server-only — never expose APIFY_TOKEN to the browser bundle.
    const apifyToken = process.env.APIFY_TOKEN;
    const data = await fetchInstagramHighlights(readUsername(req), { apifyToken });
    sendJson(res, 200, { ok: true, data } satisfies HighlightsApiSuccessBody);
  } catch (error) {
    if (error instanceof HighlightsApiError) {
      sendJson(res, error.status, {
        ok: false,
        code: error.code,
        message: error.message,
      } satisfies HighlightsApiErrorBody);
      return;
    }
    sendJson(res, 500, {
      ok: false,
      code: "UNKNOWN",
      message: "Something went wrong loading Highlights.",
    } satisfies HighlightsApiErrorBody);
  }
}
