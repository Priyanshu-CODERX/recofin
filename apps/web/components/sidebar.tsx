"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileSearch,
  AlertTriangle,
  FlaskConical,
  Share2,
  History,
  Database,
  Shield,
  SlidersHorizontal,
  BookOpen,
  TrendingUp,
  Receipt,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const groups: { title: string; items: NavItem[] }[] = [
  {
    title: "Operations",
    items: [
      { href: "/explore", label: "Command Center", icon: LayoutDashboard },
      { href: "/reconciliation", label: "Reconciliation", icon: FileSearch },
      { href: "/exceptions", label: "Exceptions", icon: AlertTriangle },
    ],
  },
  {
    title: "Intelligence & Models",
    items: [
      { href: "/forecast", label: "Cash Forecast", icon: TrendingUp },
      { href: "/tax", label: "Tax-Line Matcher", icon: Receipt },
      { href: "/evaluation", label: "Evaluation Lab", icon: FlaskConical },
      { href: "/evidence", label: "Evidence Graph", icon: Share2 },
    ],
  },
  {
    title: "Governance",
    items: [
      { href: "/audit", label: "Audit Trail", icon: History },
      { href: "/sources", label: "Data Sources", icon: Database },
      { href: "/policies", label: "Policies", icon: SlidersHorizontal },
      { href: "/docs", label: "Documentation", icon: BookOpen },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-60 flex-col border-r border-slate-200 bg-white">
      <div className="flex items-center gap-2.5 border-b border-slate-200 px-5 py-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white shadow-sm">
          <Shield className="h-4 w-4" />
        </div>
        <div className="leading-tight">
          <p className="text-sm font-semibold text-slate-900">Recofin</p>
          <p className="text-[10px] font-medium tracking-wide text-slate-400">Finance Controller</p>
        </div>
      </div>

      <nav className="scrollbar-thin flex-1 overflow-y-auto px-3 py-4">
        {groups.map((group) => (
          <div key={group.title} className="mb-5">
            <p className="mb-1 px-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              {group.title}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "relative flex items-center gap-2.5 rounded-md px-3 py-2 text-[13px] font-medium transition-colors",
                      active
                        ? "bg-slate-50 text-slate-900"
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-900",
                    )}
                  >
                    {active && (
                      <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-slate-900" />
                    )}
                    <Icon className={cn("h-4 w-4", active ? "text-slate-900" : "text-slate-400")} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-slate-200 px-5 py-4">
        <p className="text-[10px] leading-4 text-slate-400">
          Models investigate.
          <br />
          Rules authorize.
          <br />
          Evidence proves.
        </p>
      </div>
    </aside>
  );
}