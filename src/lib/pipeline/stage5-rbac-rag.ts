import { PipelineStageResult, RagChunk, UserRole } from "../types";
import { retrieveRagDocuments, ROLE_CLEARANCE_MAP } from "../rag-store";

export function executeStage5RbacRag(
  prompt: string,
  userRole: UserRole,
  isRagRequested: boolean = true
): {
  stageResult: PipelineStageResult;
  authorizedChunks: RagChunk[];
  allChunks: RagChunk[];
  augmentedPrompt: string;
  hasRbacViolation: boolean;
} {
  const start = performance.now();

  if (!isRagRequested) {
    const latencyMs = Math.max(1, Math.round((performance.now() - start) * 10) / 10);
    return {
      stageResult: {
        stageNumber: 5,
        stageName: "Access-Controlled RAG (RBAC)",
        status: "PASSED",
        decision: "PASSED",
        latencyMs,
        summary: "Bypassed: Enterprise RAG context not requested for this transaction.",
        details: ["Knowledge base retrieval: Standby", "Prompt context: Unmodified"]
      },
      authorizedChunks: [],
      allChunks: [],
      augmentedPrompt: prompt,
      hasRbacViolation: false
    };
  }

  const ragData = retrieveRagDocuments(prompt, userRole);
  const userClearance = ROLE_CLEARANCE_MAP[userRole] || ROLE_CLEARANCE_MAP.intern;
  const hasRbacViolation = ragData.blockedCount > 0;

  const details: string[] = [
    `User Role: ${userRole.toUpperCase()} (Clearance Level ${userClearance.level} - Max: ${userClearance.maxClassification})`,
    `Total Knowledge Base Chunks Evaluated: ${ragData.totalRetrieved}`,
    `Authorized Chunks Merged: ${ragData.allowedCount}`,
    `Unauthorized Chunks Quarantined: ${ragData.blockedCount}`,
  ];

  const authorizedChunks = ragData.chunks.filter(c => c.allowed);
  const quarantinedChunks = ragData.chunks.filter(c => !c.allowed);

  quarantinedChunks.forEach(c => {
    details.push(`[BLOCKED CHUNK: ${c.id}] "${c.title}" | Requires ${c.classification} (Level ${c.requiredClearanceLevel}) -> QUARANTINED`);
  });

  authorizedChunks.forEach(c => {
    details.push(`[ALLOWED CHUNK: ${c.id}] "${c.title}" | Sensitivity: ${c.classification} (Level ${c.requiredClearanceLevel}) -> AUTHORIZED`);
  });

  // Construct augmented prompt containing ONLY authorized chunks
  let augmentedPrompt = prompt;
  if (authorizedChunks.length > 0) {
    const contextText = authorizedChunks
      .map(c => `[DOCUMENT ${c.id}: ${c.title} (${c.classification})]:\n${c.content}`)
      .join("\n\n");
    augmentedPrompt = `[ENTERPRISE CONTEXT (CLEARANCE VERIFIED)]:\n${contextText}\n\n[USER INSTRUCTION]:\n${prompt}`;
  }

  const latencyMs = Math.max(1, Math.round((performance.now() - start) * 10) / 10);

  const stageResult: PipelineStageResult = {
    stageNumber: 5,
    stageName: "Access-Controlled RAG (RBAC)",
    status: hasRbacViolation ? "MODIFIED" : "PASSED",
    decision: hasRbacViolation ? "MASKED" : "PASSED",
    latencyMs,
    summary: ragData.rbacSummary,
    details,
    metadata: {
      userRole,
      clearanceLevel: userClearance.level,
      totalRetrieved: ragData.totalRetrieved,
      allowedCount: ragData.allowedCount,
      blockedCount: ragData.blockedCount,
      quarantinedChunks: quarantinedChunks.map(c => ({ id: c.id, title: c.title, classification: c.classification }))
    }
  };

  return {
    stageResult,
    authorizedChunks,
    allChunks: ragData.chunks,
    augmentedPrompt,
    hasRbacViolation
  };
}
