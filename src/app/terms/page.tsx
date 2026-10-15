import React from "react";
import Link from "next/link";
import { ArrowLeft, ShieldAlert, FileText, CheckCircle2, AlertTriangle } from "lucide-react";

export const metadata = {
  title: "Terms and Conditions | AEGIS-AI Enterprise Security Gateway",
  description: "Terms of Service, Acceptable AI Use Guidelines, and Gateway Proxy Service Agreement.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#080d1a] text-slate-100 flex flex-col font-sans antialiased">
      <header className="h-14 bg-[#0f172a] border-b border-[#334155] px-6 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-2 text-xs font-mono text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Gateway</span>
          </Link>
          <span className="text-slate-600">|</span>
          <span className="font-mono text-xs font-bold text-slate-200">
            AEGIS-AI Terms and Conditions of Service
          </span>
        </div>
        <div className="text-[11px] font-mono text-slate-400">
          Last Updated: October 15, 2026
        </div>
      </header>

      <main id="main-content" className="flex-1 max-w-4xl w-full mx-auto p-6 md:p-10 space-y-8 text-xs leading-relaxed text-slate-300">
        <div className="space-y-2 border-b border-[#334155] pb-6">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-slate-300 font-mono text-[11px]">
            <FileText className="w-3.5 h-3.5 text-cyan-400" />
            <span>Enterprise Gateway Proxy Agreement: Document Ref #AGY-TERMS-2026</span>
          </div>
          <h1 className="text-2xl font-bold font-mono text-white tracking-tight">
            Terms of Service & AI Gateway Operational Agreement
          </h1>
          <p className="text-slate-400 text-sm">
            Mandatory conditions governing all programmatic, interactive, and reverse-proxy usage of the AEGIS-AI boundary.
          </p>
        </div>

        <section className="space-y-3">
          <h2 className="text-sm font-bold font-mono text-cyan-400 uppercase tracking-wider flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            1. Scope of Reverse-Proxy Protection
          </h2>
          <p>
            By accessing or connecting an interface to the AEGIS-AI Gateway, organizations and authorized operators acknowledge that all payload transactions (text queries and multi-modal image buffers) will be subjected to the mandatory 7-stage evaluation pipeline prior to upstream dispatch.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-bold font-mono text-rose-400 uppercase tracking-wider flex items-center gap-2">
            <ShieldAlert className="w-4 h-4" />
            2. Adversarial Injections and Prohibited Usage
          </h2>
          <p>
            Users and client systems are strictly prohibited from attempting to bypass, evade, or disable the security heuristic inspection engines. Prohibited actions include:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-slate-400">
            <li>Submitting direct or indirect jailbreak sequences (such as "ignore previous instructions" or "system override").</li>
            <li>Submitting obfuscated payloads via Base64, hex encoding, or homoglyph character substitution with intent to conceal attack directives.</li>
            <li>Probing or exfiltrating gateway canary keys (e.g. <code>AEGIS-CANARY-SEC-99823</code>) or underlying infrastructure configurations.</li>
          </ul>
          <p>
            Any payload triggering a Stage 4 score equal to or exceeding 45/100 will immediately result in an automated HTTP 403 Forbidden rejection and immutable SOC telemetry registration.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-bold font-mono text-amber-400 uppercase tracking-wider flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            3. Role-Based Authorization
          </h2>
          <p>
            Clients must transmit valid credentials reflecting the appropriate privilege tier. The gateway will quarantine and drop document chunks that exceed the user's role authorization without exception. Attempting to spoof privilege headers constitutes a material breach of operational policy.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-bold font-mono text-cyan-400 uppercase tracking-wider flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            4. Service Availability & Telemetry
          </h2>
          <p>
            The gateway guarantees inline inspection overhead within target specifications (typically under 25 milliseconds per transaction). Statistical indicators displayed across the console represent real-time measurements computed across inspected transaction logs.
          </p>
        </section>

        <section className="pt-6 border-t border-[#334155] flex items-center justify-between text-[11px] font-mono text-slate-400">
          <div>
            Contact: <span className="text-slate-200">legal@aegis-ai.internal</span>
          </div>
          <div>
            Contract ID: CC6-AI03-ENTERPRISE
          </div>
        </section>
      </main>
    </div>
  );
}
