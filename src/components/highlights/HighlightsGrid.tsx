import type { HighlightTray } from "@/lib/instagramHighlights";

type HighlightsGridProps = {
  username: string;
  highlights: HighlightTray[];
  onSelect: (tray: HighlightTray) => void;
};

export function HighlightsGrid({ username, highlights, onSelect }: HighlightsGridProps) {
  return (
    <section aria-labelledby="highlights-grid-heading">
      <h2 id="highlights-grid-heading" className="font-display text-xl font-bold">
        Highlights for @{username}
      </h2>
      <p className="mt-1 text-sm text-muted">
        {highlights.length} highlight{highlights.length === 1 ? "" : "s"} — tap one to view stories.
      </p>
      <ul className="mt-6 grid list-none grid-cols-2 gap-4 p-0 sm:grid-cols-3 md:grid-cols-4">
        {highlights.map((tray) => (
          <li key={tray.id}>
            <button
              type="button"
              onClick={() => onSelect(tray)}
              className="group flex w-full flex-col items-center gap-2 rounded-2xl border border-border bg-card p-3 text-center shadow-sm transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              <span className="relative block aspect-square w-full overflow-hidden rounded-full border-2 border-primary/30 bg-border/30">
                <img
                  src={tray.coverUrl}
                  alt=""
                  className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  loading="lazy"
                  decoding="async"
                />
              </span>
              <span className="font-display line-clamp-2 text-sm font-semibold text-foreground">
                {tray.title}
              </span>
              <span className="text-xs text-muted">
                {tray.stories.length} stor{tray.stories.length === 1 ? "y" : "ies"}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
