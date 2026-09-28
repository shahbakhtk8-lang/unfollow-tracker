import type { ParseProgress } from "@/worker/parseZip.worker";
import { cn } from "@/lib/utils";

export function ParseProgressBar({ progress }: { progress: ParseProgress | null }) {
  if (!progress) return null;
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs text-muted">
        <span>{progress.message}</span>
        <span>{progress.percent}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-border">
        <div
          className={cn(
            "h-full rounded-full bg-primary transition-all duration-300",
            progress.stage === "error" && "bg-danger",
          )}
          style={{ width: `${progress.percent}%` }}
        />
      </div>
    </div>
  );
}
