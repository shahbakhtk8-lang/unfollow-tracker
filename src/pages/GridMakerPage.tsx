import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LayoutGrid, Loader2 } from "lucide-react";
import { CropStage } from "@/components/gridmaker/CropStage";
import { ImageDropzone } from "@/components/gridmaker/ImageDropzone";
import { gridMakerJsonLd } from "@/components/gridmaker/jsonLd";
import { OptionPills } from "@/components/gridmaker/OptionPills";
import { ProfilePreview } from "@/components/gridmaker/ProfilePreview";
import { ToolPageLayout } from "@/components/layout/ToolPageLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SITE_URL } from "@/content/seo";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";
import {
  DEFAULT_TRANSFORM,
  MAX_CAROUSEL_SLIDES,
  MIN_CAROUSEL_SLIDES,
  buildTilesZip,
  clampCarouselSlides,
  createSampleGridFile,
  decodeGridImage,
  downloadBlob,
  exportZipName,
  releaseGridImage,
  renderAllTileBlobs,
  tilesInPostingOrder,
  type CoverTransform,
  type GridImageSource,
  type GridMode,
  type ProfileLayout,
  type TileShape,
} from "@/lib/instagramGrid";

const META_TITLE = "Instagram Grid Maker: Split Photos for Profile & Carousel";
const META_DESCRIPTION =
  "Free Instagram grid maker — split one photo into a 3×3 profile grid or a swipeable carousel. Preview the real 3:4 thumbnail crop, then download tiles. No login, no upload.";
const FEATURED_IMAGE_PATH = "/images/instagram-grid-maker-featured.jpg";
const FEATURED_IMAGE_ALT =
  "Instagram Grid Maker — split one photo into a 3:4 profile grid or carousel, free, no login";
const FEATURED_IMAGE_WIDTH = 1280;
const FEATURED_IMAGE_HEIGHT = 720;
const STICKY_BAR_HEIGHT_VAR = "--grid-sticky-bar-height";
const PREVIEW_SCROLL_MARGIN = "scroll-mb-[var(--grid-sticky-bar-height,0px)]";

