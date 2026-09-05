"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { RefreshCw, Save, RotateCcw, CircleHelp } from "lucide-react";
import { cn } from "@/lib/utils";

interface Thresholds {
  confidence_threshold: number;
  max_auto_tolerance: number;
  high_impact_threshold: number;
  min_evidence_ids: number;
  auto_close_match_score: number;
}

interface Toggles {
  enforce_high_impact_gate: boolean;
  auto_close_medium_risk: boolean;
  auto_close_high_risk: boolean;
  enforce_multi_candidate_gate: boolean;
  enforce_discrepancy_tolerance: boolean;
  require_low_risk_for_deterministic_auto_close: boolean;
}

interface PolicyConfig {
  version: number;
  enabled: boolean;
  thresholds: Thresholds;
  toggles: Toggles;
  description: string;
  updated_at: string;
  updated_by: string;
  change_note: string;
}

interface Change {
  field: string;
  from: unknown;
  to: unknown;
}

const THRESHOLD_FIELDS: { key: keyof Thresholds; label: string; hint: string; unit?: string }[] = [
  { key: "confidence_threshold", label: "Confidence threshold", hint: "Min AI confidence (0–1) to auto-close", unit: "" },
  { key: "max_auto_tolerance", label: "Max auto tolerance", hint: "Max amount discrepancy (minor units) allowed for auto-close", unit: "" },
  { key: "high_impact_threshold", label: "High impact threshold", hint: "Amount (minor units) above which human review is required", unit: "" },
  { key: "min_evidence_ids", label: "Min evidence IDs", hint: "Min linked evidence items required to auto-close", unit: "" },
  { key: "auto_close_match_score", label: "Auto-close match score", hint: "Deterministic match score needed to auto-close", unit: "" },
];

const TOGGLE_FIELDS: { key: keyof Toggles; label: string; hint: string }[] = [
  { key: "enforce_high_impact_gate", label: "Enforce high-impact gate", hint: "Route high-value cases to human review" },
  { key: "auto_close_medium_risk", label: "Allow medium-risk auto-close", hint: "Permit AI to auto-close MEDIUM risk cases (higher risk)" },
  { key: "auto_close_high_risk", label: "Allow high-risk auto-close", hint: "Permit AI to auto-close HIGH/CRITICAL risk cases (very high risk)" },
  { key: "enforce_multi_candidate_gate", label: "Enforce multi-candidate gate", hint: "Send ambiguous (multiple candidate) cases to human review" },
  { key: "enforce_discrepancy_tolerance", label: "Enforce discrepancy tolerance", hint: "Block auto-close when the amount diff exceeds tolerance" },
  { key: "require_low_risk_for_deterministic_auto_close", label: "Require low risk for deterministic auto-close", hint: "Deterministic (no-AI) auto-close only for LOW risk cases" },
];

function Toggle({
  on,
  onChange,
  label,
}: {
  on: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        on ? "bg-emerald-600" : "bg-slate-200",
      )}
    >
      <span
        className={cn(
          "inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform",
          on ? "translate-x-[18px]" : "translate-x-0.5",
        )}
      />
    </button>
  );
}

