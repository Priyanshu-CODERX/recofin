"use client";

import { useState, useEffect, Suspense, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  MarkerType,
  Position,
} from "reactflow";
import "reactflow/dist/style.css";
import { DashboardLayout } from "@/components/layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Network, Search, ZoomIn, Move } from "lucide-react";

interface GraphNode {
  id: string;
  type: string;
  amount: number;
  currency: string;
  status: string;
  source: string;
  description?: string;
}

interface GraphEdge {
  source: string;
  target: string;
  edge_type: string;
  label?: string;
}

interface EvidenceGraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

const NODE_COLORS: Record<string, string> = {
  payment: "#10b981",
  settlement: "#6366f1",
  bank_transaction: "#f59e0b",
  order: "#3b82f6",
  invoice: "#8b5cf6",
  fee: "#ef4444",
  tax: "#ef4444",
  refund: "#ec4899",
  chargeback: "#dc2626",
  adjustment: "#84cc16",
};

function EvidenceGraphContent() {
  const searchParams = useSearchParams();
  const caseParam = searchParams.get("case");
  const [caseId, setCaseId] = useState(caseParam || "");
  const [input, setInput] = useState(caseParam || "");
  const [data, setData] = useState<EvidenceGraphData | null>(null);
  const [loading, setLoading] = useState(false);

  const loadGraph = useCallback(async (id: string) => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await api.get<EvidenceGraphData>(`/cases/${id}/graph`);
      setData(res);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (caseParam) loadGraph(caseParam);
  }, [caseParam, loadGraph]);

  const getNodeColor = (type: string) => NODE_COLORS[type] || "#64748b";

  const nodes: Node[] = (data?.nodes ?? []).map((n, i) => ({
    id: n.id,
    position: { x: (i % 4) * 180, y: Math.floor(i / 4) * 140 },
    data: {
      label: (
        <div
          className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm"
          style={{ minWidth: 150 }}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <span
                className="inline-block h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: getNodeColor(n.type) }}
              />
              <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-700">{n.type}</span>
            </div>
            <Badge variant="secondary" className="px-1.5 py-0 text-[9px]">
              {n.source}
            </Badge>
          </div>
          <p className="mt-1.5 truncate font-mono text-[10px] text-slate-400">{n.id}</p>
          <p className="mt-1 text-sm font-semibold tabular-nums text-slate-900">
            {((n.amount ?? 0) / 100).toLocaleString("en-IN", {
              style: "currency",
              currency: n.currency || "INR",
            })}
          </p>
          <p className="text-[10px] text-slate-400">{n.status}</p>
        </div>
      ),
    },
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
  }));

  const edges: Edge[] = (data?.edges ?? []).map((e, i) => ({
    id: `e-${i}`,
    source: e.source,
    target: e.target,
    label: e.edge_type,
    style: { stroke: "#94a3b8", strokeWidth: 1.5 },
    markerEnd: { type: MarkerType.ArrowClosed },
    labelStyle: { fill: "#64748b", fontSize: 10 },
  }));

  const runCount = data?.nodes.filter((n) => n.type === "payment")?.length ?? null;

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-xl font-semibold text-slate-900">
          <Network className="h-5 w-5 text-slate-500" />
          Evidence Graph
        </h1>
        <p className="mt-0.5 text-[13px] text-slate-500">Visualize record relationships and provenance chains</p>
      </div>

      <Card>
        <CardContent className="flex flex-wrap items-center gap-2 border-b border-slate-200 p-3">
          <div className="relative flex min-w-72 flex-1 items-center">
            <Search className="absolute left-3 h-3.5 w-3.5 text-slate-400" />
            <Input
              placeholder="Enter Case ID (e.g. CASE_pay_123)"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setCaseId(input);
                  loadGraph(input);
                }
              }}
              className="h-9 w-full pl-8"
            />
          </div>
          <Button
            size="sm"
            onClick={() => {
              setCaseId(input);
              loadGraph(input);
            }}
          >
            Load Graph
          </Button>
          {caseId && (
            <span className="flex items-center gap-1.5 px-2 text-xs text-slate-400">
              <span className="font-mono">{caseId}</span>
              {runCount != null && <span>· {runCount} payment node(s)</span>}
            </span>
          )}
        </CardContent>

        {loading ? (
          <CardContent className="p-4">
            <Skeleton className="h-[500px] rounded-xl" />
          </CardContent>
        ) : data ? (
          <CardContent className="p-4">
            <div className="dot-grid h-[500px] overflow-hidden rounded-xl border border-slate-200">
              <ReactFlow nodes={nodes} edges={edges} fitView attributionPosition="bottom-right">
                <Background gap={18} size={1} color="#cbd5e1" />
                <Controls />
                <MiniMap pannable zoomable />
              </ReactFlow>
            </div>
            <div className="mt-3 flex items-center gap-4 text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <Move className="h-3 w-3" /> Drag to pan
              </span>
              <span className="flex items-center gap-1">
                <ZoomIn className="h-3 w-3" /> Scroll to zoom
              </span>
              <span className="ml-auto">{data.nodes.length} nodes · {data.edges.length} edges</span>
            </div>
          </CardContent>
        ) : (
          <CardContent className="p-8 text-center text-sm text-slate-400">
            Enter a case ID above to view its evidence graph.
          </CardContent>
        )}
      </Card>
    </DashboardLayout>
  );
}

export default function EvidenceGraphPage() {
  return (
    <Suspense>
      <EvidenceGraphContent />
    </Suspense>
  );
}