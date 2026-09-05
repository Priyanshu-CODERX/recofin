"use client";

import { cn } from "@/lib/utils";

export function MetricCard({
  label,
  value,
  sublabel,
  tone = "neutral",
  className,
}: {
  label: string;
  value: string | number;
  sublabel?: string;
  tone?: "neutral" | "positive" | "negative";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-sm",
        className,
      )}
    >
      <span
        className={cn(
          "absolute inset-x-0 top-0 h-0.5",
          tone === "positive" ? "bg-emerald-500" : tone === "negative" ? "bg-rose-500" : "bg-transparent",
        )}
      />
      <p className="truncate text-[13px] font-medium text-slate-500">{label}</p>
      <p className="mt-1.5 text-2xl font-semibold leading-none tracking-tight text-slate-900">{value}</p>
      {sublabel && <p className="mt-2 truncate text-xs text-slate-400">{sublabel}</p>}
    </div>
  );
}