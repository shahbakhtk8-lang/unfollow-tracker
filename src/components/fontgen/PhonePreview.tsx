import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { TARGET_LABELS, type FontTarget } from "./constants";

interface PhonePreviewProps {
  styledText: string;
  styleName: string;
  target: FontTarget;
  onTargetChange: (target: FontTarget) => void;
}

const TABS: FontTarget[] = ["bio", "name", "caption"];

export function PhonePreview({
  styledText,
  styleName,
  target,
  onTargetChange,
}: PhonePreviewProps) {
  const [displayText, setDisplayText] = useState(styledText);
  const [displayName, setDisplayName] = useState(styleName);
  const [fading, setFading] = useState(false);
  const prevKey = useRef(`${styleName}|${styledText}|${target}`);

  useEffect(() => {
    const key = `${styleName}|${styledText}|${target}`;
    if (key === prevKey.current) return;
    prevKey.current = key;

    const doc = document as Document & {
      startViewTransition?: (cb: () => void) => void;
    };

    if (typeof doc.startViewTransition === "function") {
      doc.startViewTransition(() => {
        setDisplayText(styledText);
        setDisplayName(styleName);
      });
      return;
    }

    setFading(true);
    const id = window.setTimeout(() => {
      setDisplayText(styledText);
      setDisplayName(styleName);
      setFading(false);
    }, 120);
    return () => window.clearTimeout(id);
  }, [styledText, styleName, target]);

  return (
    <aside
      className="fontgen-phone sticky top-20 rounded-2xl border border-border bg-card p-4 shadow-sm"
      aria-label="Preview (approximate)"
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">
        Preview (approximate)
      </p>
      <div
        role="tablist"
        aria-label="Preview target"
        className="mt-3 flex gap-1 rounded-xl border border-border bg-background p-1"
      >
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={target === tab}
            onClick={() => onTargetChange(tab)}
            className={cn(
              "flex-1 rounded-lg px-2 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
              target === tab
                ? "bg-primary text-primary-foreground"
                : "text-muted hover:text-foreground",
            )}
          >
            {TARGET_LABELS[tab]}
          </button>
        ))}
      </div>

      <div className="fontgen-phone-frame mt-4 mx-auto w-full max-w-[260px] rounded-[1.75rem] border-2 border-border bg-background p-3 shadow-inner">
        <div className="mb-3 flex items-center gap-2">
          <div
            className="size-9 shrink-0 rounded-full bg-border"
            aria-hidden
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-bold text-foreground">you</p>
            <p className="truncate text-[10px] text-muted">{displayName}</p>
          </div>
        </div>
        <div
          className={cn(
            "fontgen-phone-body min-h-[7rem] rounded-xl border border-border/60 bg-card px-3 py-2.5 text-sm leading-relaxed break-words whitespace-pre-wrap transition-opacity duration-150",
            fading && "opacity-0",
          )}
          style={{ viewTransitionName: "fontgen-preview" }}
        >
          {displayText || "…"}
        </div>
        <p className="mt-2 text-[10px] text-muted">
          Neutral mock — not an Instagram UI replica.
        </p>
      </div>
    </aside>
  );
}