function PolicyEditor() {
  const [config, setConfig] = useState<PolicyConfig | null>(null);
  const [dirty, setDirty] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [changes, setChanges] = useState<Change[]>([]);
  const [changeNote, setChangeNote] = useState("");

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const res = await api.get<PolicyConfig>("/policy");
      setConfig(res);
      setDirty(false);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const patchThreshold = (key: keyof Thresholds, raw: string) => {
    if (!config) return;
    const num = parseFloat(raw);
    const value = Number.isFinite(num) ? num : config.thresholds[key];
    setConfig({ ...config, thresholds: { ...config.thresholds, [key]: value } });
    setDirty(true);
  };

  const patchToggle = (key: keyof Toggles, value: boolean) => {
    if (!config) return;
    setConfig({ ...config, toggles: { ...config.toggles, [key]: value } });
    setDirty(true);
  };

  const resetToDefaults = async () => {
    try {
      const defaults = await api.get<PolicyConfig>("/policy/defaults");
      setConfig(defaults);
      setDirty(true);
      setMessage("Default values loaded. Click Save to apply.");
    } catch (e) {
      console.error(e);
    }
  };

  const save = async () => {
    if (!config) return;
    setSaving(true);
    setMessage("");
    try {
      const res = await api.put<{ config: PolicyConfig; changes: Change[]; version: number }>("/policy", {
        thresholds: config.thresholds,
        toggles: config.toggles,
        updated_by: localStorage.getItem("recofin_role") || "admin",
        change_note: changeNote || "Policy update via UI",
      });
      setConfig(res.config);
      setChanges(res.changes || []);
      setDirty(false);
      setMessage(`Saved. Policy now at version ${res.config.version}.`);
    } catch (e) {
      setMessage(`Save failed: ${e instanceof Error ? e.message : String(e)}`);
    }
    setSaving(false);
  };

  const fmt = (v: unknown) => (typeof v === "boolean" ? (v ? "on" : "off") : JSON.stringify(v));

  return (
    <DashboardLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Policy Configuration</h1>
          <p className="mt-0.5 text-[13px] text-slate-500">
            Live ruleset. Edits take effect at runtime — the next evaluation reads this config.
          </p>
          {config && (
            <div className="mt-1.5 flex items-center gap-1.5 text-[13px] text-slate-500">
              <Badge variant="secondary">v{config.version}</Badge>
              <span>· {config.updated_by} · {new Date(config.updated_at).toLocaleString()}</span>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={resetToDefaults}>
            <RotateCcw className="mr-1 h-3.5 w-3.5" />
            Load Defaults
          </Button>
          <Button variant="outline" size="sm" onClick={fetchConfig}>
            <RefreshCw className="mr-1 h-3.5 w-3.5" />
            Refresh
          </Button>
        </div>
      </div>

      {message && (
        <div className={cn(
          "mb-4 rounded-lg border px-4 py-2.5 text-sm",
          message.startsWith("Save failed")
            ? "border-rose-200 bg-rose-50 text-rose-700"
            : "border-emerald-200 bg-emerald-50 text-emerald-700",
        )}>
          {message}
        </div>
      )}

      {loading && !config ? (
        <div className="space-y-4">
          <Skeleton className="h-56 rounded-xl" />
          <Skeleton className="h-72 rounded-xl" />
        </div>
      ) : config ? (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Thresholds</CardTitle>
              <CardDescription>Numerical gates the controller uses to classify and close cases</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {THRESHOLD_FIELDS.map((f) => (
                <div key={f.key} className="rounded-lg border border-slate-200 p-3.5">
                  <div className="flex items-center gap-1.5">
                    <label className="text-[13px] font-medium text-slate-700">{f.label}</label>
                    <CircleHelp className="h-3.5 w-3.5 text-slate-300" aria-hidden="true" />
                  </div>
                  <input
                    type="number"
                    step="any"
                    value={config.thresholds[f.key]}
                    onChange={(e) => patchThreshold(f.key, e.target.value)}
                    title={f.hint}
                    className="mt-2 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm tabular-nums text-slate-900 outline-none transition-colors focus:border-slate-400"
                  />
                  <p className="mt-1.5 text-xs leading-relaxed text-slate-400">{f.hint}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Rule Gates</CardTitle>
              <CardDescription>Toggle which authorization guards are enforced at runtime</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {TOGGLE_FIELDS.map((f) => (
                <div
                  key={f.key}
                  className="flex items-start justify-between gap-4 rounded-lg border border-slate-200 px-4 py-3 transition-colors hover:bg-slate-50"
                >
                  <div>
                    <p className="text-[13px] font-medium text-slate-900">{f.label}</p>
                    <p className="mt-0.5 text-xs text-slate-400">{f.hint}</p>
                  </div>
                  <Toggle on={config.toggles[f.key]} onChange={(v) => patchToggle(f.key, v)} label={f.label} />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Save & Audit</CardTitle>
              <CardDescription>Changes are written to the audit trail with your identity</CardDescription>
            </CardHeader>
            <CardContent>
              <label className="mb-1 block text-[13px] font-medium text-slate-700">Change note (audit trail)</label>
              <input
                value={changeNote}
                onChange={(e) => setChangeNote(e.target.value)}
                placeholder="e.g. Relax tolerance for settlement fee cases"
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-colors focus:border-slate-400"
              />
              <div className="mt-4 flex items-center justify-between">
                <p className={cn("text-[13px]", dirty ? "font-medium text-amber-600" : "text-slate-400")}>
                  {dirty ? "Unsaved changes" : "No pending changes"}
                </p>
                <Button onClick={save} disabled={saving || !dirty}>
                  <Save className="mr-1 h-3.5 w-3.5" />
                  {saving ? "Saving…" : "Save & Apply"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {changes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Last change</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="divide-y divide-slate-100">
                  {changes.map((c) => (
                    <div key={c.field} className="flex items-center justify-between py-2 text-[13px]">
                      <span className="font-mono text-xs text-slate-600">{c.field}</span>
                      <span className="flex items-center gap-2 text-slate-500">
                        <Badge variant="secondary">{fmt(c.from)}</Badge>
                        <span>→</span>
                        <Badge variant="success">{fmt(c.to)}</Badge>
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      ) : null}
    </DashboardLayout>
  );
}

export default function Policies() {
  return <PolicyEditor />;
}