import { forwardRef, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  EXAMPLE_TEXT,
  TARGET_LABELS,
  TARGET_LIMITS,
  countCodePoints,
  type FontTarget,
} from "./constants";
import { ReadabilityHint } from "./ReadabilityHint";
import { shouldShowReadabilityHint } from "./readability";

interface FontInputCardProps {
  value: string;
  onChange: (value: string) => void;
  target: FontTarget;
  onTargetChange: (target: FontTarget) => void;
  keepLinks: boolean;
  onKeepLinksChange: (value: boolean) => void;
  keepEmoji: boolean;
  onKeepEmojiChange: (value: boolean) => void;
  compact?: boolean;
}

export const FontInputCard = forwardRef<HTMLTextAreaElement, FontInputCardProps>(
  function FontInputCard(
    {
      value,
      onChange,
      target,
      onTargetChange,
      keepLinks,
      onKeepLinksChange,
      keepEmoji,
      onKeepEmojiChange,
      compact = false,
    },
    ref,
  ) {
    const innerRef = useRef<HTMLTextAreaElement | null>(null);
    const [hintDismissed, setHintDismissed] = useState(false);

    const setRefs = (node: HTMLTextAreaElement | null) => {
      innerRef.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) ref.current = node;
    };

    useEffect(() => {
      const el = innerRef.current;
      if (!el || compact) return;
      el.style.height = "auto";
      el.style.height = `${Math.min(Math.max(el.scrollHeight, 120), 320)}px`;
    }, [value, compact]);

    // Re-offer the hint when the text/target changes enough to matter.
    useEffect(() => {
      setHintDismissed(false);
    }, [target]);

    const count = countCodePoints(value);
    const limit = TARGET_LIMITS[target];
    const over = count > limit;
    const showHint =
      !compact &&
      !hintDismissed &&
      shouldShowReadabilityHint(value, target, keepLinks);

    return (
      <div
        className={cn(
          "rounded-2xl border border-border bg-card shadow-sm",
          compact ? "p-3" : "p-4 sm:p-5",
        )}
      >
        {!compact ? (
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <label htmlFor="fontgen-input" className="font-display text-sm font-bold">
              Your text
            </label>
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => onChange(EXAMPLE_TEXT)}
              >
                Try example
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={() => onChange("")}>
                Clear
              </Button>
            </div>
          </div>
        ) : null}

        <textarea
          id={compact ? undefined : "fontgen-input"}
          ref={compact ? undefined : setRefs}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={compact ? 2 : 4}
          placeholder={EXAMPLE_TEXT}
          aria-label={compact ? "Text to style (compact)" : "Text to style"}
          tabIndex={compact ? -1 : undefined}
          className={cn(
            "w-full resize-none rounded-xl border border-border bg-background px-3 py-2.5 text-base shadow-sm placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
            compact && "text-sm",
          )}
        />

        <div className={cn("mt-3 flex flex-wrap items-center gap-2", compact && "mt-2")}>
          {(Object.keys(TARGET_LIMITS) as FontTarget[]).map((key) => (
            <button
              key={key}
              type="button"
              aria-pressed={target === key}
              onClick={() => onTargetChange(key)}
              className={cn(
                "rounded-lg border px-2.5 py-1 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                target === key
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted hover:text-foreground",
              )}
            >
              {TARGET_LABELS[key]}
            </button>
          ))}
          <span
            className={cn(
              "ml-auto text-xs tabular-nums",
              over ? "font-semibold text-amber-600 dark:text-amber-400" : "text-muted",
            )}
            aria-live="polite"
          >
            {count} / {limit} approx.
          </span>
        </div>

        {over ? (
          <p className="mt-2 text-xs text-amber-600 dark:text-amber-400" role="status">
            Past the typical {TARGET_LABELS[target].toLowerCase()} limit — Instagram may truncate.
          </p>
        ) : null}

        <ReadabilityHint visible={showHint} onDismiss={() => setHintDismissed(true)} />

        {!compact ? (
          <div className="mt-4 flex flex-col gap-2 border-t border-border/60 pt-3 sm:flex-row sm:gap-6">
            <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-muted">
              <input
                type="checkbox"
                checked={keepLinks}
                onChange={(e) => onKeepLinksChange(e.target.checked)}
                className="size-4 rounded border-border text-primary focus-visible:ring-2 focus-visible:ring-primary"
              />
              Keep links / @ / # plain
            </label>
            <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-muted">
              <input
                type="checkbox"
                checked={keepEmoji}
                onChange={(e) => onKeepEmojiChange(e.target.checked)}
                className="size-4 rounded border-border text-primary focus-visible:ring-2 focus-visible:ring-primary"
              />
              Keep emoji plain
            </label>
          </div>
        ) : null}
      </div>
    );
  },
);
