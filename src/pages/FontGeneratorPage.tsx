import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Link } from "react-router-dom";
import { CopyToast, type ToastState } from "@/components/fontgen/CopyToast";
import { fontBreadcrumbJsonLd } from "@/components/fontgen/breadcrumbJsonLd";
import { FontBreadcrumb } from "@/components/fontgen/FontBreadcrumb";
import { FontHero } from "@/components/fontgen/FontHero";
import { FontInputCard } from "@/components/fontgen/FontInputCard";
import { PhonePreview } from "@/components/fontgen/PhonePreview";
import { StyleGallery } from "@/components/fontgen/StyleGallery";
import { EXAMPLE_TEXT, type FontTarget } from "@/components/fontgen/constants";
import { copyText } from "@/components/fontgen/copyText";
import {
  loadFavoriteIds,
  saveFavoriteIds,
  toggleFavoriteId,
} from "@/components/fontgen/favorites";
import { ToolPageLayout } from "@/components/layout/ToolPageLayout";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";
import { SITE_URL } from "@/content/seo";
import { STYLE_BY_ID, convert, type ConvertOptions } from "@/lib/fontStyles";

const META_TITLE = "Instagram Font Generator";
const META_DESCRIPTION =
  "Style Instagram bio, display name, or caption text with Unicode lettering. Free, no signup — text stays in your browser.";

export default function FontGeneratorPage() {
  const breadcrumbLd = useMemo(() => fontBreadcrumbJsonLd(), []);

  useDocumentMeta({
    title: META_TITLE,
    description: META_DESCRIPTION,
    canonical: `${SITE_URL}/instagram-font-generator`,
    robots: "noindex",
    jsonLd: breadcrumbLd,
    jsonLdId: "fontgen-breadcrumb-jsonld",
  });

  const [rawText, setRawText] = useState("");
  const deferredText = useDeferredValue(rawText);
  const sourceText = deferredText.trim().length > 0 ? deferredText : EXAMPLE_TEXT;

  const [target, setTarget] = useState<FontTarget>("bio");
  const [keepLinks, setKeepLinks] = useState(true);
  const [keepEmoji, setKeepEmoji] = useState(true);
  const [selectedStyleId, setSelectedStyleId] = useState("math-bold");
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() => loadFavoriteIds());
  const [toast, setToast] = useState<ToastState>(null);
  const [stickyCompact, setStickyCompact] = useState(false);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const gallerySentinelRef = useRef<HTMLDivElement>(null);

  const options: ConvertOptions = useMemo(
    () => ({
      keepLinksMentionsHashtags: keepLinks,
      keepEmoji,
    }),
    [keepLinks, keepEmoji],
  );

  const selectedStyle = STYLE_BY_ID[selectedStyleId] ?? STYLE_BY_ID["math-bold"]!;
  const previewResult = useMemo(
    () => convert(sourceText, selectedStyle.id, options),
    [sourceText, selectedStyle.id, options],
  );

  useEffect(() => {
    saveFavoriteIds(favoriteIds);
  }, [favoriteIds]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable) {
        return;
      }
      e.preventDefault();
      inputRef.current?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const sentinel = gallerySentinelRef.current;
    if (!sentinel) return;
    const mq = window.matchMedia("(max-width: 767px)");
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!mq.matches) {
          setStickyCompact(false);
          return;
        }
        setStickyCompact(!entry.isIntersecting);
      },
      { rootMargin: "-80px 0px 0px 0px", threshold: 0 },
    );
    io.observe(sentinel);
    const onMq = () => {
      if (!mq.matches) setStickyCompact(false);
    };
    mq.addEventListener("change", onMq);
    return () => {
      io.disconnect();
      mq.removeEventListener("change", onMq);
    };
  }, []);

  const dismissToast = useCallback(() => setToast(null), []);

  const handleCopy = useCallback(async (style: { id: string; name: string }, text: string) => {
    const ok = await copyText(text);
    if (ok) {
      setToast({ kind: "success", message: `Copied ${style.name}` });
    } else {
      setToast({ kind: "error", message: "Couldn’t copy — try selecting the text manually." });
    }
  }, []);

  const handleFavorite = useCallback((styleId: string) => {
    setFavoriteIds((prev) => toggleFavoriteId(prev, styleId));
  }, []);

  return (
    <ToolPageLayout
      articleSlug="instagram-font-generator"
      toolSlug="instagram-font-generator"
    >
      <div className="mesh-bg fontgen-page">
        <div className="mx-auto max-w-6xl px-4 pb-20 pt-8 sm:px-6 sm:pt-12">
          <FontBreadcrumb />
          <FontHero />

          <p className="mt-4 text-xs text-muted">
            Unicode styling varies by device and app. Not every character is available in every
            style.{" "}
            <Link to="/" className="font-medium text-primary underline-offset-2 hover:underline">
              Back to Unfollow Tracker
            </Link>
          </p>

          <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-start">
            <div className="min-w-0 space-y-8">
              <div ref={gallerySentinelRef}>
                <FontInputCard
                  ref={inputRef}
                  value={rawText}
                  onChange={setRawText}
                  target={target}
                  onTargetChange={setTarget}
                  keepLinks={keepLinks}
                  onKeepLinksChange={setKeepLinks}
                  keepEmoji={keepEmoji}
                  onKeepEmojiChange={setKeepEmoji}
                />
              </div>

              <StyleGallery
                sourceText={sourceText}
                options={options}
                favoriteIds={favoriteIds}
                selectedStyleId={selectedStyle.id}
                onCopy={handleCopy}
                onFavorite={handleFavorite}
                onPreview={setSelectedStyleId}
              />
            </div>

            <div className="lg:sticky lg:top-20">
              <PhonePreview
                styledText={previewResult.text}
                styleName={selectedStyle.name}
                target={target}
                onTargetChange={setTarget}
              />
            </div>
          </div>
        </div>

        {stickyCompact ? (
          <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 p-3 backdrop-blur transition-transform duration-200 md:hidden">
            <FontInputCard
              value={rawText}
              onChange={setRawText}
              target={target}
              onTargetChange={setTarget}
              keepLinks={keepLinks}
              onKeepLinksChange={setKeepLinks}
              keepEmoji={keepEmoji}
              onKeepEmojiChange={setKeepEmoji}
              compact
            />
          </div>
        ) : null}
      </div>
      <CopyToast toast={toast} onDismiss={dismissToast} />
    </ToolPageLayout>
  );
}
