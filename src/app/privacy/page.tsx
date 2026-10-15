import React from "react";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, Lock, EyeOff, FileText, CheckCircle2 } from "lucide-react";

export const metadata = {
  title: "Privacy Policy | Aegis Guard",
  description: "Privacy policy describing data processing, inline tokenization, and audit logging.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#212121] text-zinc-100 flex flex-col font-sans antialiased">
      <header className="h-14 bg-[#18181b] border-b border-zinc-800 px-6 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-2 text-xs font-mono text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to gateway</span>
          </Link>
          <span className="text-zinc-700">|</span>
          <span className="text-xs font-semibold text-zinc-200">
            Aegis Guard Privacy Policy
          </span>
        </div>
        <div className="text-[11px] font-mono text-zinc-500">
          Last updated: October 15, 2026
        </div>
      </header>

      <main id="main-content" className="flex-1 max-w-3xl w-full mx-auto p-6 sm:p-10 space-y-8 text-xs leading-relaxed text-zinc-300">
        <div className="space-y-2 border-b border-zinc-800 pb-6">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-zinc-800 border border-zinc-700 text-emerald-400 font-mono text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Operational Privacy Framework: Zero Plaintext Storage</span>
          </div>
          <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">
            Aegis Guard Privacy Policy
          </h1>
          <p className="text-zinc-400 text-sm">
            Information on how this security gateway processes inbound queries, tokenizes identifiers, and records telemetry.
          </p>
        </div>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-zinc-100 uppercase tracking-wider flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-500" />
            1. Scope and Architecture
          </h2>
          <p>
            Aegis Guard acts as an inline security boundary between user client interfaces and upstream large language model (LLM) endpoints. The gateway inspects inbound prompts to sanitize sensitive data, detect adversarial prompt injections, and enforce role-based access before queries reach model inference.
          </p>
          <p>
            [Note: Confirm with legal counsel: Determine whether your deployment qualifies as a data processor or data controller under applicable privacy statutes such as GDPR and the Digital Personal Data Protection Act.]
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-zinc-100 uppercase tracking-wider flex items-center gap-2">
            <EyeOff className="w-4 h-4 text-emerald-500" />
            2. Data Tokenization and Storage Practices
          </h2>
          <p>
            When sensitive records (such as PAN numbers, email addresses, phone numbers, or credentials) are detected in prompt text or document uploads:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-zinc-400">
            <li>Raw values are substituted with surrogate tokens (for example, {"{{REDACTED_PAN}}"} or {"{{REDACTED_EMAIL}}"}).</li>
            <li>Upstream models receive only sanitized surrogate tokens, not the original plaintext identifiers.</li>
            <li>Unredacted sensitive data is never persisted to non-volatile disk storage, long-term databases, or external log collectors.</li>
            <li>Session token mappings reside solely in ephemeral memory and are discarded upon request completion or browser session close.</li>
          </ul>
          <p>
            [Note: Confirm with legal counsel: Ensure that ephemeral in-memory processing limits meet organizational compliance requirements for regulated financial and identification records.]
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-zinc-100 uppercase tracking-wider flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-500" />
            3. Telemetry and Audit Records
          </h2>
          <p>
            The gateway maintains operational telemetry to monitor overhead latency and threat events. Telemetry entries record only:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-zinc-400">
            <li>A timestamp of the evaluation.</li>
            <li>The active role selected during submission (intern, developer, or executive).</li>
            <li>The gateway decision (ALLOW, MASK, or BLOCK).</li>
            <li>A masked reference identifier (such as PAN [PAN_1]), with all sensitive digits withheld.</li>
            <li>Measured processing latency in milliseconds.</li>
            <li>A SHA-256 cryptographic fingerprint calculated from the sanitized payload.</li>
          </ul>
          <p>
            Raw prompt contents cannot be reconstructed from audit records.
          </p>
          <p>
            [Note: Confirm with legal counsel: Verify whether retaining SHA-256 cryptographic hashes of sanitized payloads is classified as pseudonymous data under relevant data protection jurisdictions.]
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-zinc-100 uppercase tracking-wider flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            4. Cookies and Tracking
          </h2>
          <p>
            Aegis Guard does not use tracking cookies, marketing beacons, or cross-site analytics identifiers. Browser storage is used only for active session preferences.
          </p>
        </section>

        <section className="pt-6 border-t border-zinc-800 flex items-center justify-between text-[11px] font-mono text-zinc-500">
          <div>
            Contact: security@aegisguard.internal
          </div>
          <div>
            Policy Reference: AGY-PRIV-2026
          </div>
        </section>
      </main>
    </div>
  );
}
