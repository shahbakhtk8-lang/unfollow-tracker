import type { Plugin } from "vite";
import { loadEnv } from "vite";
import {
  fetchInstagramHighlights,
  HighlightsApiError,
  type HighlightsApiErrorBody,
  type HighlightsApiSuccessBody,
} from "./src/lib/instagramHighlights/index";

/** Local `/api/highlights` for `vite` / `vite preview` — mirrors `api/highlights.ts` on Vercel. */
export function highlightsApiPlugin(): Plugin {
  return {
    name: "highlights-api",
    configureServer(server) {
      const env = loadEnv(server.config.mode, server.config.root, "");
      server.middlewares.use(createHighlightsMiddleware(env.APIFY_TOKEN));
    },
    configurePreviewServer(server) {
      const env = loadEnv(server.config.mode, process.cwd(), "");
      server.middlewares.use(createHighlightsMiddleware(env.APIFY_TOKEN));
    },
  };
}

function createHighlightsMiddleware(apifyToken: string | undefined) {
  return (
    req: { method?: string; url?: string },
    res: {
      statusCode: number;
      setHeader: (name: string, value: string) => void;
      end: (body?: string) => void;
    },
    next: () => void,
  ) => {
    if (!req.url?.startsWith("/api/highlights")) {
      next();
      return;
    }
    if (req.method && req.method !== "GET") {
      writeJson(res, 405, {
        ok: false,
        code: "UNKNOWN",
        message: "Method not allowed.",
      } satisfies HighlightsApiErrorBody);
      return;
    }

    void (async () => {
      try {
        const url = new URL(req.url ?? "/", "http://localhost");
        const username = url.searchParams.get("username") ?? "";
        const data = await fetchInstagramHighlights(username, { apifyToken });
        writeJson(res, 200, { ok: true, data } satisfies HighlightsApiSuccessBody);
      } catch (error) {
        if (error instanceof HighlightsApiError) {
          writeJson(res, error.status, {
            ok: false,
            code: error.code,
            message: error.message,
          } satisfies HighlightsApiErrorBody);
          return;
        }
        writeJson(res, 500, {
          ok: false,
          code: "UNKNOWN",
          message: "Something went wrong loading Highlights.",
        } satisfies HighlightsApiErrorBody);
      }
    })();
  };
}

function writeJson(
  res: {
    statusCode: number;
    setHeader: (name: string, value: string) => void;
    end: (body?: string) => void;
  },
  status: number,
  body: unknown,
): void {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(body));
}
