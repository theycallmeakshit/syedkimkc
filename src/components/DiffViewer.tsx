"use client";

import React, { useState } from "react";
import * as Diff from "diff";
import { ArrowRight, Copy, Check, ShieldCheck, Key, ShieldAlert } from "lucide-react";

interface DiffViewerProps {
  originalPayload: string;
  sanitizedPayload: string;
  rawModelResponse?: string;
  egressFilteredResponse: string;
  tokenVaultMap: Record<string, string>;
  isBlocked?: boolean;
}

export const DiffViewer: React.FC<DiffViewerProps> = ({
  originalPayload,
  sanitizedPayload,
  rawModelResponse,
  egressFilteredResponse,
  tokenVaultMap,
  isBlocked = false
}) => {
  const [activeTab, setActiveTab] = useState<"inbound" | "outbound" | "vault">("inbound");
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  // Compute word-level diff between original and sanitized inbound payload
  const inboundDiff = Diff.diffWords(originalPayload || "", sanitizedPayload || "");

  // Compute diff between raw model response and egress filtered response
  const outboundDiff = Diff.diffWords(rawModelResponse || "", egressFilteredResponse || "");

  const hasTokens = Object.keys(tokenVaultMap || {}).length > 0;
  const hasEgressChanges = rawModelResponse && rawModelResponse !== egressFilteredResponse;

  return (
    <div className="space-y-4">
      {/* Sub tabs */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => setActiveTab("inbound")}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeTab === "inbound"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-semibold"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Inbound Sanitization Diff
          </button>

          <button
            onClick={() => setActiveTab("outbound")}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
              activeTab === "outbound"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-semibold"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Outbound Egress Guard
            {hasEgressChanges && (
              <span className="w-2 h-2 rounded-sm bg-rose-500 animate-pulse" />
            )}
          </button>

          <button
            onClick={() => setActiveTab("vault")}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
              activeTab === "vault"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-semibold"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Key className="w-3 h-3" />
            Token Vault Map
            {hasTokens && (
              <span className="px-1.5 py-0.2 rounded-sm bg-slate-800 text-[10px] text-amber-300 font-mono">
                {Object.keys(tokenVaultMap).length}
              </span>
            )}
          </button>
        </div>

        <div className="text-[11px] font-mono text-slate-400 hidden sm:block">
          Reverse-Proxy Payload Interception
        </div>
      </div>

      {/* TAB 1: INBOUND SANITIZATION DIFF */}
      {activeTab === "inbound" && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* RAW INBOUND */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden flex flex-col">
              <div className="flex items-center justify-between px-3 py-2 bg-slate-950/80 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-sm bg-rose-500" />
                  <span className="text-xs font-semibold text-slate-200">Raw Inbound Client Payload</span>
                </div>
                <button
                  onClick={() => copyToClipboard(originalPayload, "raw_inbound")}
                  className="p-1 text-slate-400 hover:text-slate-200"
                  title="Copy Raw Inbound"
                >
                  {copied === "raw_inbound" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <div className="p-3 font-mono text-xs text-slate-300 whitespace-pre-wrap break-words leading-relaxed max-h-[300px] overflow-y-auto">
                {originalPayload || <span className="text-slate-500 italic">No inbound payload sent yet.</span>}
              </div>
            </div>

            {/* SANITIZED TRANSMITTED */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden flex flex-col">
              <div className="flex items-center justify-between px-3 py-2 bg-slate-950/80 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-sm bg-emerald-500" />
                  <span className="text-xs font-semibold text-slate-200">Sanitized Transmitted Payload (To LLM)</span>
                </div>
                <button
                  onClick={() => copyToClipboard(sanitizedPayload, "sanitized_outbound")}
                  className="p-1 text-slate-400 hover:text-slate-200"
                  title="Copy Sanitized Payload"
                >
                  {copied === "sanitized_outbound" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <div className="p-3 font-mono text-xs text-slate-300 whitespace-pre-wrap break-words leading-relaxed max-h-[300px] overflow-y-auto">
                {sanitizedPayload || <span className="text-slate-500 italic">No sanitized payload generated yet.</span>}
              </div>
            </div>
          </div>

          {/* COLOR-CODED DIFF STREAM */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/80 overflow-hidden">
            <div className="px-3 py-2 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
              <div className="text-xs font-semibold text-slate-300 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                Color-Coded Tokenization Inspector
              </div>
              <div className="flex items-center gap-3 text-[10px] font-mono">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded bg-rose-500/40 border border-rose-500/60" /> Redacted Plaintext
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded bg-emerald-500/40 border border-emerald-500/60" /> Replaced Token
                </span>
              </div>
            </div>

            <div className="p-3.5 font-mono text-xs leading-relaxed max-h-[220px] overflow-y-auto">
              {inboundDiff.map((part, index) => {
                if (part.added) {
                  return (
                    <span
                      key={index}
                      className="bg-emerald-950/80 text-emerald-300 border border-emerald-700/60 px-1 py-0.5 rounded font-bold mx-0.5"
                    >
                      {part.value}
                    </span>
                  );
                }
                if (part.removed) {
                  return (
                    <span
                      key={index}
                      className="bg-rose-950/80 text-rose-300 line-through border border-rose-700/60 px-1 py-0.5 rounded mx-0.5"
                    >
                      {part.value}
                    </span>
                  );
                }
                return <span key={index} className="text-slate-300">{part.value}</span>;
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: OUTBOUND EGRESS GUARD */}
      {activeTab === "outbound" && (
        <div className="space-y-3">
          {hasEgressChanges && (
            <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-800/80 flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div className="text-xs">
                <div className="font-bold text-rose-300">Outbound Canary / Credential Reflection Quarantined!</div>
                <div className="text-slate-300 mt-0.5">
                  The upstream LLM reflected confidential credentials or gateway canary tokens in its output. AEGIS-AI Stage 6 Outbound Egress Filter intercepted the transmission and neutralized the secret tokens before returning to the user.
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* RAW MODEL RESPONSE */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden flex flex-col">
              <div className="px-3 py-2 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-sm bg-amber-500" />
                  <span className="text-xs font-semibold text-slate-200">Raw Model Response (Pre-Egress Filter)</span>
                </div>
              </div>
              <div className="p-3 font-mono text-xs text-slate-300 whitespace-pre-wrap break-words leading-relaxed max-h-[300px] overflow-y-auto">
                {rawModelResponse || <span className="text-slate-500 italic">No upstream response generated yet.</span>}
              </div>
            </div>

            {/* EGRESS FILTERED */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden flex flex-col">
              <div className="px-3 py-2 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-sm bg-emerald-500" />
                  <span className="text-xs font-semibold text-slate-200">Delivered Client Response (Post-Egress Filter)</span>
                </div>
              </div>
              <div className="p-3 font-mono text-xs text-slate-300 whitespace-pre-wrap break-words leading-relaxed max-h-[300px] overflow-y-auto">
                {egressFilteredResponse || <span className="text-slate-500 italic">No output available.</span>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: REVERSIBLE TOKEN VAULT */}
      {activeTab === "vault" && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
          <div className="p-3 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
              <Key className="w-4 h-4 text-amber-400" />
              Session Reversible Token Vault
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-800/60">
              Ephemeral In-Memory Isolation
            </span>
          </div>

          <div className="p-3 space-y-2">
            <p className="text-xs text-slate-400">
              The reverse-proxy replaces sensitive identifiers with session-bound surrogate tokens. Upstream LLMs and external monitoring systems never receive raw identifiers.
            </p>

            {hasTokens ? (
              <div className="border border-slate-800 rounded-lg overflow-hidden mt-2">
                <table className="w-full text-left font-mono text-xs">
                  <thead className="bg-slate-950 text-slate-400 text-[10px] uppercase border-b border-slate-800">
                    <tr>
                      <th className="py-2 px-3">Surrogate Token (LLM Visible)</th>
                      <th className="py-2 px-3">Protected Raw Value (Internal Vault Only)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 bg-slate-900/40">
                    {Object.entries(tokenVaultMap).map(([token, raw], i) => (
                      <tr key={i} className="hover:bg-slate-800/30">
                        <td className="py-2 px-3 text-emerald-400 font-bold">{token}</td>
                        <td className="py-2 px-3 text-rose-300">
                          {raw.length > 8 ? `${raw.slice(0, 3)}****${raw.slice(-3)}` : '****'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-slate-500 font-mono">
                No active session tokens registered in vault.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
