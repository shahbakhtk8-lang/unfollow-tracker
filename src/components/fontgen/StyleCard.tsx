import { memo, useState, type CSSProperties } from "react";
import { Check, Copy, Eye, Heart } from "lucide-react";
import type { ConvertResult, StyleMeta } from "@/lib/fontStyles";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface StyleCardProps {
  style: StyleMeta;
  result: ConvertResult;
  favorite: boolean;
  selected: boolean;
  index: number;
  /** Parent converts the FULL source text on copy — card only shows a preview slice. */
  onCopy: (style: StyleMeta) => void;
  onFavorite: (styleId: string) => void;
  onPreview: (styleId: string) => void;
}

export const StyleCard = memo(function StyleCard({
  style,
  result,
  favorite,
  selected,
  index,
  onCopy,
  onFavorite,
  onPreview,
}: StyleCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const stagger = index < 12;

  const handleCopy = () => {
    onCopy(style);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <article
      tabIndex={0}
      data-style-id={style.id}
      data-style-card
      aria-label={`${style.name} style`}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleCopy();
        }
      }}
      className={cn(
        "fontgen-card group content-visibility-auto rounded-2xl border border-border bg-card p-4 shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        selected && "border-primary/50 ring-1 ring-primary/30",
        stagger && "fontgen-card-enter",
      )}
      style={
        stagger
          ? ({ "--fontgen-stagger": index } as CSSProperties)
          : undefined
      }
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-display truncate text-sm font-bold">{style.name}</h3>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            <span
              className={cn(
                "rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                style.compatibility === "high"
                  ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200"
                  : "bg-amber-100 text-amber-950 dark:bg-amber-950 dark:text-amber-100",
              )}
              title={style.compatibilityNote}
            >
              {style.compatibility === "high" ? "Wide support" : "May vary"}
            </span>
            {result.partial ? (
              <span
                className="rounded-md bg-slate-200 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-800 dark:bg-slate-800 dark:text-slate-100"
                title="Some characters could not be styled"
              >
                Partial
              </span>
            ) : null}
          </div>
        </div>
        <button
          type="button"
          aria-label={favorite ? `Unfavorite ${style.name}` : `Favorite ${style.name}`}
          aria-pressed={favorite}
          onClick={(e) => {
            onFavorite(style.id);
            const btn = e.currentTarget;
            btn.classList.remove("fontgen-heart-burst");
            // Retrigger burst on each toggle toward favorited.
            if (!favorite) {
              void btn.offsetWidth;
              btn.classList.add("fontgen-heart-burst");
            }
          }}
          className={cn(
            "fontgen-heart shrink-0 rounded-lg p-1.5 text-muted hover:text-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
            favorite && "text-danger",
          )}
        >
          <Heart className={cn("size-4", favorite && "fill-current")} aria-hidden />
        </button>
      </div>

      <p
        className={cn(
          "mt-3 break-words whitespace-pre-wrap text-base leading-relaxed text-foreground",
          !expanded && "line-clamp-3",
        )}
      >
        {result.text}
      </p>
      {result.text.length > 80 ? (
        <button
          type="button"
          className="mt-1 text-xs font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? "Collapse" : "Expand"}
        </button>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant="default"
          className={cn("fontgen-copy-btn min-w-[5.5rem]", copied && "fontgen-copy-ok")}
          onClick={handleCopy}
          aria-label={`Copy ${style.name}`}
        >
          {copied ? (
            <>
              <Check className="size-3.5" aria-hidden />
              Copied
            </>
          ) : (
            <>
              <Copy className="size-3.5" aria-hidden />
              Copy
            </>
          )}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => onPreview(style.id)}
          aria-pressed={selected}
          aria-label={`Preview ${style.name}`}
        >
          <Eye className="size-3.5" aria-hidden />
          Preview
        </Button>
      </div>
    </article>
  );
});
