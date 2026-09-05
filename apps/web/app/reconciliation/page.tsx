"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { RefreshCw, Play, ArrowRight, Search, Filter } from "lucide-react";
import { cn } from "@/lib/utils";

interface CaseItem {
  case_id: string;
  status: string;
  risk: string;
  match_score: number;
  outcome_type: string;
  amount: number;
  currency: string;
  related_record_ids: string[];
  source: string;
}

interface CasesResponse {
  total: number;
  cases: CaseItem[];
}

const statusMap: Record<string, BadgeVariant> = {
  AUTO_RESOLVED: "success",
  RESOLVED: "success",
  MATCHED: "secondary",
  EXCEPTION: "destructive",
  HUMAN_REVIEW: "warning",
  UNPROCESSED: "outline",
  REJECTED: "destructive",
};

const riskMap: Record<string, BadgeVariant> = {
  LOW: "success",
  MEDIUM: "warning",
  HIGH: "destructive",
  CRITICAL: "destructive",
};

type BadgeVariant = "default" | "secondary" | "destructive" | "outline" | "success" | "warning";

function ScoreCell({ score }: { score: number }) {
  const pct = Math.max(0, Math.min(100, score ?? 0));
  const bar = pct >= 80 ? "bg-emerald-500" : pct >= 60 ? "bg-amber-500" : "bg-rose-500";
  const text = pct >= 80 ? "text-emerald-700" : pct >= 60 ? "text-amber-700" : "text-rose-700";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-14 overflow-hidden rounded-full bg-slate-100">
        <div className={cn("h-full rounded-full", bar)} style={{ width: `${pct}%` }} />
      </div>
      <span className={cn("text-xs font-medium tabular-nums", text)}>{score?.toFixed(1)}</span>
    </div>
  );
}

export default function Reconciliation() {
  const [data, setData] = useState<CasesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [runner, setRunner] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [riskFilter, setRiskFilter] = useState<string>("");
  const [search, setSearch] = useState("");

  const fetchCases = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      if (riskFilter) params.set("risk", riskFilter);
      const res = await api.get<CasesResponse>(`/reconciliation/cases?${params.toString()}&limit=100`);
      setData(res);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCases();
  }, [statusFilter, riskFilter]);

  const runReconciliation = async () => {
    setRunning(true);
    try {
      const res = await api.post<any>("/reconciliation/run", { source: "hybrid" });
      setRunner(res?.run_id);
      await new Promise((r) => setTimeout(r, 500));
      await fetchCases();
    } catch (e) {
      console.error(e);
    }
    setRunning(false);
  };

  const visibleCases = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return data?.cases ?? [];
    return (data?.cases ?? []).filter(
      (c) => c.case_id.toLowerCase().includes(q) || c.source?.toLowerCase().includes(q),
    );
  }, [data, search]);

  const selectCls =
    "h-9 rounded-md border border-slate-200 bg-white px-3 text-[13px] text-slate-700 outline-none transition-colors focus:border-slate-400";

  return (
    <DashboardLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Reconciliation</h1>
          <p className="mt-0.5 text-[13px] text-slate-500">Investigate and manage reconciliation cases</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchCases}>
            <RefreshCw className="mr-1 h-3.5 w-3.5" />
            Refresh
          </Button>
          <Button size="sm" onClick={runReconciliation} disabled={running}>
            <Play className="mr-1 h-3.5 w-3.5" />
            {running ? "Running…" : "Run Reconciliation"}
          </Button>
        </div>
      </div>

      {runner && (
        <Card className="mb-4 border-emerald-200 bg-emerald-50">
          <CardContent className="pt-4">
            <p className="text-sm text-emerald-700">
              Reconciliation run <span className="font-mono">{runner}</span> completed successfully.
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="border-b border-slate-200 p-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex h-9 flex-1 min-w-56 items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3">
              <Search className="h-3.5 w-3.5 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search case ID or source…"
                className="flex-1 bg-transparent text-[13px] text-slate-900 outline-none placeholder:text-slate-400"
              />
            </div>
            <select className={selectCls} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All Statuses</option>
              <option value="AUTO_RESOLVED">Auto-Resolved</option>
              <option value="EXCEPTION">Exception</option>
              <option value="HUMAN_REVIEW">Human Review</option>
              <option value="MATCHED">Matched</option>
              <option value="RESOLVED">Resolved</option>
              <option value="REJECTED">Rejected</option>
              <option value="UNPROCESSED">Unprocessed</option>
            </select>
            <select className={selectCls} value={riskFilter} onChange={(e) => setRiskFilter(e.target.value)}>
              <option value="">All Risk Levels</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </select>
            <span className="flex items-center gap-1.5 px-2 text-xs text-slate-400">
              <Filter className="h-3 w-3" />
              {visibleCases.length} of {data?.total ?? 0} cases
            </span>
          </div>
        </CardContent>

        {loading ? (
          <div className="space-y-2 p-4">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        ) : (
          <div className="max-h-[calc(100vh-320px)] overflow-auto scrollbar-thin">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 bg-white">
                <tr className="border-b border-slate-200 text-left text-xs text-slate-400">
                  <th className="px-4 py-3 font-medium">Case</th>
                  <th className="px-4 py-3 font-medium">Amount / Outcome</th>
                  <th className="px-4 py-3 font-medium">Match Score</th>
                  <th className="px-4 py-3 font-medium">Risk</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Source</th>
                  <th className="px-4 py-3 text-right font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {visibleCases.map((c) => (
                  <tr key={c.case_id} className="group border-b border-slate-100 transition-colors hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <p className="font-mono text-xs text-slate-900">{c.case_id}</p>
                      <p className="mt-0.5 text-xs text-slate-400">{c.related_record_ids?.length ?? 0} linked records</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-[13px] font-medium tabular-nums text-slate-900">
                        {((c.amount ?? 0) / 100).toLocaleString("en-IN", {
                          style: "currency",
                          currency: c.currency || "INR",
                        })}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-400">{c.outcome_type || "-"}</p>
                    </td>
                    <td className="px-4 py-3">
                      <ScoreCell score={c.match_score} />
                    </td>
                    <td className="px-4 py-3">{riskBadge(c.risk)}</td>
                    <td className="px-4 py-3">{statusBadge(c.status)}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{c.source}</td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/exceptions/${c.case_id}`}>
                        <Button variant="ghost" size="sm" className="text-slate-500 group-hover:text-slate-900">
                          View <ArrowRight className="ml-1 h-3 w-3" />
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
                {visibleCases.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-sm text-slate-400">
                      No cases found. Run reconciliation to generate cases.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </DashboardLayout>
  );
}

function riskBadge(risk: string) {
  return <Badge variant={riskMap[risk] || "default"}>{risk}</Badge>;
}

function statusBadge(status: string) {
  return <Badge variant={statusMap[status] || "default"}>{status}</Badge>;
}