import { cn } from "@/lib/utils";

interface OptionPillsProps<T extends string> {
  label: string;
  value: T;
  options: Array<{ value: T; label: string; hint?: string }>;
  onChange: (value: T) => void;
}

export function OptionPills<T extends string>({
  label,
  value,
  options,
  onChange,
}: OptionPillsProps<T>) {
  return (
    <fieldset>
      <legend className="font-display mb-2 text-sm font-bold">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={value === option.value}
            onClick={() => onChange(option.value)}
            className={cn(
              "rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:text-sm",
              value === option.value
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted hover:text-foreground",
            )}
          >
            {option.label}
            {option.hint ? (
              <span className="ml-1 font-medium text-muted">{option.hint}</span>
            ) : null}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
