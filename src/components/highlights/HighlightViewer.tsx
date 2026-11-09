import { useEffect, useId } from "react";
import { ChevronLeft, ChevronRight, Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { HighlightTray } from "@/lib/instagramHighlights";

type HighlightViewerProps = {
  tray: HighlightTray;
  index: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
};

export function HighlightViewer({ tray, index, onIndexChange, onClose }: HighlightViewerProps) {
  const titleId = useId();
  const story = tray.stories[index];
  const total = tray.stories.length;
  const canPrev = index > 0;
  const canNext = index < total - 1;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && canPrev) onIndexChange(index - 1);
      if (e.key === "ArrowRight" && canNext) onIndexChange(index + 1);
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [canNext, canPrev, index, onClose, onIndexChange]);

  if (!story) return null;

  const downloadName = `${tray.title.replace(/\s+/g, "-").toLowerCase()}-${String(index + 1)}.${
    story.type === "video" ? "mp4" : "jpg"
  }`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={onClose}
    >
      <div
        className="relative flex w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
          <div className="min-w-0">
            <h2 id={titleId} className="font-display truncate text-base font-bold">
              {tray.title}
            </h2>
            <p className="text-xs text-muted">
              {index + 1} / {total}
            </p>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Close">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="relative aspect-[9/16] max-h-[70vh] bg-background">
          {story.type === "video" ? (
            <video
              key={story.id}
              className="h-full w-full object-contain"
              src={story.mediaUrl}
              poster={story.thumbnailUrl}
              controls
              playsInline
            />
          ) : (
            <img
              key={story.id}
              src={story.mediaUrl}
              alt={`${tray.title} story ${String(index + 1)}`}
              className="h-full w-full object-contain"
            />
          )}
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-border p-3">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={!canPrev}
            onClick={() => onIndexChange(index - 1)}
            aria-label="Previous story"
          >
            <ChevronLeft className="h-4 w-4" />
            Prev
          </Button>
          <Button type="button" variant="default" size="sm" asChild>
            <a href={story.mediaUrl} download={downloadName}>
              <Download className="h-4 w-4" />
              Download
            </a>
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={!canNext}
            onClick={() => onIndexChange(index + 1)}
            aria-label="Next story"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
