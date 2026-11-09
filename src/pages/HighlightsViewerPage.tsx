import { useState, type FormEvent } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { HighlightsGrid } from "@/components/highlights/HighlightsGrid";
import { HighlightViewer } from "@/components/highlights/HighlightViewer";
import { ToolPageLayout } from "@/components/layout/ToolPageLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SITE_URL } from "@/content/seo";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";
import { requestHighlights } from "@/lib/instagramHighlights/client";
import {
  HighlightsApiError,
  type HighlightTray,
  type HighlightsResult,
} from "@/lib/instagramHighlights";

const META_TITLE = "Instagram Highlights Viewer: View & Download Free (No Login)";
const META_DESCRIPTION =
  "Free Instagram Highlights viewer — open any public profile’s Highlights anonymously, step through stories, and download photos or videos. No Instagram login required.";
const FEATURED_IMAGE_PATH = "/images/instagram-highlights-viewer-featured.webp";
const FEATURED_IMAGE_ALT =
  "Instagram Highlights Viewer — browse public highlight covers and download stories without login";
const FEATURED_IMAGE_WIDTH = 1280;
const FEATURED_IMAGE_HEIGHT = 720;

export default function HighlightsViewerPage() {
  useDocumentMeta({
    title: META_TITLE,
    description: META_DESCRIPTION,
    canonical: `${SITE_URL}/instagram-highlights-viewer`,
    image: `${SITE_URL}${FEATURED_IMAGE_PATH}`,
    imageAlt: FEATURED_IMAGE_ALT,
    imageWidth: FEATURED_IMAGE_WIDTH,
    imageHeight: FEATURED_IMAGE_HEIGHT,
  });

  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<HighlightsResult | null>(null);
  const [activeTray, setActiveTray] = useState<HighlightTray | null>(null);
  const [storyIndex, setStoryIndex] = useState(0);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    setActiveTray(null);
    try {
      const data = await requestHighlights(query);
      setResult(data);
    } catch (err) {
      const message =
        err instanceof HighlightsApiError
          ? err.message
          : "Something went wrong loading Highlights.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const openTray = (tray: HighlightTray) => {
    setActiveTray(tray);
    setStoryIndex(0);
  };

  return (
    <ToolPageLayout
      articleSlug="instagram-highlights-viewer"
      toolSlug="instagram-highlights-viewer"
      articleFeaturedImage={{
        src: FEATURED_IMAGE_PATH,
        alt: FEATURED_IMAGE_ALT,
        width: FEATURED_IMAGE_WIDTH,
        height: FEATURED_IMAGE_HEIGHT,
      }}
    >
      <div className="mesh-bg">
        <section className="relative overflow-hidden px-4 pb-12 pt-12 sm:px-6 sm:pt-20">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-32 top-10 h-96 w-96 rounded-full bg-primary/20 blur-3xl"
          />
          <div className="mx-auto max-w-3xl text-center">
            <p className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
              Free · No login
            </p>
            <h1 className="font-display text-3xl font-extrabold leading-[1.15] tracking-tight sm:text-4xl lg:text-5xl">
              Instagram{" "}
              <span className="bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
                Highlights Viewer
              </span>
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-lg text-muted">
              Paste a public Instagram username or profile link to browse Highlights, step through
              stories, and download photos — without signing in.
            </p>

            <form
              onSubmit={(e) => void onSubmit(e)}
              className="mx-auto mt-8 flex w-full max-w-xl flex-col gap-3 sm:flex-row"
            >
              <label className="sr-only" htmlFor="highlights-username">
                Instagram username or profile link
              </label>
              <Input
                id="highlights-username"
                name="username"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="@username or instagram.com/username"
                autoComplete="off"
                spellCheck={false}
                disabled={loading}
                className="sm:flex-1"
              />
              <Button type="submit" size="lg" disabled={loading || query.trim().length === 0}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    Loading…
                  </>
                ) : (
                  "View Highlights"
                )}
              </Button>
            </form>
            <p className="mt-3 text-xs text-muted">
              Try <span className="font-medium text-foreground">demo</span> for sample data, or{" "}
              <span className="font-medium text-foreground">private</span> /{" "}
              <span className="font-medium text-foreground">notfound</span> /{" "}
              <span className="font-medium text-foreground">empty</span> /{" "}
              <span className="font-medium text-foreground">ratelimit</span> to preview error states.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
          {loading ? (
            <div
              className="flex min-h-40 flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-card p-8 text-sm text-muted"
              role="status"
              aria-live="polite"
            >
              <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden />
              Fetching Highlights…
            </div>
          ) : null}

          {!loading && error ? (
            <div
              className="rounded-2xl border border-danger/30 bg-danger/5 px-5 py-4 text-sm text-foreground"
              role="alert"
            >
              <p className="font-display font-semibold text-danger">Couldn’t load Highlights</p>
              <p className="mt-1 text-muted">{error}</p>
            </div>
          ) : null}

          {!loading && result ? (
            <HighlightsGrid
              username={result.username}
              highlights={result.highlights}
              onSelect={openTray}
            />
          ) : null}
        </section>
      </div>

      {activeTray ? (
        <HighlightViewer
          tray={activeTray}
          index={storyIndex}
          onIndexChange={setStoryIndex}
          onClose={() => setActiveTray(null)}
        />
      ) : null}
    </ToolPageLayout>
  );
}
