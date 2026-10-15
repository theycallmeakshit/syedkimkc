"use client";

import React from "react";
import { Lock, Check, ShieldAlert, Key, FileCode } from "lucide-react";
import { CANARY_TOKENS } from "@/lib/pipeline/stage6-egress";

const ROLES = [
  { id: "intern", name: "Intern", level: 1, desc: "Level 1: Public overview documentation only" },
  { id: "contractor", name: "Contractor", level: 1, desc: "Level 1: Public documentation only" },
  { id: "employee", name: "Employee", level: 2, desc: "Level 2: Public + Internal Engineering specs" },
  { id: "finance_analyst", name: "Finance Analyst", level: 3, desc: "Level 3: Public + Internal + Confidential Financials" },
  { id: "c_suite_executive", name: "C-Suite Executive", level: 4, desc: "Level 4: All corporate + Project Titan M&A strategy" },
  { id: "security_admin", name: "Security SuperAdmin", level: 5, desc: "Level 5: Full access including SOC Audit Logs & Canary Keys" },
];

const CLASSIFICATIONS = [
  { id: "PUBLIC", name: "PUBLIC (L1)", minLevel: 1 },
  { id: "INTERNAL", name: "INTERNAL (L2)", minLevel: 2 },
  { id: "CONFIDENTIAL_FINANCIAL", name: "CONFIDENTIAL_FINANCIAL (L3)", minLevel: 3 },
  { id: "RESTRICTED_EXECUTIVE", name: "RESTRICTED_EXECUTIVE (L4)", minLevel: 4 },
  { id: "SECURITY_AUDIT", name: "SECURITY_AUDIT (L5)", minLevel: 5 },
];

export const RbacPolicyMatrix: React.FC = () => {
  return (
    <div className="space-y-4">
      {/* RBAC MATRIX */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
        <div className="px-3.5 py-2.5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-zinc-400" />
            <span className="font-semibold text-slate-200 text-xs">
              Role-Based Access Control (RBAC) Document Clearance Matrix
            </span>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 text-zinc-300 border border-zinc-700">
            Enforced at Stage 5
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead className="bg-slate-950 text-slate-400 text-[10px] uppercase border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Enterprise Role</th>
                {CLASSIFICATIONS.map(c => (
                  <th key={c.id} className="py-2.5 px-3 text-center">
                    {c.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70 bg-slate-900/30">
              {ROLES.map(role => (
                <tr key={role.id} className="hover:bg-slate-800/30">
                  <td className="py-2 px-3 font-semibold text-slate-200 whitespace-nowrap">
                    <div className="text-xs">{role.name}</div>
                    <div className="text-[10px] text-slate-500 font-normal">{role.desc}</div>
                  </td>
                  {CLASSIFICATIONS.map(cls => {
                    const hasAccess = role.level >= cls.minLevel;
                    return (
                      <td key={cls.id} className="py-2 px-3 text-center">
                        {hasAccess ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-emerald-950/80 border border-emerald-700/60 text-emerald-400">
                            <Check className="w-3.5 h-3.5" />
                          </span>
                        ) : (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-rose-950/40 border border-rose-800/40 text-rose-400/80">
                            <Lock className="w-3 h-3" />
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* CANARY & SECRETS REGISTRY */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
          <div className="px-3 py-2 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between text-xs">
            <div className="font-semibold text-slate-200 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
              Active Canary Tripwires (Stage 6)
            </div>
            <span className="text-[10px] font-mono text-emerald-400">ARMED</span>
          </div>
          <div className="p-3 text-xs space-y-2">
            <p className="text-slate-400 text-xs">
              Canary secrets are embedded into system layers. If an external model echoes these tokens during inference, the Egress Filter neutralizes them instantly.
            </p>
            <div className="space-y-1.5 font-mono text-[11px]">
              {CANARY_TOKENS.map((token, idx) => (
                <div key={idx} className="p-2 rounded bg-slate-950 border border-slate-800 text-zinc-300 flex items-center justify-between">
                  <span className="truncate">{token}</span>
                  <span className="text-[10px] uppercase text-rose-400 bg-rose-950 px-1.5 py-0.5 rounded border border-rose-900">Tripwire</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* PII TOKEN PATTERNS */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
          <div className="px-3 py-2 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between text-xs">
            <div className="font-semibold text-slate-200 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-amber-400" />
              Identifier & PII Sanitizer Catalog (Stage 3)
            </div>
            <span className="text-[10px] font-mono text-cyan-400">7 PATTERNS</span>
          </div>
          <div className="p-3 font-mono text-[11px] space-y-1.5 text-slate-300">
            <div className="flex justify-between items-center py-1 border-b border-slate-800/80">
              <span className="text-slate-400">PAN Number:</span>
              <span className="text-emerald-400">{"{{REDACTED_IDENTIFIER_PAN_x}}"}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-800/80">
              <span className="text-slate-400">Aadhaar Card:</span>
              <span className="text-emerald-400">{"{{REDACTED_IDENTIFIER_AADHAAR_x}}"}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-800/80">
              <span className="text-slate-400">Credit Card:</span>
              <span className="text-emerald-400">{"{{REDACTED_FINANCIAL_CARD_x}}"}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-800/80">
              <span className="text-slate-400">Bank Account:</span>
              <span className="text-emerald-400">{"{{REDACTED_FINANCIAL_ACCOUNT_x}}"}</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-400">API Keys (OpenAI/AWS):</span>
              <span className="text-emerald-400">{"{{REDACTED_API_KEY_x}}"}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
