import { useMemo, useState } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { copyText } from "./copyText";
import { SYMBOL_GROUPS, SYMBOL_ITEMS, type SymbolItem } from "./symbols";

interface SymbolsTrayProps {
  onCopied: (label: string) => void;
  onCopyFailed: () => void;
}

export function SymbolsTray({ onCopied, onCopyFailed }: SymbolsTrayProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const byGroup = useMemo(() => {
    return SYMBOL_GROUPS.map((group) => ({
      group,
      items: SYMBOL_ITEMS.filter((s) => s.group === group),
    }));
  }, []);

  const handleCopy = async (item: SymbolItem) => {
    const ok = await copyText(item.glyph);
    if (ok) {
      setCopiedId(item.id);
      onCopied(item.label);
      window.setTimeout(() => setCopiedId((id) => (id === item.id ? null : id)), 1400);
    } else {
      onCopyFailed();
    }
  };

  return (
    <section aria-labelledby="fontgen-symbols-heading" className="min-w-0">
      <h2 id="fontgen-symbols-heading" className="font-display text-lg font-bold sm:text-xl">
        Symbols & dividers
      </h2>
      <p className="mt-1 text-sm text-muted">Tap to copy. Paste into your bio or caption.</p>

      <div className="mt-3 space-y-3">
        {byGroup.map(({ group, items }) => (
          <div key={group}>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">{group}</h3>
            <div className="mt-1.5 flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
              {items.map((item) => {
                const copied = copiedId === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => void handleCopy(item)}
                    aria-label={`Copy ${item.label}`}
                    title={item.label}
                    className={cn(
                      "fontgen-copy-btn inline-flex h-11 min-w-11 shrink-0 items-center justify-center rounded-xl border border-border bg-card px-3 text-base shadow-sm transition-[transform,opacity] duration-150 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                      copied && "fontgen-copy-ok border-primary/40",
                    )}
                  >
                    {copied ? (
                      <Check className="size-4 text-primary" aria-hidden />
                    ) : (
                      <span aria-hidden className="whitespace-nowrap">
                        {item.glyph}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
