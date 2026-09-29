import { useState } from "react";
import { Button } from "@/components/ui/button";

export function CountsNote() {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <div className="mb-4 rounded-xl border border-border bg-card/80 p-3 text-sm text-muted">
      <p>
        These counts can be a little higher than Instagram’s profile numbers. Exports may include
        deactivated or suspended accounts that the app hides.
      </p>
      <p className="mt-2">
        Follow-back rate is mutuals ÷ following, shown as a percent to one decimal.
      </p>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        className="mt-2"
        onClick={() => setDismissed(true)}
      >
        Dismiss
      </Button>
    </div>
  );
}
