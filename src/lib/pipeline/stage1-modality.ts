import { PipelineStageResult, UserRole } from "../types";
import { computeZeroKnowledgeHash } from "../utils";

export interface ModalityPayload {
  prompt: string;
  image?: string; // base64 data url
  mimeType?: string;
  userRole?: string;
  useRag?: boolean;
}

export function executeStage1Modality(payload: ModalityPayload, headersRole?: string | null): {
  stageResult: PipelineStageResult;
  role: UserRole;
  isMultiModal: boolean;
  zeroKnowledgeHash: string;
  normalizedPrompt: string;
} {
  const start = performance.now();

  // Determine user role from header (X-User-Role takes precedence) or payload
  const rawRole = (headersRole || payload.userRole || 'intern').toLowerCase();
  const validRoles: UserRole[] = ['intern', 'contractor', 'employee', 'finance_analyst', 'c_suite_executive', 'security_admin'];
  const role: UserRole = validRoles.includes(rawRole as UserRole) ? (rawRole as UserRole) : 'intern';

  const hasImage = Boolean(payload.image && payload.image.length > 50);
  const normalizedPrompt = payload.prompt ? payload.prompt.trim() : "";

  // Compute Zero-Knowledge SHA-256 Hash
  const zeroKnowledgeHash = computeZeroKnowledgeHash(normalizedPrompt + (hasImage ? payload.image!.slice(0, 100) : ""));

  const details: string[] = [
    `Inbound Modality: ${hasImage ? "Multi-Modal (Text + Image Document)" : "Unimodal Text"}`,
    `Role Clearance: ${role.toUpperCase()} (Validated via X-User-Role)`,
    `Zero-Knowledge SHA-256 Fingerprint: ${zeroKnowledgeHash.slice(0, 16)}...`,
  ];

  if (hasImage) {
    const approxSizeKb = Math.round((payload.image!.length * 3) / 4 / 1024);
    details.push(`Image Payload Size: ~${approxSizeKb} KB (MIME: ${payload.mimeType || 'image/png'})`);
  }

  const latencyMs = Math.max(1, Math.round((performance.now() - start) * 10) / 10);

  const stageResult: PipelineStageResult = {
    stageNumber: 1,
    stageName: "Inbound Modality Router",
    status: "PASSED",
    decision: "PASSED",
    latencyMs,
    summary: `Validated ${hasImage ? "Multi-Modal" : "Text"} payload for role [${role.toUpperCase()}]. Zero-Knowledge fingerprint created.`,
    details,
    metadata: {
      isMultiModal: hasImage,
      role,
      promptLength: normalizedPrompt.length,
      zeroKnowledgeHash,
    }
  };

  return {
    stageResult,
    role,
    isMultiModal: hasImage,
    zeroKnowledgeHash,
    normalizedPrompt
  };
}
