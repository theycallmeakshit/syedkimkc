"use client";

import React, { useState } from "react";
import { GatewayResponse, AuditLogEntry, PipelineStageResult } from "@/lib/types";
import { ThreatMetrics } from "./ThreatMetrics";
import { PipelineStepper } from "./PipelineStepper";
import { DiffViewer } from "./DiffViewer";
import { VisualRedactionViewer } from "./VisualRedactionViewer";
import { AuditLogTable } from "./AuditLogTable";
import { RbacPolicyMatrix } from "./RbacPolicyMatrix";
import { 
  ShieldAlert, 
  Scan, 
  GitCompare, 
  FileSpreadsheet, 
  Sliders, 
  Layers,
  Activity
} from "lucide-react";

interface SocInspectorProps {
  currentResponse?: GatewayResponse;
  metrics: {
    totalRequests: number;
    blockedRequests: number;
    maskedRequests: number;
    piiRedactedCount: number;
    rbacQuarantinedCount: number;
    canaryBreachesIntercepted: number;
    avgLatencyMs: number;
  };
  auditLogs: AuditLogEntry[];
  onRefreshAudit: () => void;
}

export const SocInspector: React.FC<SocInspectorProps> = ({
  currentResponse,
  metrics,
  auditLogs,
  onRefreshAudit,
}) => {
  const [activeTab, setActiveTab] = useState<"pipeline" | "diff" | "ocr" | "audit" | "rbac">("pipeline");

  // Default fallback stages if no request has run yet
  const displayStages: PipelineStageResult[] = currentResponse?.stageResults || [
    {
      stageNumber: 1,
      stageName: "Inbound Modality Router",
      status: "PASSED",
      decision: "PASSED",
      latencyMs: 1,
      summary: "Armed: Inbound Modality Router standby for text and image uploads.",
      details: ["Awaiting inbound transaction", "Supported formats: Text, PNG, JPG, WebP"]
    },
    {
      stageNumber: 2,
      stageName: "OCR & Visual Redaction",
      status: "PASSED",
      decision: "PASSED",
      latencyMs: 1,
      summary: "Armed: RapidOCR + cv2.rectangle solid blackout engine loaded.",
      details: ["Local ONNX runtime active on port 8000", "Bounding box detector: Online"]
    },
    {
      stageNumber: 3,
      stageName: "Sensitive Identifier & PII Sanitizer",
      status: "PASSED",
      decision: "PASSED",
      latencyMs: 1,
      summary: "Armed: 7 PII & Credential regex engines loaded. Reversible token vault ready.",
      details: ["Target patterns: PAN, Aadhaar, SSN, Credit Cards, Accounts, Phone, API Keys"]
    },
    {
      stageNumber: 4,
      stageName: "Prompt Injection Heuristics",
      status: "PASSED",
      decision: "PASSED",
      latencyMs: 1,
      summary: "Armed: Direct & Indirect jailbreak signatures, base64 decoder & leetspeak translator active.",
      details: ["Immediate 403 Forbidden trigger threshold: Score >= 45/100"]
    },
    {
      stageNumber: 5,
      stageName: "Access-Controlled RAG via RBAC",
      status: "PASSED",
      decision: "PASSED",
      latencyMs: 1,
      summary: "Armed: Role-Based Access Control matrix configured for 6 clearance levels.",
      details: ["Quarantines restricted document chunks before prompt composition"]
    },
    {
      stageNumber: 6,
      stageName: "Outbound Egress Filter",
      status: "PASSED",
      decision: "PASSED",
      latencyMs: 1,
      summary: "Armed: Active canary tripwire (AEGIS-CANARY-SEC-99823) and credentials egress filter active.",
      details: ["Prevents canary leakage, database strings, and upstream token reflection"]
    },
    {
      stageNumber: 7,
      stageName: "Telemetry & Zero-Knowledge Audit Log",
      status: "PASSED",
      decision: "PASSED",
      latencyMs: 1,
      summary: "Armed: Zero-Knowledge SHA-256 hasher active. 0 raw plaintext retained.",
      details: ["Emits latency, action [ALLOW/MASK/BLOCK], and threat classification"]
    }
  ];

  return (
    <div className="flex flex-col h-full bg-slate-950/60 rounded-2xl border border-slate-800/80 overflow-hidden shadow-xl">
      {/* TOP HEADER */}
      <div className="p-3.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
              <span>SOC Inspector & Payload Diff Cockpit</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                Right 50%
              </span>
            </div>
            <div className="text-[11px] text-slate-400">
              Live Reverse-Proxy Telemetry, Inspection Stepper & Zero-Knowledge Logs
            </div>
          </div>
        </div>

        {currentResponse && (
          <div className="flex items-center gap-2">
            <span
              className={`px-2.5 py-1 rounded-md text-xs font-mono font-bold uppercase border ${
                currentResponse.action === "BLOCK"
                  ? "bg-rose-950/80 text-rose-300 border-rose-800"
                  : currentResponse.action === "MASK"
                  ? "bg-amber-950/80 text-amber-300 border-amber-800"
                  : "bg-emerald-950/80 text-emerald-300 border-emerald-800"
              }`}
            >
              Action: {currentResponse.action}
            </span>
          </div>
        )}
      </div>

      {/* THREAT METRICS BAR */}
      <div className="p-2.5 border-b border-slate-800/80 bg-slate-950/40">
        <ThreatMetrics metrics={metrics} />
      </div>

      {/* NAVIGATION TABS */}
      <div className="px-3 pt-2 bg-slate-900/50 border-b border-slate-800 flex items-center gap-1 overflow-x-auto text-xs">
        <button
          onClick={() => setActiveTab("pipeline")}
          className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-medium transition-all ${
            activeTab === "pipeline"
              ? "border-cyan-400 text-cyan-300 font-bold bg-slate-900/80"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>7-Stage Pipeline</span>
        </button>

        <button
          onClick={() => setActiveTab("diff")}
          className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-medium transition-all ${
            activeTab === "diff"
              ? "border-cyan-400 text-cyan-300 font-bold bg-slate-900/80"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <GitCompare className="w-3.5 h-3.5" />
          <span>Payload Diff</span>
        </button>

        <button
          onClick={() => setActiveTab("ocr")}
          className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-medium transition-all ${
            activeTab === "ocr"
              ? "border-cyan-400 text-cyan-300 font-bold bg-slate-900/80"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Scan className="w-3.5 h-3.5" />
          <span>Visual Redaction (cv2)</span>
          {currentResponse?.ocrData && currentResponse.ocrData.redacted_count > 0 && (
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          )}
        </button>

        <button
          onClick={() => setActiveTab("audit")}
          className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-medium transition-all ${
            activeTab === "audit"
              ? "border-cyan-400 text-cyan-300 font-bold bg-slate-900/80"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <FileSpreadsheet className="w-3.5 h-3.5" />
          <span>Zero-Knowledge Audit</span>
          <span className="px-1.5 py-0.2 rounded bg-slate-800 text-[10px] text-slate-400 font-mono">
            {auditLogs.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("rbac")}
          className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-medium transition-all ${
            activeTab === "rbac"
              ? "border-cyan-400 text-cyan-300 font-bold bg-slate-900/80"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>RBAC Matrix & Canary</span>
        </button>
      </div>

      {/* TAB CONTENT BODY */}
      <div className="flex-1 p-3.5 overflow-y-auto">
        {activeTab === "pipeline" && (
          <PipelineStepper stages={displayStages} />
        )}

        {activeTab === "diff" && (
          <DiffViewer
            originalPayload={currentResponse?.originalPayload || ""}
            sanitizedPayload={currentResponse?.sanitizedPayload || ""}
            rawModelResponse={currentResponse?.rawModelResponse}
            egressFilteredResponse={currentResponse?.egressFilteredResponse || ""}
            tokenVaultMap={currentResponse?.tokenVaultMap || {}}
            isBlocked={currentResponse?.action === "BLOCK"}
          />
        )}

        {activeTab === "ocr" && (
          <VisualRedactionViewer ocrData={currentResponse?.ocrData} />
        )}

        {activeTab === "audit" && (
          <AuditLogTable logs={auditLogs} onRefresh={onRefreshAudit} />
        )}

        {activeTab === "rbac" && (
          <RbacPolicyMatrix />
        )}
      </div>
    </div>
  );
};
