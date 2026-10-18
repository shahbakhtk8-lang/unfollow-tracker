import { X } from "lucide-react";
import { READABILITY_HINT } from "./readability";

interface ReadabilityHintProps {
  visible: boolean;
  onDismiss: () => void;
}

export function ReadabilityHint({ visible, onDismiss }: ReadabilityHintProps) {
  if (!visible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="mt-3 flex items-start gap-2 rounded-xl border border-border/80 bg-muted/40 px-3 py-2.5 text-sm text-muted"
    >
      <p className="min-w-0 flex-1 leading-snug">{READABILITY_HINT}</p>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss readability hint"
        className="inline-flex size-11 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-border/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <X className="size-4" aria-hidden />
      </button>
    </div>
  );
}
