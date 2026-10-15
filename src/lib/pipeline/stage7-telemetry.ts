import { AuditLogEntry, GatewayAction, PipelineStageResult, ThreatCategory, UserRole } from "../types";
import { globalAuditStore } from "../audit-store";

export function executeStage7Telemetry(params: {
  requestId: string;
  userRole: UserRole;
  clientIp?: string;
  zeroKnowledgeHash: string;
  stageResults: PipelineStageResult[];
  piiRedactedCount: number;
  ragQuarantinedCount: number;
  canaryDetected: boolean;
  isInjectionBlocked: boolean;
  injectionThreatCategory?: ThreatCategory;
  egressThreatCategory?: ThreatCategory;
}): {
  stageResult: PipelineStageResult;
  auditEntry: AuditLogEntry;
  action: GatewayAction;
  riskScore: number;
  overallThreat: ThreatCategory;
  totalLatencyMs: number;
} {
  const start = performance.now();

  const totalLatencyMs = params.stageResults.reduce((acc, s) => acc + s.latencyMs, 0);

  // Determine overall action & threat classification
  let action: GatewayAction = "ALLOW";
  let riskScore = 0;
  let overallThreat: ThreatCategory = "NONE";
  let summary = "Transaction authorized through all 7 gateway stages.";

  if (params.isInjectionBlocked) {
    action = "BLOCK";
    riskScore = 95;
    overallThreat = params.injectionThreatCategory || "PROMPT_INJECTION_DIRECT";
    summary = `Blocked adversarial prompt injection threat (${overallThreat}) with HTTP 403 Forbidden.`;
  } else if (params.canaryDetected) {
    action = "MASK";
    riskScore = 85;
    overallThreat = "CANARY_EGRESS_LEAK";
    summary = "Outbound Egress Guard intercepted canary token leakage. Token neutralized before return.";
  } else if (params.ragQuarantinedCount > 0) {
    action = "MASK";
    riskScore = Math.min(80, 40 + params.ragQuarantinedCount * 15);
    overallThreat = "RBAC_RAG_RESTRICTION";
    summary = `Access-Controlled RAG enforced. ${params.ragQuarantinedCount} unauthorized chunk(s) quarantined for role [${params.userRole}].`;
  } else if (params.piiRedactedCount > 0) {
    action = "MASK";
    riskScore = Math.min(75, 25 + params.piiRedactedCount * 10);
    overallThreat = "PII_FINANCIAL";
    summary = `Sanitized and tokenized ${params.piiRedactedCount} sensitive item(s) (PAN/financial/contact).`;
  }

  const passedStagesCount = params.stageResults.filter(s => s.status === "PASSED" || s.status === "MODIFIED").length;

  const auditEntry: AuditLogEntry = {
    id: params.requestId,
    timestamp: new Date().toISOString(),
    clientIp: params.clientIp || "127.0.0.1",
    userRole: params.userRole,
    action,
    httpStatus: action === "BLOCK" ? 403 : 200,
    riskScore,
    threat: overallThreat,
    summary,
    zeroKnowledgeHash: params.zeroKnowledgeHash,
    latencyMs: Math.round(totalLatencyMs),
    piiTokensCount: params.piiRedactedCount,
    ragQuarantinedCount: params.ragQuarantinedCount,
    canaryDetected: params.canaryDetected,
    stagesPassed: passedStagesCount
  };

  // Add to Zero-Knowledge SOC Audit Store (Zero plaintext saved)
  globalAuditStore.addEntry(auditEntry);

  const stage7Latency = Math.max(1, Math.round((performance.now() - start) * 10) / 10);

  const stageResult: PipelineStageResult = {
    stageNumber: 7,
    stageName: "Telemetry & Zero-Knowledge Audit Log",
    status: "PASSED",
    decision: "PASSED",
    latencyMs: stage7Latency,
    summary: `Emitted zero-knowledge audit event [${action} | Risk: ${riskScore}]. Zero raw plaintext stored. Total pipeline latency: ${Math.round(totalLatencyMs)}ms.`,
    details: [
      `Audit Event ID: ${params.requestId}`,
      `Zero-Knowledge Payload Digest: ${params.zeroKnowledgeHash.slice(0, 24)}... (SHA-256)`,
      `Decision Emitted: ${action} (HTTP ${action === "BLOCK" ? 403 : 200})`,
      `Computed Risk Score: ${riskScore}/100`,
      `Telemetry Pipeline Overhead: ${stage7Latency}ms`
    ],
    metadata: {
      action,
      riskScore,
      overallThreat,
      zeroKnowledgeHash: params.zeroKnowledgeHash
    }
  };

  return {
    stageResult,
    auditEntry,
    action,
    riskScore,
    overallThreat,
    totalLatencyMs
  };
}
