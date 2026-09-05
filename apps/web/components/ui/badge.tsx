import * as React from "react";
import { cn } from "@/lib/utils";

export type BadgeVariant =
  | "default"
  | "secondary"
  | "destructive"
  | "outline"
  | "success"
  | "warning";

const softStyles: Record<BadgeVariant, { wrap: string; dot: string }> = {
  success: {
    wrap: "border-emerald-200 bg-emerald-50 text-emerald-800",
    dot: "bg-emerald-500",
  },
  warning: {
    wrap: "border-amber-200 bg-amber-50 text-amber-800",
    dot: "bg-amber-500",
  },
  destructive: {
    wrap: "border-rose-200 bg-rose-50 text-rose-800",
    dot: "bg-rose-500",
  },
  default: {
    wrap: "border-slate-200 bg-slate-100 text-slate-700",
    dot: "bg-slate-400",
  },
  secondary: {
    wrap: "border-slate-200 bg-slate-100 text-slate-600",
    dot: "bg-slate-400",
  },
  outline: {
    wrap: "border-slate-200 bg-white text-slate-600",
    dot: "bg-slate-400",
  },
};

const dotVariants: BadgeVariant[] = ["success", "warning", "destructive"];

export function Badge({
  className,
  variant = "default",
  dot = false,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  variant?: BadgeVariant;
  dot?: boolean;
}) {
  const s = softStyles[variant];
  const showDot = dot || dotVariants.includes(variant);
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        s.wrap,
        className,
      )}
      {...props}
    >
      {showDot && <span className={cn("inline-block h-1.5 w-1.5 shrink-0 rounded-full", s.dot)} />}
      {children}
    </div>
  );
}