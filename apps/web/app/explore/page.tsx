"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout";
import { MetricCard } from "@/components/metric-card";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw, TrendingUp, AlertTriangle, CheckCircle2, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface Summary {
  total_records: number;
  total_cases: number;
  reconciled: number;
  auto_resolved: number;
  human_review: number;
  exceptions: number;
  unmatched: number;
  total_payments: number;
  total_settlements: number;
  total_bank_transactions: number;
  precision: number;
  recall: number;
  false_auto_match_rate: number;
}

interface Trends {
  reconciliation_runs: Array<{
    run_id: string;
    started_at: string;
    total_records: number;
    matched: number;
    exceptions: number;
    auto_resolved: number;
    duration_seconds: number;
  }>;
  risk_distribution: Record<string, number>;
  source_health: {
    synthetic: { records: number };
  };
}

const RISK_TONE: Record<string, { bar: string; badge: "success" | "warning" | "destructive"; dot: string }> = {
  LOW: { bar: "bg-emerald-500", badge: "success", dot: "bg-emerald-500" },
  MEDIUM: { bar: "bg-amber-500", badge: "warning", dot: "bg-amber-500" },
  HIGH: { bar: "bg-rose-400", badge: "destructive", dot: "bg-rose-500" },
  CRITICAL: { bar: "bg-rose-600", badge: "destructive", dot: "bg-rose-600" },
};

const RISK_ORDER = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

function RiskDistribution({ distribution }: { distribution: Record<string, number> }) {
  const entries = Object.entries(distribution ?? {});
  if (entries.length === 0) {
    return <p className="text-sm text-slate-400">No cases classified yet.</p>;
  }
  const total = entries.reduce((acc, [, v]) => acc + v, 0);
  const sorted = RISK_ORDER.filter((k) => (distribution[k] ?? 0) > 0).map((k) => ({
    risk: k,
    count: distribution[k],
  }));

  return (
    <div>
      <div className="flex h-2.5 w-full gap-0.5 overflow-hidden rounded-full bg-slate-100">
        {sorted.map((s) => (
          <div
            key={s.risk}
            style={{ width: `${(s.count / total) * 100}%` }}
            className={cn("h-full", RISK_TONE[s.risk]?.bar ?? "bg-slate-300")}
            title={`${s.risk}: ${s.count}`}
          />
        ))}
      </div>
      <div className="mt-4 space-y-2">
        {sorted.map((s) => {
          const pct = ((s.count / total) * 100).toFixed(0);
          return (
            <div key={s.risk} className="flex items-center gap-2 text-[13px]">
              <span className={cn("h-2 w-2 rounded-full", RISK_TONE[s.risk]?.dot)} />
              <span className="w-20 text-slate-500">{s.risk}</span>
              <div className="h-1 flex-1 rounded-full bg-slate-100">
                <div className={cn("h-full rounded-full", RISK_TONE[s.risk]?.bar)} style={{ width: `${pct}%` }} />
              </div>
              <span className="w-10 text-right font-medium tabular-nums text-slate-900">{s.count}</span>
              <span className="w-12 text-right text-xs tabular-nums text-slate-400">{pct}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function CommandCenter() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [trends, setTrends] = useState<Trends | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [s, t] = await Promise.all([api.get<Summary>("/dashboard/summary"), api.get<Trends>("/dashboard/trends")]);
      setSummary(s);
      setTrends(t);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const matchRate =
    summary && summary.total_records > 0
      ? `${((summary.reconciled / summary.total_records) * 100).toFixed(1)}%`
      : "—";

  return (
    <DashboardLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Command Center</h1>
          <p className="mt-0.5 text-[13px] text-slate-500">Live operational metrics from the running controller</p>
        </div>
        <Button variant="outline" size="sm" onClick={load}>
          <RefreshCw className="mr-2 h-3.5 w-3.5" />
          Refresh
        </Button>
      </div>

      {loading && !summary ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-8">
            <MetricCard label="Total Records" value={summary?.total_records ?? 0} />
            <MetricCard label="Match Rate" value={matchRate} tone="positive" />
            <MetricCard label="Auto-Resolved" value={summary?.auto_resolved ?? 0} tone="positive" />
            <MetricCard label="Exceptions" value={summary?.exceptions ?? 0} tone="negative" sublabel={`${summary?.unmatched ?? 0} unmatched`} />
            <MetricCard label="Human Review" value={summary?.human_review ?? 0} sublabel={`${summary?.total_cases ?? 0} open cases`} />
            <MetricCard label="Precision" value={`${((summary?.precision ?? 0) * 100).toFixed(1)}%`} />
            <MetricCard label="Recall" value={`${((summary?.recall ?? 0) * 100).toFixed(1)}%`} />
            <MetricCard label="False Auto-Match" value={`${((summary?.false_auto_match_rate ?? 0) * 100).toFixed(1)}%`} />
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-slate-500" />
                  Reconciliation Runs
                </CardTitle>
                <CardDescription>Recent reconciliation activity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {(trends?.reconciliation_runs?.length ?? 0) === 0 && (
                    <p className="text-sm text-slate-400">No reconciliation runs yet. Run reconciliation to populate data.</p>
                  )}
                  {trends?.reconciliation_runs?.slice(0, 5).map((r) => (
                    <div
                      key={r.run_id}
                      className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3 transition-colors hover:bg-slate-50"
                    >
                      <div className="min-w-0">
                        <p className="text-[13px] font-medium text-slate-900">{r.total_records} records processed</p>
                        <p className="mt-0.5 truncate font-mono text-xs text-slate-400">{r.run_id}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-500">
                          {r.matched} matched · {r.exceptions} exceptions · {r.auto_resolved} auto-resolved
                        </span>
                        <span className="text-xs tabular-nums text-slate-400">{r.duration_seconds?.toFixed(1)}s</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  Risk Distribution
                </CardTitle>
                <CardDescription>Cases by risk level</CardDescription>
              </CardHeader>
              <CardContent>
                <RiskDistribution distribution={trends?.risk_distribution ?? {}} />
              </CardContent>
            </Card>
          </div>

          <div className="mt-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-slate-500" />
                  Source Health
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-50">
                      <ShieldCheck className="h-4 w-4 text-slate-500" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-[13px] font-medium text-slate-900">Synthetic</p>
                        <Badge variant="success">Active</Badge>
                      </div>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {trends?.source_health?.synthetic?.records ?? 0} records available
                      </p>
                    </div>
                  </div>
                  <span className="text-xs tabular-nums text-slate-400">
                    {summary?.total_payments ?? 0} payments · {summary?.total_settlements ?? 0} settlements ·{" "}
                    {summary?.total_bank_transactions ?? 0} bank txns
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </DashboardLayout>
  );
}