export default function GridMakerPage() {
  const jsonLd = useMemo(() => gridMakerJsonLd(), []);
  useDocumentMeta({
    title: META_TITLE,
    description: META_DESCRIPTION,
    canonical: `${SITE_URL}/instagram-grid-maker`,
    image: `${SITE_URL}${FEATURED_IMAGE_PATH}`,
    imageAlt: FEATURED_IMAGE_ALT,
    imageWidth: FEATURED_IMAGE_WIDTH,
    imageHeight: FEATURED_IMAGE_HEIGHT,
    jsonLd,
    jsonLdId: "grid-maker-jsonld",
  });

  const [mode, setMode] = useState<GridMode>("profile");
  const [layout, setLayout] = useState<ProfileLayout>("3x3");
  const [slides, setSlides] = useState(3);
  const [shape, setShape] = useState<TileShape>("3:4");
  const [transform, setTransform] = useState<CoverTransform>(DEFAULT_TRANSFORM);
  const [showProfileCrop, setShowProfileCrop] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [image, setImage] = useState<GridImageSource | null>(null);
  const [imageW, setImageW] = useState(0);
  const [imageH, setImageH] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const stickyBarRef = useRef<HTMLDivElement>(null);
  const toolShellRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const bar = stickyBarRef.current;
    const shell = toolShellRef.current;
    if (!bar) return;
    const root = document.documentElement;
    const apply = () => {
      const height = Math.ceil(bar.getBoundingClientRect().height);
      root.style.setProperty(STICKY_BAR_HEIGHT_VAR, `${height}px`);
      root.style.scrollPaddingBottom = `${height}px`;
      const header = document.querySelector("header");
      const headerH = header ? Math.ceil(header.getBoundingClientRect().height) : 64;
      if (shell) {
        shell.style.height = `calc(100dvh - ${headerH}px)`;
      }
    };
    apply();
    const observer = new ResizeObserver(apply);
    observer.observe(bar);
    window.addEventListener("resize", apply);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", apply);
      root.style.removeProperty(STICKY_BAR_HEIGHT_VAR);
      root.style.scrollPaddingBottom = "";
    };
  }, []);

  const loadFile = useCallback((next: File) => {
    setError(null);
    setTransform(DEFAULT_TRANSFORM);
    setFile(next);
  }, []);

  useEffect(() => {
    if (!file) {
      setImage(null);
      setImageW(0);
      setImageH(0);
      return;
    }
    let cancelled = false;
    let decoded: GridImageSource | null = null;
    void decodeGridImage(file)
      .then((img) => {
        if (cancelled) {
          releaseGridImage(img);
          return;
        }
        decoded = img;
        setImage(img);
        setImageW(img.width);
        setImageH(img.height);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Couldn’t read that image.");
        setImage(null);
      });
    return () => {
      cancelled = true;
      releaseGridImage(decoded);
    };
  }, [file]);

  const onModeChange = (next: string) => {
    const value = next === "carousel" ? "carousel" : "profile";
    setMode(value);
    if (value === "profile") setShape("3:4");
    if (value === "carousel") setShape("4:5");
  };

  const tileCount =
    mode === "carousel" ? clampCarouselSlides(slides) : layout === "3x1" ? 3 : layout === "3x2" ? 6 : 9;
  const postingTiles =
    mode === "profile" ? tilesInPostingOrder("profile", 3, layout === "3x1" ? 1 : layout === "3x2" ? 2 : 3) : [];

  const runZipExport = async () => {
    if (!image) return;
    setExporting(true);
    setError(null);
    try {
      const { zip } = await buildTilesZip(
        image,
        imageW,
        imageH,
        mode,
        layout,
        slides,
        shape,
        transform,
      );
      downloadBlob(zip, exportZipName(mode, layout, slides));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn’t create the ZIP.");
    } finally {
      setExporting(false);
    }
  };

  const runIndividualExport = async () => {
    if (!image) return;
    setExporting(true);
    setError(null);
    try {
      const tiles = await renderAllTileBlobs(
        image,
        imageW,
        imageH,
        mode,
        layout,
        slides,
        shape,
        transform,
      );
      for (const [index, tile] of tiles.entries()) {
        downloadBlob(tile.blob, tile.name);
        if (index < tiles.length - 1) {
          await new Promise((resolve) => window.setTimeout(resolve, 280));
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn’t export tiles.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <ToolPageLayout
      articleSlug="instagram-grid-maker"
      toolSlug="instagram-grid-maker"
      articleFeaturedImage={{
        src: FEATURED_IMAGE_PATH,
        alt: FEATURED_IMAGE_ALT,
        width: FEATURED_IMAGE_WIDTH,
        height: FEATURED_IMAGE_HEIGHT,
      }}
    >
      <div ref={toolShellRef} className="flex h-[calc(100dvh-4rem)] flex-col">
      <div className="mesh-bg min-h-0 flex-1 overflow-y-auto pb-[var(--grid-sticky-bar-height,0px)] [scroll-padding-bottom:var(--grid-sticky-bar-height,0px)]">
        <section className="relative overflow-hidden px-4 pb-10 pt-12 sm:px-6 sm:pt-20">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-32 top-10 h-96 w-96 rounded-full bg-primary/20 blur-3xl"
          />
          <div className="mx-auto max-w-3xl text-center">
            <p className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <LayoutGrid className="h-3.5 w-3.5" aria-hidden />
              Free · No login · Stays on your device
            </p>
            <h1 className="font-display text-3xl font-extrabold leading-[1.15] tracking-tight sm:text-4xl lg:text-5xl">
              Instagram{" "}
              <span className="bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
                Grid Maker
              </span>
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-lg text-muted">
              Split one photo into a profile grid or a swipeable carousel. Crop live, preview
              Instagram’s real 3:4 thumbnail, and download numbered tiles — nothing is uploaded.
            </p>
          </div>
        </section>

        <section className="mx-auto w-full min-w-0 max-w-6xl px-4 pb-10 sm:px-6">
          <div
            className={
              image
                ? "grid min-w-0 gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:items-start"
                : "grid min-w-0 gap-8"
            }
          >
            <div className="min-w-0 space-y-6">
              <Tabs value={mode} onValueChange={onModeChange}>
                <TabsList className="w-full sm:w-auto">
                  <TabsTrigger value="profile" className="flex-1 sm:flex-none">
                    Profile grid
                  </TabsTrigger>
                  <TabsTrigger value="carousel" className="flex-1 sm:flex-none">
                    Carousel
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              {mode === "profile" ? (
                <OptionPills
                  label="Grid size"
                  value={layout}
                  onChange={setLayout}
                  options={[
                    { value: "3x1", label: "3×1" },
                    { value: "3x2", label: "3×2" },
                    { value: "3x3", label: "3×3" },
                  ]}
                />
              ) : (
                <div>
                  <p className="font-display mb-2 text-sm font-bold">Slides</p>
                  <div className="flex items-center gap-3">
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      aria-label="Fewer slides"
                      disabled={slides <= MIN_CAROUSEL_SLIDES}
                      onClick={() => setSlides((n) => clampCarouselSlides(n - 1))}
                    >
                      −
                    </Button>
                    <p className="min-w-16 text-center text-sm font-semibold">
                      {slides} {slides === 1 ? "slide" : "slides"}
                    </p>
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      aria-label="More slides"
                      disabled={slides >= MAX_CAROUSEL_SLIDES}
                      onClick={() => setSlides((n) => clampCarouselSlides(n + 1))}
                    >
                      +
                    </Button>
                  </div>
                </div>
              )}

              <OptionPills
                label="Tile shape"
                value={shape}
                onChange={setShape}
                options={[
                  { value: "1:1", label: "1:1 · 1080×1080" },
                  { value: "4:5", label: "4:5 · 1080×1350" },
                  { value: "3:4", label: "3:4 · 1080×1440" },
                ]}
              />

              {mode === "profile" ? (
                <label className="flex items-start gap-2 text-sm text-muted">
                  <input
                    type="checkbox"
                    className="mt-0.5 accent-primary"
                    checked={showProfileCrop}
                    onChange={(e) => setShowProfileCrop(e.target.checked)}
                  />
                  Dim the edges Instagram hides on the profile (3:4 crop guide)
                </label>
              ) : null}

              {!image ? (
                <ImageDropzone
                  className={PREVIEW_SCROLL_MARGIN}
                  onFile={(next) => loadFile(next)}
                  onSample={() => void createSampleGridFile().then((sample) => loadFile(sample))}
                  disabled={exporting}
                />
              ) : (
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setFile(null);
                    }}
                  >
                    Replace image
                  </Button>
                  {file ? <p className="self-center text-xs text-muted">{file.name}</p> : null}
                </div>
              )}

              {error ? (
                <div
                  role="alert"
                  className="rounded-2xl border border-danger/40 bg-danger/5 px-4 py-3 text-sm text-danger"
                >
                  {error}
                </div>
              ) : null}

              {mode === "profile" ? (
                <Card>
                  <CardContent className="p-5">
                    <p className="font-display font-bold">Posting order</p>
                    <p className="mt-2 text-sm text-muted">
                      Instagram puts the newest post at the <strong>top left</strong>. Download
                      numbers are already reversed: <strong>tile_01</strong> is the bottom-right
                      piece — post that first, then 02, 03… until the top-left goes last. Posting
                      left-to-right from the top is the #1 way to scramble the puzzle.
                    </p>
                    {postingTiles.length > 0 ? (
                      <p className="mt-2 text-xs text-muted">
                        First file: bottom-right · Last file: top-left · {tileCount} tiles
                      </p>
                    ) : null}
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-5">
                    <p className="font-display font-bold">Carousel order</p>
                    <p className="mt-2 text-sm text-muted">
                      <strong>tile_01</strong> is the leftmost slide (first in the swipe). Add the
                      rest in order, 02 through {String(tileCount).padStart(2, "0")}.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>

            {image ? (
              <div className="min-w-0 space-y-6">
                <CropStage
                  className={PREVIEW_SCROLL_MARGIN}
                  image={image}
                  imageW={imageW}
                  imageH={imageH}
                  mode={mode}
                  layout={layout}
                  slides={slides}
                  shape={shape}
                  transform={transform}
                  showProfileCrop={showProfileCrop}
                  onChange={setTransform}
                />
                <ProfilePreview
                  className={PREVIEW_SCROLL_MARGIN}
                  image={image}
                  imageW={imageW}
                  imageH={imageH}
                  mode={mode}
                  layout={layout}
                  slides={slides}
                  shape={shape}
                  transform={transform}
                />
              </div>
            ) : null}
          </div>
        </section>
      </div>

      <div
        ref={stickyBarRef}
        data-testid="grid-sticky-actions"
        className="sticky bottom-0 z-30 shrink-0 border-t border-border bg-card/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur sm:px-6"
      >
        <div className="mx-auto flex max-w-6xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted">
            {tileCount} tiles · {shape} · processed locally · no watermark
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              size="lg"
              className="w-full sm:w-auto"
              disabled={!image || exporting}
              onClick={() => void runZipExport()}
            >
              {exporting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  Creating tiles…
                </>
              ) : (
                "Create My Tiles"
              )}
            </Button>
            <Button
              type="button"
              size="lg"
              variant="secondary"
              className="w-full sm:w-auto"
              disabled={!image || exporting}
              onClick={() => void runIndividualExport()}
            >
              Download files one by one
            </Button>
          </div>
        </div>
      </div>
      </div>
    </ToolPageLayout>
  );
}
