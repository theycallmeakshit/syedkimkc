"use client";

import React from "react";
import { ShieldAlert, ShieldCheck, Cpu, Terminal, RefreshCw } from "lucide-react";
import { CANARY_TOKENS } from "@/lib/pipeline/stage6-egress";

interface NavbarProps {
  onResetSession: () => void;
  isBackendHealthy: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ onResetSession, isBackendHealthy }) => {
  return (
    <header className="border-b border-slate-800 bg-slate-950/90 backdrop-blur-md px-4 py-3 sticky top-0 z-50">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 max-w-[1920px] mx-auto">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/20 text-white font-bold">
            <ShieldCheck className="w-6 h-6" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-950 animate-pulse" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-black tracking-tight text-slate-100 flex items-center gap-1.5">
                AEGIS<span className="text-cyan-400">-AI</span>
              </span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-800/60 text-cyan-300">
                v2.6 PROXY GATEWAY
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                CYBERCUP 6.0 | PS: CC6-AI03
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Enterprise AI Security Gateway & SOC Dashboard (Reverse-Proxy Pattern)
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          {/* Microservice health badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-xs font-mono">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-400">OCR & cv2 Engine:</span>
            <span className={isBackendHealthy ? "text-emerald-400 font-semibold flex items-center gap-1" : "text-amber-400"}>
              <span className={`w-1.5 h-1.5 rounded-full ${isBackendHealthy ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              {isBackendHealthy ? "RapidOCR + OpenCV Online" : "Connecting..."}
            </span>
          </div>

          {/* Canary token badge */}
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-xs font-mono">
            <Terminal className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-slate-400">Active Canary:</span>
            <span className="text-amber-300 font-semibold truncate max-w-[160px]" title={CANARY_TOKENS[0]}>
              {CANARY_TOKENS[0].slice(0, 18)}...
            </span>
          </div>

          {/* Pipeline Status */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-950/50 border border-emerald-800/60 text-xs font-mono text-emerald-300">
            <ShieldAlert className="w-3.5 h-3.5 text-emerald-400" />
            <span>7 Stages Armed</span>
          </div>

          {/* Reset button */}
          <button
            onClick={onResetSession}
            title="Reset Sandbox & Refresh SOC View"
            className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-slate-300 hover:text-white transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        </div>
      </div>
    </header>
  );
};
