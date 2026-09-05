"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import {
  History,
  Search,
  FilePlus2,
  GitCompareArrows,
  Brain,
  Scale,
  CheckCircle2,
  UserCheck,
  UserX,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AuditEventItem {
  event_id: string;
  case_id?: string;
  event_type: string;
  actor_type: string;
  actor_id?: string;
  detail?: string;
  timestamp: string;
  evidence_ids: string[];
  policy_decision?: { decision: string };
  correlation_id?: string;
}

interface AuditResponse {
  total: number;
  events: AuditEventItem[];
}

const eventColors: Record<string, "default" | "secondary" | "destructive" | "outline" | "success" | "warning"> = {
  CASE_CREATED: "secondary",
  MATCH_PROPOSED: "outline",
  AI_INVESTIGATION_STARTED: "warning",
  AI_INVESTIGATION_COMPLETED: "warning",
  POLICY_EVALUATED: "outline",
  AUTO_RESOLVED: "success",
  HUMAN_APPROVED: "success",
  HUMAN_REJECTED: "destructive",
  EXCEPTION_CREATED: "destructive",
  SYNC_STARTED: "secondary",
  SYNC_COMPLETED: "success",
};

const eventIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  CASE_CREATED: FilePlus2,
  MATCH_PROPOSED: GitCompareArrows,
  AI_INVESTIGATION_STARTED: Brain,
  AI_INVESTIGATION_COMPLETED: Brain,
  POLICY_EVALUATED: Scale,
  AUTO_RESOLVED: CheckCircle2,
  HUMAN_APPROVED: UserCheck,
  HUMAN_REJECTED: UserX,
  EXCEPTION_CREATED: AlertTriangle,
  SYNC_STARTED: RefreshCw,
  SYNC_COMPLETED: RefreshCw,
};

export default function AuditTrail() {
  const [data, setData] = useState<AuditResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [caseFilter, setCaseFilter] = useState("");

  const load = async (caseId?: string) => {
    setLoading(true);
    try {
      const path = caseId ? `/audit/cases/${caseId}` : "/audit";
      const res = await api.get<AuditResponse>(path);
      setData(res);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (caseFilter) {
      load(caseFilter);
    } else {
      load();
    }
  }, [caseFilter]);

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-xl font-semibold text-slate-900">
          <History className="h-5 w-5 text-slate-500" />
          Audit Trail
        </h1>
        <p className="mt-0.5 text-[13px] text-slate-500">Append-only event timeline with full provenance</p>
      </div>

      <Card>
        <CardContent className="flex items-center gap-2 border-b border-slate-200 p-3">
          <Search className="ml-1 h-4 w-4 text-slate-400" />
          <input
            placeholder="Filter by Case ID (optional)"
            value={caseFilter}
            onChange={(e) => setCaseFilter(e.target.value)}
            className="h-9 w-full max-w-md rounded-md border border-slate-200 bg-white px-3 text-[13px] text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-slate-400"
          />
          <span className="ml-auto px-2 text-xs text-slate-400">{data?.total ?? 0} event(s)</span>
        </CardContent>

        {loading ? (
          <div className="space-y-2 p-4">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
        ) : (
          <CardContent className="p-0">
            <div className="relative px-5 py-6">
              {(data?.events ?? []).map((event, i) => {
                const Icon = eventIcons[event.event_type] || History;
                const isLast = i === (data?.events?.length ?? 0) - 1;
                return (
                  <div key={event.event_id} className="relative flex gap-4 pb-7 last:pb-0">
                    <div className="flex flex-col items-center">
                      <div
                        className={cn(
                          "z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border bg-white shadow-sm",
                          eventColors[event.event_type] === "success"
                            ? "border-emerald-200 text-emerald-600"
                            : eventColors[event.event_type] === "destructive"
                              ? "border-rose-200 text-rose-500"
                              : eventColors[event.event_type] === "warning"
                                ? "border-amber-200 text-amber-500"
                                : "border-slate-200 text-slate-400",
                        )}
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      {!isLast && <div className="absolute top-7 bottom-0 w-px bg-slate-200" />}
                    </div>

                    <div className="min-w-0 flex-1 rounded-lg border border-slate-200 px-4 py-3 transition-colors hover:bg-slate-50">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <Badge variant={eventColors[event.event_type] || "default"}>{event.event_type}</Badge>
                        <span className="text-xs text-slate-500">{event.actor_type}</span>
                        {event.actor_id && (
                          <span className="font-mono text-[11px] text-slate-400">{event.actor_id}</span>
                        )}
                        <time className="ml-auto text-xs tabular-nums text-slate-400">
                          {new Date(event.timestamp).toLocaleString()}
                        </time>
                      </div>
                      <p className="mt-1.5 text-[13px] text-slate-700">{event.detail || "no detail"}</p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1">
                        {event.case_id && (
                          <span className="font-mono text-[11px] text-slate-400">case: {event.case_id}</span>
                        )}
                        {event.correlation_id && (
                          <span className="font-mono text-[11px] text-slate-400">corr: {event.correlation_id}</span>
                        )}
                        {event.policy_decision && (
                          <span className="flex items-center gap-1.5 text-xs text-slate-500">
                            Policy: <Badge variant="outline">{event.policy_decision.decision}</Badge>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              {(data?.events?.length ?? 0) === 0 && (
                <p className="p-8 text-center text-sm text-slate-400">No audit events found.</p>
              )}
            </div>
          </CardContent>
        )}
      </Card>
    </DashboardLayout>
  );
}