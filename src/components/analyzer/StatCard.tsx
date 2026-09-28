import { motion, useSpring, useTransform } from "framer-motion";
import { useEffect } from "react";
import { cn, formatNumber } from "@/lib/utils";

function AnimatedNumber({
  value,
  suffix = "",
  decimals = 0,
}: {
  value: number;
  suffix?: string;
  decimals?: number;
}) {
  const spring = useSpring(0, { stiffness: 80, damping: 20 });
  const display = useTransform(spring, (v) => {
    const shown = decimals > 0 ? v.toFixed(decimals) : formatNumber(Math.round(v));
    return `${shown}${suffix}`;
  });

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  return <motion.span>{display}</motion.span>;
}

export function StatCard({
  label,
  value,
  sub,
  accent,
  suffix,
  decimals = 0,
}: {
  label: string;
  value: number;
  sub?: string;
  suffix?: string;
  decimals?: number;
  accent?: "default" | "warning" | "success";
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-card p-4 shadow-sm",
        accent === "warning" && "border-amber-500/30",
        accent === "success" && "border-emerald-500/30",
      )}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
      <p className="font-display mt-1 text-2xl font-bold tabular-nums sm:text-3xl">
        <AnimatedNumber value={value} suffix={suffix} decimals={decimals} />
      </p>
      {sub ? <p className="mt-1 text-xs text-muted">{sub}</p> : null}
    </div>
  );
}
