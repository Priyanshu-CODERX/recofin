"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { ChevronRight, Search, Bell, CircleHelp, Command, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

const SEGMENT_LABELS: Record<string, string> = {
  explore: "Command Center",
  reconciliation: "Reconciliation",
  exceptions: "Exceptions",
  forecast: "Cash Forecast",
  tax: "Tax-Line Matcher",
  evaluation: "Evaluation Lab",
  evidence: "Evidence Graph",
  audit: "Audit Trail",
  sources: "Data Sources",
  policies: "Policies",
  docs: "Documentation",
};

function Breadcrumb() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  return (
    <nav className="flex min-w-0 items-center gap-1.5 text-[13px]">
      <span className="font-medium text-slate-400">Recofin</span>
      {segments.map((seg, i) => {
        const isLast = i === segments.length - 1;
        const isRoot = !isLast;
        const label = SEGMENT_LABELS[seg] ?? seg;
        return (
          <React.Fragment key={i}>
            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-300" />
            <span
              className={cn(
                "truncate",
                isLast
                  ? "font-medium text-slate-900"
                  : isRoot
                    ? "text-slate-500"
                    : "font-mono text-[12.5px] text-slate-500",
              )}
            >
              {label}
            </span>
          </React.Fragment>
        );
      })}
    </nav>
  );
}

function SearchBox() {
  const [open, setOpen] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  React.useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  return (
    <div className="relative hidden md:block">
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen(true)}
        onKeyDown={(e) => e.key === "Enter" && setOpen(true)}
        className="flex h-9 w-64 cursor-text items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-[13px] text-slate-400 transition-colors hover:border-slate-300"
      >
        <Search className="h-3.5 w-3.5" />
        <span className="flex-1">Search cases, IDs, evidence…</span>
        <kbd className="flex items-center gap-0.5 rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono text-[10px] text-slate-400">
          <Command className="h-2.5 w-2.5" />
          K
        </kbd>
      </div>
      {open && (
        <div className="absolute left-0 top-12 z-50 w-96 rounded-lg border border-slate-200 bg-white p-4 shadow-xl">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              ref={inputRef}
              placeholder="Search cases, transaction IDs, evidence…"
              className="flex-1 bg-transparent text-[13px] text-slate-900 outline-none placeholder:text-slate-400"
            />
          </div>
          <p className="pt-3 text-[11px] text-slate-400">
            Press <kbd className="rounded border border-slate-200 px-1 font-mono">Esc</kbd> to close. Enter a case ID to jump
            straight to it.
          </p>
        </div>
      )}
    </div>
  );
}

export function TopBar() {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b border-slate-200 bg-background/90 px-6 backdrop-blur lg:px-8">
      <Breadcrumb />

      <div className="ml-auto flex items-center gap-2.5">
        <button
          type="button"
          className="hidden items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-[13px] font-medium text-slate-600 transition-colors hover:bg-slate-50 sm:flex"
          title="Workspace"
        >
          <Building2 className="h-3.5 w-3.5 text-slate-400" />
          Finance Controller
          <ChevronDownMini />
        </button>

        <button
          type="button"
          className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
          title="Notifications"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-emerald-500 ring-2 ring-white" />
        </button>

        <button
          type="button"
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
          title="Help & documentation"
          aria-label="Help"
        >
          <CircleHelp className="h-4 w-4" />
        </button>

        <div className="mx-1 h-6 w-px bg-slate-200" />

        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-[11px] font-semibold text-white ring-2 ring-transparent transition-shadow hover:ring-slate-200"
          title="Priyanshu"
          aria-label="Profile"
        >
          PK
        </button>
      </div>
    </header>
  );
}

function ChevronDownMini() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="currentColor"
      className="h-3.5 w-3.5 text-slate-400"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.17l3.71-3.94a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z"
        clipRule="evenodd"
      />
    </svg>
  );
}