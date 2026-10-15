"use client";

import React, { useState } from "react";
import { PipelineStageResult } from "@/lib/types";
import { 
  FileText, 
  Scan, 
  EyeOff, 
  ShieldAlert, 
  Database, 
  Lock, 
  Activity, 
  ChevronDown, 
  ChevronRight, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Clock
} from "lucide-react";

interface PipelineStepperProps {
  stages: PipelineStageResult[];
  activeStage?: number;
}

const STAGE_ICONS: Record<number, React.ReactNode> = {
  1: <FileText className="w-4 h-4" />,
  2: <Scan className="w-4 h-4" />,
  3: <EyeOff className="w-4 h-4" />,
  4: <ShieldAlert className="w-4 h-4" />,
  5: <Database className="w-4 h-4" />,
  6: <Lock className="w-4 h-4" />,
  7: <Activity className="w-4 h-4" />
};

export const PipelineStepper: React.FC<PipelineStepperProps> = ({ stages }) => {
  const [expandedStage, setExpandedStage] = useState<number | null>(null);

  const toggleExpand = (stageNum: number) => {
    setExpandedStage(prev => (prev === stageNum ? null : stageNum));
  };

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between pb-1 border-b border-slate-800">
        <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Reverse-Proxy Pipeline Execution (7 Stages)
        </div>
        <div className="text-[11px] font-mono text-slate-400">
          Total Latency: <span className="text-cyan-400 font-bold">{stages.reduce((acc, s) => acc + s.latencyMs, 0)}ms</span>
        </div>
      </div>

      <div className="space-y-2">
        {stages.map((stage) => {
          const isExpanded = expandedStage === stage.stageNumber;
          const isBlocked = stage.decision === "BLOCKED";
          const isMasked = stage.decision === "MASKED";
          const isPassed = stage.decision === "PASSED";

          let borderClass = "border-slate-800 bg-slate-900/50 hover:border-slate-700";
          let badgeClass = "bg-slate-800 text-slate-400 border-slate-700";
          let statusIcon = <CheckCircle2 className="w-4 h-4 text-emerald-400" />;

          if (isBlocked) {
            borderClass = "border-rose-800/80 bg-rose-950/20";
            badgeClass = "bg-rose-900/40 text-rose-300 border-rose-700/60";
            statusIcon = <XCircle className="w-4 h-4 text-rose-400" />;
          } else if (isMasked) {
            borderClass = "border-amber-800/80 bg-amber-950/20";
            badgeClass = "bg-amber-900/40 text-amber-300 border-amber-700/60";
            statusIcon = <AlertTriangle className="w-4 h-4 text-amber-400" />;
          } else if (isPassed) {
            borderClass = "border-emerald-800/40 bg-emerald-950/10";
            badgeClass = "bg-emerald-900/30 text-emerald-300 border-emerald-700/50";
            statusIcon = <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
          }

          return (
            <div
              key={stage.stageNumber}
              className={`rounded-lg border transition-all duration-200 overflow-hidden ${borderClass}`}
            >
              <div
                onClick={() => toggleExpand(stage.stageNumber)}
                className="flex items-center justify-between p-3 cursor-pointer select-none"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-1.5 rounded-md border ${badgeClass}`}>
                    {STAGE_ICONS[stage.stageNumber] || <FileText className="w-4 h-4" />}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-slate-400">Stage {stage.stageNumber}:</span>
                      <span className="text-sm font-semibold text-slate-100">{stage.stageName}</span>
                    </div>
                    <div className="text-xs text-slate-400 line-clamp-1 mt-0.5">
                      {stage.summary}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 text-[11px] font-mono text-slate-400">
                    <Clock className="w-3 h-3 text-slate-500" />
                    <span>{stage.latencyMs}ms</span>
                  </div>

                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider uppercase border ${badgeClass} flex items-center gap-1`}>
                    {statusIcon}
                    {stage.decision}
                  </span>

                  <div className="text-slate-500 hover:text-slate-300">
                    {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </div>
                </div>
              </div>

              {isExpanded && (
                <div className="px-3.5 pb-3 pt-1 border-t border-slate-800/80 bg-slate-950/70 text-xs space-y-2">
                  <div className="text-[11px] font-mono uppercase text-slate-400 tracking-wider">
                    Execution Log & Metadata
                  </div>
                  <ul className="space-y-1 font-mono text-[11px] text-slate-300">
                    {stage.details.map((detail, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-cyan-400 select-none">›</span>
                        <span className="break-all">{detail}</span>
                      </li>
                    ))}
                  </ul>

                  {stage.metadata && Object.keys(stage.metadata).length > 0 && (
                    <div className="mt-2 pt-2 border-t border-slate-900">
                      <div className="text-[10px] uppercase text-slate-500 font-mono mb-1">Raw Telemetry Attributes</div>
                      <pre className="p-2 rounded bg-slate-900 border border-slate-800 text-[10px] font-mono text-cyan-300 overflow-x-auto max-h-36">
                        {JSON.stringify(stage.metadata, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
