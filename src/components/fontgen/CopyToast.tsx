import { useEffect } from "react";
import { cn } from "@/lib/utils";

export type ToastState = {
  kind: "success" | "error";
  message: string;
} | null;

interface CopyToastProps {
  toast: ToastState;
  onDismiss: () => void;
}

export function CopyToast({ toast, onDismiss }: CopyToastProps) {
  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(onDismiss, 2200);
    return () => window.clearTimeout(id);
  }, [toast, onDismiss]);

  if (!toast) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "fontgen-toast fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl border px-4 py-2.5 text-sm font-medium shadow-lg",
        toast.kind === "success"
          ? "border-success/40 bg-card text-foreground"
          : "border-danger/40 bg-card text-danger",
      )}
    >
      {toast.message}
    </div>
  );
}
