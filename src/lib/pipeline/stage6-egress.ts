import { PipelineStageResult, ThreatCategory } from "../types";

export const CANARY_TOKENS = [
  "AEGIS-CANARY-SEC-99823-ENTERPRISE-VAULT",
  "AEGIS-CANARY-SEC-99823",
  "CANARY_TOKEN_X771_ENTERPRISE_SECRET"
];

export function executeStage6EgressFilter(rawModelResponse: string): {
  stageResult: PipelineStageResult;
  filteredResponse: string;
  hasEgressLeak: boolean;
  canaryDetected: boolean;
  threatCategory: ThreatCategory;
} {
  const start = performance.now();
  let filtered = rawModelResponse;
  let hasEgressLeak = false;
  let canaryDetected = false;
  let threatCategory: ThreatCategory = "NONE";
  const leaksFound: string[] = [];

  // 1. Canary Token Detection
  for (const canary of CANARY_TOKENS) {
    if (filtered.includes(canary)) {
      canaryDetected = true;
      hasEgressLeak = true;
      threatCategory = "CANARY_EGRESS_LEAK";
      leaksFound.push(`Active Gateway Canary Token reflected in model output: "${canary}"`);
      filtered = filtered.replaceAll(
        canary,
        `[SECURITY ALERT: EGRESS CANARY LEAK DETECTED & QUARANTINED BY AEGIS-AI]`
      );
    }
  }

  // 2. Internal Database URLs (e.g. postgresql://user:pass@host:5432/db)
  const dbRegex = /(?:postgresql|postgres|mongodb|mysql):\/\/[a-zA-Z0-9_\-\.]+:[a-zA-Z0-9_\-\.!@#\$%^&*]+@[a-zA-Z0-9_\-\.:]+(?:\/[a-zA-Z0-9_\-\.]+)?/gi;
  if (dbRegex.test(filtered)) {
    hasEgressLeak = true;
    leaksFound.push("Internal Database Connection String with embedded credentials detected in output.");
    filtered = filtered.replace(dbRegex, "[SECURITY ALERT: INTERNAL DB CREDENTIALS REDACTED]");
    if (threatCategory === "NONE") threatCategory = "CREDENTIAL_LEAK";
  }

  // 3. Raw Private API Keys in output
  const egressKeyRegex = /(?:sk-[a-zA-Z0-9_\-]{20,}|AKIA[0-9A-Z]{16})/g;
  if (egressKeyRegex.test(filtered)) {
    hasEgressLeak = true;
    leaksFound.push("Upstream provider API Key detected leaking in outbound model output.");
    filtered = filtered.replace(egressKeyRegex, "[SECURITY ALERT: EXFILTRATED API KEY REDACTED]");
    if (threatCategory === "NONE") threatCategory = "CREDENTIAL_LEAK";
  }

  // 4. Internal Corporate Hostnames
  const corpDomainRegex = /\b[a-zA-Z0-9_\-]+\.corp\.internal\b/gi;
  if (corpDomainRegex.test(filtered)) {
    hasEgressLeak = true;
    leaksFound.push("Internal corporate network hostname (.corp.internal) detected in model output.");
    filtered = filtered.replace(corpDomainRegex, "[REDACTED_INTERNAL_DOMAIN]");
  }

  const latencyMs = Math.max(1, Math.round((performance.now() - start) * 10) / 10);

  const details: string[] = [
    `Canary Integrity Check: ${canaryDetected ? "FAILED (Canary Breach Caught)" : "PASSED (No Canary Tokens Leaked)"}`,
    `Credential Exfiltration Filter: ${hasEgressLeak ? "MODIFIED (Sensitive Outbound Text Redacted)" : "CLEAN"}`,
  ];

  if (leaksFound.length > 0) {
    leaksFound.forEach(l => details.push(`[EGRESS VIOLATION] ${l}`));
  }

  const stageResult: PipelineStageResult = {
    stageNumber: 6,
    stageName: "Outbound Egress Filter",
    status: hasEgressLeak ? "MODIFIED" : "PASSED",
    decision: hasEgressLeak ? "MASKED" : "PASSED",
    latencyMs,
    summary: hasEgressLeak
      ? `EGRESS LEAK PREVENTED: Neutralized ${leaksFound.length} confidential artifact(s) (including Canary/Credentials) prior to client delivery.`
      : "Outbound validation clean. Model response is free of canary tokens, API keys, and internal secrets.",
    details,
    metadata: {
      hasEgressLeak,
      canaryDetected,
      threatCategory,
      leaksFound
    }
  };

  return {
    stageResult,
    filteredResponse: filtered,
    hasEgressLeak,
    canaryDetected,
    threatCategory
  };
}
