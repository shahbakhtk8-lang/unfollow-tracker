import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";
import {
  STYLES,
  convertPreview,
  type ConvertOptions,
  type StyleCategory,
  type StyleMeta,
} from "@/lib/fontStyles";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { CATEGORIES } from "./constants";
import { StyleCard } from "./StyleCard";

type GalleryTab = "all" | "favorites";

const INITIAL_VISIBLE = 12;
const IDLE_CHUNK = 10;

interface StyleGalleryProps {
  sourceText: string;
  options: ConvertOptions;
  favoriteIds: string[];
  selectedStyleId: string;
  onCopy: (style: StyleMeta) => void;
  onFavorite: (styleId: string) => void;
  onPreview: (styleId: string) => void;
}

function scheduleIdle(cb: () => void): () => void {
  const w = window as Window & {
    requestIdleCallback?: (cb: IdleRequestCallback, opts?: IdleRequestOptions) => number;
    cancelIdleCallback?: (id: number) => void;
  };
  if (typeof w.requestIdleCallback === "function") {
    const id = w.requestIdleCallback(() => cb(), { timeout: 120 });
    return () => w.cancelIdleCallback?.(id);
  }
  const id = globalThis.setTimeout(cb, 16);
  return () => globalThis.clearTimeout(id);
}

export function StyleGallery({
  sourceText,
  options,
  favoriteIds,
  selectedStyleId,
  onCopy,
  onFavorite,
  onPreview,
}: StyleGalleryProps) {
  const [tab, setTab] = useState<GalleryTab>("all");
  const [category, setCategory] = useState<StyleCategory | "all">("all");
  const [query, setQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);
  const activeChipRef = useRef<HTMLButtonElement>(null);
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: STYLES.length };
    for (const cat of CATEGORIES) {
      counts[cat] = STYLES.filter((s) => s.category === cat).length;
    }
    return counts;
  }, []);

  const favoriteSet = useMemo(() => new Set(favoriteIds), [favoriteIds]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return STYLES.filter((style) => {
      if (tab === "favorites" && !favoriteSet.has(style.id)) return false;
      if (category !== "all" && style.category !== category) return false;
      if (q && !style.name.toLowerCase().includes(q) && !style.id.includes(q)) return false;
      return true;
    });
  }, [tab, category, query, favoriteSet]);

  // Reset idle window when the filtered list identity changes.
  const filterKey = `${tab}|${category}|${query}|${filtered.length}`;
  useEffect(() => {
    setVisibleCount(Math.min(INITIAL_VISIBLE, filtered.length));
  }, [filterKey, filtered.length]);

  useEffect(() => {
    if (visibleCount >= filtered.length) return;
    return scheduleIdle(() => {
      setVisibleCount((n) => Math.min(n + IDLE_CHUNK, filtered.length));
    });
  }, [visibleCount, filtered.length]);

  const visibleStyles = useMemo(
    () => filtered.slice(0, visibleCount),
    [filtered, visibleCount],
  );

  const results = useMemo(
    () =>
      visibleStyles.map((style) => ({
        style,
        result: convertPreview(sourceText, style.id, options),
      })),
    [visibleStyles, sourceText, options],
  );

  useLayoutEffect(() => {
    const el = activeChipRef.current;
    if (!el) {
      setIndicator({ left: 0, width: 0 });
      return;
    }
    setIndicator({ left: el.offsetLeft, width: el.offsetWidth });
  }, [category, tab]);

  const chips: { key: StyleCategory | "all"; label: string }[] = [
    { key: "all", label: "All" },
    ...CATEGORIES.map((c) => ({ key: c, label: c })),
  ];

  return (
    <section aria-labelledby="fontgen-gallery-heading" className="min-w-0">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 id="fontgen-gallery-heading" className="font-display text-xl font-bold sm:text-2xl">
          Styles
        </h2>
        <div
          role="tablist"
          aria-label="Gallery filter"
          className="flex gap-1 rounded-xl border border-border bg-card p-1"
        >
          <button
            type="button"
            role="tab"
            aria-selected={tab === "all"}
            onClick={() => setTab("all")}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
              tab === "all" ? "bg-primary text-primary-foreground" : "text-muted",
            )}
          >
            All ({STYLES.length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "favorites"}
            onClick={() => setTab("favorites")}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
              tab === "favorites" ? "bg-primary text-primary-foreground" : "text-muted",
            )}
          >
            Favorites ({favoriteIds.length})
          </button>
        </div>
      </div>

      <div className="relative mt-4">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted"
          aria-hidden
        />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search styles…"
          aria-label="Search styles"
          className="pl-9"
        />
      </div>

      {tab === "all" ? (
        <div className="relative mt-4">
          <div className="fontgen-cat-track relative flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
            <span
              aria-hidden
              className="fontgen-cat-indicator pointer-events-none absolute bottom-0 h-0.5 rounded-full bg-primary transition-transform duration-200"
              style={{
                width: indicator.width || 0,
                transform: `translateX(${indicator.left}px)`,
              }}
            />
            {chips.map(({ key, label }) => {
              const active = category === key;
              return (
                <button
                  key={key}
                  type="button"
                  ref={active ? activeChipRef : undefined}
                  aria-pressed={active}
                  onClick={() => setCategory(key)}
                  className={cn(
                    "shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                    active
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted hover:text-foreground",
                  )}
                >
                  {label}{" "}
                  <span className="tabular-nums opacity-70">({categoryCounts[key] ?? 0})</span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {filtered.length === 0 ? (
        <p className="mt-8 text-center text-sm text-muted">
          {tab === "favorites"
            ? "No favorites yet — tap the heart on any style."
            : "No styles match your search."}
        </p>
      ) : (
        <ul className="mt-6 grid list-none grid-cols-1 gap-3 p-0 sm:grid-cols-2 xl:grid-cols-3">
          {results.map(({ style, result }, index) => (
            <li key={style.id}>
              <StyleCard
                style={style}
                result={result}
                favorite={favoriteSet.has(style.id)}
                selected={selectedStyleId === style.id}
                index={index}
                onCopy={onCopy}
                onFavorite={onFavorite}
                onPreview={onPreview}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
