import {
  fetchInstagramHighlights,
  HighlightsApiError,
  type HighlightsApiErrorBody,
  type HighlightsApiSuccessBody,
} from "../../src/lib/instagramHighlights/index";

type PagesEnv = {
  APIFY_TOKEN?: string;
};

type PagesContext = {
  request: Request;
  env: PagesEnv;
};

/** Cloudflare Pages Function — GET /api/highlights?username=... */
export async function onRequestGet(context: PagesContext): Promise<Response> {
  const username = new URL(context.request.url).searchParams.get("username") ?? "";
  // Server-only secret from Cloudflare Pages → Settings → Environment variables
  const apifyToken = context.env.APIFY_TOKEN;

  try {
    const data = await fetchInstagramHighlights(username, { apifyToken });
    return json(200, { ok: true, data } satisfies HighlightsApiSuccessBody);
  } catch (error) {
    if (error instanceof HighlightsApiError) {
      return json(error.status, {
        ok: false,
        code: error.code,
        message: error.message,
      } satisfies HighlightsApiErrorBody);
    }
    return json(500, {
      ok: false,
      code: "UNKNOWN",
      message: "Something went wrong loading Highlights.",
    } satisfies HighlightsApiErrorBody);
  }
}

export async function onRequest(context: PagesContext): Promise<Response> {
  if (context.request.method !== "GET") {
    return json(405, {
      ok: false,
      code: "UNKNOWN",
      message: "Method not allowed.",
    } satisfies HighlightsApiErrorBody);
  }
  return onRequestGet(context);
}

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
