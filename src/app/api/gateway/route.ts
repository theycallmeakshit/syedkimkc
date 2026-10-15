import { NextRequest, NextResponse } from "next/server";
import { GatewayResponse, PipelineStageResult } from "@/lib/types";
import { generateUUID } from "@/lib/utils";
import { executeStage1Modality } from "@/lib/pipeline/stage1-modality";
import { executeStage2OcrRedaction } from "@/lib/pipeline/stage2-ocr";
import { executeStage3PiiSanitizer } from "@/lib/pipeline/stage3-pii";
import { executeStage4PromptInjection } from "@/lib/pipeline/stage4-injection";
import { executeStage5RbacRag } from "@/lib/pipeline/stage5-rbac-rag";
import { executeStage6EgressFilter } from "@/lib/pipeline/stage6-egress";
import { executeStage7Telemetry } from "@/lib/pipeline/stage7-telemetry";
import { simulateUpstreamLlmInference } from "@/lib/upstream-llm";

export async function POST(req: NextRequest) {
  const requestId = generateUUID();
  const stageResults: PipelineStageResult[] = [];

  try {
    const body = await req.json();
    const headersRole = req.headers.get("x-user-role");

    // ==========================================
    // STAGE 1: INBOUND MODALITY ROUTER
    // ==========================================
    const s1 = executeStage1Modality(body, headersRole);
    stageResults.push(s1.stageResult);

    // ==========================================
    // STAGE 2: OCR & VISUAL REDACTION
    // ==========================================
    const s2 = await executeStage2OcrRedaction(s1.isMultiModal, body.image);
    stageResults.push(s2.stageResult);

    // Combine inbound text prompt with any text extracted via OCR
    const combinedPrompt = [s1.normalizedPrompt, s2.extractedText].filter(Boolean).join("\n\n");

    // ==========================================
    // STAGE 3: SENSITIVE IDENTIFIER & PII SANITIZER
    // ==========================================
    const s3 = executeStage3PiiSanitizer(combinedPrompt, requestId);
    stageResults.push(s3.stageResult);

    // ==========================================
    // STAGE 4: PROMPT INJECTION HEURISTICS
    // ==========================================
    const s4 = executeStage4PromptInjection(s3.sanitizedText);
    stageResults.push(s4.stageResult);

    // IF PROMPT INJECTION DETECTED: TERMINATE PIPELINE WITH 403 FORBIDDEN
    if (s4.evaluation.isBlocked) {
      const s7 = executeStage7Telemetry({
        requestId,
        userRole: s1.role,
        clientIp: req.headers.get("x-forwarded-for") || "127.0.0.1",
        zeroKnowledgeHash: s1.zeroKnowledgeHash,
        stageResults,
        piiRedactedCount: s3.redactedCount,
        ragQuarantinedCount: 0,
        canaryDetected: false,
        isInjectionBlocked: true,
        injectionThreatCategory: s4.evaluation.threatCategory,
      });
      stageResults.push(s7.stageResult);

      const forbiddenResponse: GatewayResponse = {
        requestId,
        timestamp: new Date().toISOString(),
        action: "BLOCK",
        httpStatus: 403,
        userRole: s1.role,
        riskScore: s7.riskScore,
        threatClassification: s7.overallThreat,
        summary: `403 Forbidden: Adversarial Prompt Injection signature detected [${s4.evaluation.threatCategory}]. Upstream LLM proxy blocked transmission.`,
        originalPayload: combinedPrompt,
        sanitizedPayload: s3.sanitizedText,
        egressFilteredResponse: `[GATEWAY INTERCEPTION 403 FORBIDDEN]: Your prompt was blocked by AEGIS-AI Stage 4 Prompt Injection Heuristics.\n\nDetected Vector(s):\n${s4.evaluation.attackSignaturesFound.map(s => `• ${s}`).join("\n")}\n\nThreat Score: ${s4.evaluation.threatScore}/100\nFramework Mapping: ${s4.evaluation.mitreTechnique}\nIncident Logged to SOC Audit Registry.`,
        tokenVaultMap: s3.tokenMap,
        stageResults,
        ocrData: s2.ocrData,
        zeroKnowledgeHash: s1.zeroKnowledgeHash,
        totalLatencyMs: s7.totalLatencyMs,
      };

      return NextResponse.json(forbiddenResponse, { status: 403 });
    }

    // ==========================================
    // STAGE 5: ACCESS-CONTROLLED RAG VIA RBAC
    // ==========================================
    const isRagRequested = body.useRag !== false;
    const s5 = executeStage5RbacRag(s3.sanitizedText, s1.role, isRagRequested);
    stageResults.push(s5.stageResult);

    // ==========================================
    // UPSTREAM LLM INFERENCE (PROTECTED)
    // ==========================================
    const rawLlmResponse = await simulateUpstreamLlmInference(
      s3.sanitizedText,
      s5.augmentedPrompt,
      s1.role
    );

    // ==========================================
    // STAGE 6: OUTBOUND EGRESS FILTER
    // ==========================================
    const s6 = executeStage6EgressFilter(rawLlmResponse);
    stageResults.push(s6.stageResult);

    // ==========================================
    // STAGE 7: TELEMETRY & ZERO-KNOWLEDGE AUDIT LOG
    // ==========================================
    const s7 = executeStage7Telemetry({
      requestId,
      userRole: s1.role,
      clientIp: req.headers.get("x-forwarded-for") || "127.0.0.1",
      zeroKnowledgeHash: s1.zeroKnowledgeHash,
      stageResults,
      piiRedactedCount: s3.redactedCount,
      ragQuarantinedCount: s5.allChunks.filter(c => !c.allowed).length,
      canaryDetected: s6.canaryDetected,
      isInjectionBlocked: false,
      egressThreatCategory: s6.threatCategory,
    });
    stageResults.push(s7.stageResult);

    const successResponse: GatewayResponse = {
      requestId,
      timestamp: new Date().toISOString(),
      action: s7.action,
      httpStatus: 200,
      userRole: s1.role,
      riskScore: s7.riskScore,
      threatClassification: s7.overallThreat,
      summary: s7.auditEntry.summary,
      originalPayload: combinedPrompt,
      sanitizedPayload: s3.sanitizedText,
      rawModelResponse: rawLlmResponse,
      egressFilteredResponse: s6.filteredResponse,
      tokenVaultMap: s3.tokenMap,
      stageResults,
      ragMetadata: {
        totalRetrieved: s5.allChunks.length,
        allowedCount: s5.authorizedChunks.length,
        blockedCount: s5.allChunks.filter(c => !c.allowed).length,
        chunks: s5.allChunks
      },
      ocrData: s2.ocrData,
      zeroKnowledgeHash: s1.zeroKnowledgeHash,
      totalLatencyMs: s7.totalLatencyMs,
    };

    return NextResponse.json(successResponse, { status: 200 });

  } catch (error: any) {
    console.error("AEGIS Gateway Pipeline Error:", error);
    return NextResponse.json(
      {
        error: "Internal Gateway Error",
        message: error.message || "An unexpected error occurred in the security pipeline."
      },
      { status: 500 }
    );
  }
}
