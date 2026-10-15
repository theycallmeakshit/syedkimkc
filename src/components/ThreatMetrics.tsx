"use client";

import React from "react";
import { ShieldCheck, ShieldAlert, EyeOff, Lock, Clock, Sparkles } from "lucide-react";

interface ThreatMetricsProps {
  metrics: {
    totalRequests: number;
    blockedRequests: number;
    maskedRequests: number;
    piiRedactedCount: number;
    rbacQuarantinedCount: number;
    canaryBreachesIntercepted: number;
    avgLatencyMs: number;
  };
}

export const ThreatMetrics: React.FC<ThreatMetricsProps> = ({ metrics }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-6 gap-2 p-2 bg-slate-900/80 rounded-xl border border-slate-800">
      <div className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-950/60 border border-slate-800/80">
        <div className="p-1.5 rounded-md bg-blue-500/10 text-blue-400">
          <ShieldCheck className="w-4 h-4" />
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">Inspected</div>
          <div className="text-base font-bold text-slate-100 font-mono">{metrics.totalRequests}</div>
        </div>
      </div>

      <div className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-950/60 border border-slate-800/80">
        <div className="p-1.5 rounded-md bg-rose-500/10 text-rose-400">
          <ShieldAlert className="w-4 h-4" />
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">Blocked (403)</div>
          <div className="text-base font-bold text-rose-400 font-mono">{metrics.blockedRequests}</div>
        </div>
      </div>

      <div className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-950/60 border border-slate-800/80">
        <div className="p-1.5 rounded-md bg-amber-500/10 text-amber-400">
          <EyeOff className="w-4 h-4" />
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">PII Sanitized</div>
          <div className="text-base font-bold text-amber-400 font-mono">{metrics.piiRedactedCount}</div>
        </div>
      </div>

      <div className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-950/60 border border-slate-800/80">
        <div className="p-1.5 rounded-md bg-purple-500/10 text-purple-400">
          <Lock className="w-4 h-4" />
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">RBAC Quarantined</div>
          <div className="text-base font-bold text-purple-400 font-mono">{metrics.rbacQuarantinedCount}</div>
        </div>
      </div>

      <div className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-950/60 border border-slate-800/80">
        <div className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-400">
          <Sparkles className="w-4 h-4" />
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">Canary Catches</div>
          <div className="text-base font-bold text-emerald-400 font-mono">{metrics.canaryBreachesIntercepted}</div>
        </div>
      </div>

      <div className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-950/60 border border-slate-800/80">
        <div className="p-1.5 rounded-md bg-cyan-500/10 text-cyan-400">
          <Clock className="w-4 h-4" />
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">Avg Latency</div>
          <div className="text-base font-bold text-cyan-400 font-mono">{metrics.avgLatencyMs}ms</div>
        </div>
      </div>
    </div>
  );
};
