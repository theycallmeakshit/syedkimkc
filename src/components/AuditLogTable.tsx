"use client";

import React, { useState } from "react";
import { AuditLogEntry, GatewayAction } from "@/lib/types";
import { ShieldCheck, ShieldAlert, EyeOff, Hash, Clock, X, Info } from "lucide-react";

interface AuditLogTableProps {
  logs: AuditLogEntry[];
  onRefresh?: () => void;
}

export const AuditLogTable: React.FC<AuditLogTableProps> = ({ logs, onRefresh }) => {
  const [filterAction, setFilterAction] = useState<string>("ALL");
  const [selectedEntry, setSelectedEntry] = useState<AuditLogEntry | null>(null);

  const filteredLogs = logs.filter(log => {
    if (filterAction === "ALL") return true;
    return log.action === filterAction;
  });

  return (
    <div className="space-y-3">
      {/* Filters bar */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs font-mono">
          {(["ALL", "BLOCK", "MASK", "ALLOW"] as const).map(action => (
            <button
              key={action}
              onClick={() => setFilterAction(action)}
              className={`px-2.5 py-1 rounded-md transition-all ${
                filterAction === action
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {action}
            </button>
          ))}
        </div>

        <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
          <Hash className="w-3.5 h-3.5 text-cyan-400" />
          <span>Zero-Knowledge: 0 Plaintext Logged</span>
        </div>
      </div>

      {/* Main Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
        <div className="overflow-x-auto max-h-[420px]">
          <table className="w-full text-left font-mono text-xs">
            <thead className="bg-slate-950 text-slate-400 text-[10px] uppercase border-b border-slate-800 sticky top-0 z-10">
              <tr>
                <th className="py-2.5 px-3">Time</th>
                <th className="py-2.5 px-3">Action</th>
                <th className="py-2.5 px-3">Role</th>
                <th className="py-2.5 px-3">Threat Classification</th>
                <th className="py-2.5 px-3">Risk</th>
                <th className="py-2.5 px-3">SHA-256 Digest</th>
                <th className="py-2.5 px-3">Latency</th>
                <th className="py-2.5 px-3">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70 bg-slate-900/30">
              {filteredLogs.map(log => {
                const isBlock = log.action === "BLOCK";
                const isMask = log.action === "MASK";

                return (
                  <tr
                    key={log.id}
                    onClick={() => setSelectedEntry(log)}
                    className="hover:bg-slate-800/50 cursor-pointer transition-colors"
                  >
                    <td className="py-2 px-3 text-slate-400 text-[11px] whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="py-2 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border flex items-center gap-1 w-max ${
                          isBlock
                            ? "bg-rose-950/80 text-rose-300 border-rose-800"
                            : isMask
                            ? "bg-amber-950/80 text-amber-300 border-amber-800"
                            : "bg-emerald-950/80 text-emerald-300 border-emerald-800"
                        }`}
                      >
                        {isBlock ? <ShieldAlert className="w-2.5 h-2.5" /> : isMask ? <EyeOff className="w-2.5 h-2.5" /> : <ShieldCheck className="w-2.5 h-2.5" />}
                        {log.action}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-cyan-300 font-semibold text-[11px]">
                      {log.userRole}
                    </td>
                    <td className="py-2 px-3 text-slate-200 text-[11px] truncate max-w-[180px]" title={log.summary}>
                      {log.threat !== "NONE" ? log.threat : "CLEAN_PASSTHROUGH"}
                    </td>
                    <td className="py-2 px-3">
                      <span
                        className={`text-[11px] font-bold ${
                          log.riskScore >= 75
                            ? "text-rose-400"
                            : log.riskScore >= 35
                            ? "text-amber-400"
                            : "text-emerald-400"
                        }`}
                      >
                        {log.riskScore}/100
                      </span>
                    </td>
                    <td className="py-2 px-3 text-slate-400 text-[10px] font-mono">
                      {log.zeroKnowledgeHash.slice(0, 10)}...{log.zeroKnowledgeHash.slice(-6)}
                    </td>
                    <td className="py-2 px-3 text-slate-400 text-[11px]">
                      {log.latencyMs}ms
                    </td>
                    <td className="py-2 px-3 text-cyan-400 hover:text-cyan-200 text-[11px]">
                      View
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAIL MODAL / DRAWER */}
      {selectedEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Hash className="w-4 h-4 text-cyan-400" />
                <span className="font-bold text-slate-100 text-sm">
                  Zero-Knowledge Security Event Inspector
                </span>
              </div>
              <button
                onClick={() => setSelectedEntry(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3 font-mono text-xs max-h-[70vh] overflow-y-auto">
              <div>
                <div className="text-[10px] text-slate-500 uppercase">Event UUID</div>
                <div className="text-slate-200 text-xs select-all">{selectedEntry.id}</div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="text-[10px] text-slate-500 uppercase">Timestamp</div>
                  <div className="text-slate-200">{new Date(selectedEntry.timestamp).toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 uppercase">User Role</div>
                  <div className="text-cyan-300 font-bold">{selectedEntry.userRole.toUpperCase()}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 uppercase">Gateway Decision</div>
                  <div className="text-slate-100 font-bold">{selectedEntry.action} (HTTP {selectedEntry.httpStatus})</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 uppercase">Calculated Risk Score</div>
                  <div className="text-rose-400 font-bold">{selectedEntry.riskScore}/100</div>
                </div>
              </div>

              <div>
                <div className="text-[10px] text-slate-500 uppercase">Event Threat Summary</div>
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 text-xs">
                  {selectedEntry.summary}
                </div>
              </div>

              <div>
                <div className="text-[10px] text-slate-500 uppercase">Zero-Knowledge Cryptographic Hash (SHA-256)</div>
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-cyan-300 text-[11px] break-all select-all">
                  {selectedEntry.zeroKnowledgeHash}
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Guarantees verifiable integrity under strict GDPR / HIPAA / ISO 27001 zero-trust logging mandates. Raw plaintexts are never retained in permanent storage.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800 text-center">
                <div className="p-2 rounded bg-slate-950">
                  <div className="text-[10px] text-slate-500">PII Redacted</div>
                  <div className="text-amber-400 font-bold text-sm">{selectedEntry.piiTokensCount}</div>
                </div>
                <div className="p-2 rounded bg-slate-950">
                  <div className="text-[10px] text-slate-500">RBAC Blocked</div>
                  <div className="text-zinc-300 font-bold text-sm">{selectedEntry.ragQuarantinedCount}</div>
                </div>
                <div className="p-2 rounded bg-slate-950">
                  <div className="text-[10px] text-slate-500">Total Latency</div>
                  <div className="text-cyan-400 font-bold text-sm">{selectedEntry.latencyMs}ms</div>
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-950 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedEntry(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
