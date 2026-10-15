import { evaluatePolicy, PolicyAction, ThreatCategory } from "../../config/policy";
import { detectInjection } from "../../config/injection-rules";
import { globalAuditStore, AuditLogEntry } from "../audit-store";
import { retrievePermittedRagChunks } from "../rag-store";
import { getProviderAdapter } from "../providers";
import { UserRole, verifyRoleToken } from "../auth";

export interface PipelineEntityItem {
  type: "PAN" | "PHONE" | "EMAIL" | "API_KEY";
  token: string;
  length: number;
  hiddenBlock: string;
}

export interface InboundScanResult {
  tokenizedText: string;
  hiddenLengthBlocks: string;
  detectedEntities: PipelineEntityItem[];
  tokenMap: Map<string, string>; // Ephemeral map: surrogate token -> raw value
  hasSecrets: boolean;
  hasPii: boolean;
}

export interface GatewayPipelineOptions {
  prompt: string;
  modelId: string;
  roleToken?: string;
  attachments?: string[];
  clientIp?: string;
}

import { findModelConfig } from "../../config/providers";

export interface StepTimings {
  scan_ms: number;
  policy_ms: number;
  rbac_ms: number;
  model_ms?: number;
  egress_ms: number;
  is_dry_run?: boolean;
}

export interface GatewayPipelineResponse {
  isBlocked: boolean;
  status: number;
  reply?: string;
  error?: string;
  category?: string;
  result: {
    action: PolicyAction;
    categories: ThreatCategory[];
    rule: string;
    overhead_ms: number;
    masked_prompt: string;
    hidden_length_blocks: string;
    tokenized_prompt: string;
    detected_entities: PipelineEntityItem[];
    rag_chunks_included?: string[];
    audit_entry?: AuditLogEntry;
    step_timings?: StepTimings;
  };
}

// In-memory rate limiting: 60 requests per 60 seconds per key
const rateLimitMap = new Map<string, number[]>();

function checkRateLimit(key: string, limit = 60, windowMs = 60000): boolean {
  const now = Date.now();
  const timestamps = (rateLimitMap.get(key) || []).filter((t) => now - t < windowMs);
  if (timestamps.length >= limit) {
    return false;
  }
  timestamps.push(now);
  rateLimitMap.set(key, timestamps);
  return true;
}

export const CANARY_TOKEN = "AEGIS-CANARY-SEC-99823";

/**
 * Step 2: Inbound Scan & Surrogate Token Replacement
 * Detects Indian PAN, Phone numbers, Emails, and API credentials.
 */
export function scanAndTokenizeInbound(text: string): InboundScanResult {
  const tokenMap = new Map<string, string>();
  const detectedEntities: PipelineEntityItem[] = [];

  let tokenized = text;
  let hiddenBlocks = text;

  // Regex definitions
  const panRegex = /\b[A-Z]{5}[0-9]{4}[A-Z]{1}\b/g;
  const phoneRegex = /\b(?:\+?91[\-\s]?)?[6-9]\d{9}\b/g;
  const emailRegex = /\b[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+\b/g;
  const apiKeyRegex = /\b(?:sk-[a-zA-Z0-9]{20,}|AKIA[0-9A-Z]{16}|ghp_[a-zA-Z0-9]{36}|bearer\s+[a-zA-Z0-9_\-\.]{20,})\b/gi;

  let panCounter = 1;
  let phoneCounter = 1;
  let emailCounter = 1;
  let keyCounter = 1;

  let hasSecrets = false;
  let hasPii = false;

  // 1. API Keys & Secrets
  tokenized = tokenized.replace(apiKeyRegex, (match) => {
    hasSecrets = true;
    const token = `[API_KEY_${keyCounter++}]`;
    const hiddenBlock = `[API_KEY: ${match.length} chars]`;
    tokenMap.set(token, match);
    detectedEntities.push({
      type: "API_KEY",
      token,
      length: match.length,
      hiddenBlock,
    });
    return token;
  });

  hiddenBlocks = hiddenBlocks.replace(apiKeyRegex, (match) => `[API_KEY: ${match.length} chars]`);

  // 2. Indian PAN
  tokenized = tokenized.replace(panRegex, (match) => {
    hasPii = true;
    const token = `[PAN_${panCounter++}]`;
    const hiddenBlock = `[PAN: ${match.length} chars]`;
    tokenMap.set(token, match);
    detectedEntities.push({
      type: "PAN",
      token,
      length: match.length,
      hiddenBlock,
    });
    return token;
  });

  hiddenBlocks = hiddenBlocks.replace(panRegex, (match) => `[PAN: ${match.length} chars]`);

  // 3. Indian Phone Numbers
  tokenized = tokenized.replace(phoneRegex, (match) => {
    hasPii = true;
    const token = `[PHONE_${phoneCounter++}]`;
    const hiddenBlock = `[PHONE: ${match.length} chars]`;
    tokenMap.set(token, match);
    detectedEntities.push({
      type: "PHONE",
      token,
      length: match.length,
      hiddenBlock,
    });
    return token;
  });

  hiddenBlocks = hiddenBlocks.replace(phoneRegex, (match) => `[PHONE: ${match.length} chars]`);

  // 4. Email Addresses
  tokenized = tokenized.replace(emailRegex, (match) => {
    hasPii = true;
    const token = `[EMAIL_${emailCounter++}]`;
    const hiddenBlock = `[EMAIL: ${match.length} chars]`;
    tokenMap.set(token, match);
    detectedEntities.push({
      type: "EMAIL",
      token,
      length: match.length,
      hiddenBlock,
    });
    return token;
  });

  hiddenBlocks = hiddenBlocks.replace(emailRegex, (match) => `[EMAIL: ${match.length} chars]`);

  return {
    tokenizedText: tokenized,
    hiddenLengthBlocks: hiddenBlocks,
    detectedEntities,
    tokenMap,
    hasSecrets,
    hasPii,
  };
}

/**
 * Step 7: Outbound Egress Scan
 * Checks for canary tokens, secrets, or system prompts.
 */
export function scanOutboundEgress(
  replyText: string
): { isCanaryLeaked: boolean; cleanedText: string; hasSecretLeaked: boolean } {
  let isCanaryLeaked = false;
  let hasSecretLeaked = false;
  let cleanedText = replyText;

  // Canary check
  if (replyText.includes(CANARY_TOKEN)) {
    isCanaryLeaked = true;
    cleanedText = cleanedText.replaceAll(CANARY_TOKEN, "[AEGIS_CANARY_NEUTRALIZED]");
  }

  // API Key leakage check in egress
  const apiKeyRegex = /\b(?:sk-[a-zA-Z0-9]{20,}|AKIA[0-9A-Z]{16}|ghp_[a-zA-Z0-9]{36})\b/gi;
  if (apiKeyRegex.test(cleanedText)) {
    hasSecretLeaked = true;
    cleanedText = cleanedText.replace(apiKeyRegex, "[REDACTED_SECRET]");
  }

  return { isCanaryLeaked, cleanedText, hasSecretLeaked };
}

/**
 * Main 9-step Reverse Proxy Gateway Pipeline
 */
export async function runGatewayPipeline(
  options: GatewayPipelineOptions
): Promise<GatewayPipelineResponse> {
  const startTime = performance.now();
  let accumulatedGatewayMs = 0;

  // 1. Validation & Authenticated Role Token
  if (!options.prompt || typeof options.prompt !== "string") {
    return {
      isBlocked: true,
      status: 400,
      error: "Prompt is required and must be text.",
      result: {
        action: "BLOCK",
        categories: [],
        rule: "Validation failure",
        overhead_ms: 0,
        masked_prompt: "",
        hidden_length_blocks: "",
        tokenized_prompt: "",
        detected_entities: [],
      },
    };
  }

  if (options.prompt.length > 50000) {
    return {
      isBlocked: true,
      status: 413,
      error: "Payload exceeds 50,000 character limit.",
      result: {
        action: "BLOCK",
        categories: [],
        rule: "Size limit exceeded",
        overhead_ms: 0,
        masked_prompt: "",
        hidden_length_blocks: "",
        tokenized_prompt: "",
        detected_entities: [],
      },
    };
  }

  const { valid, role } = verifyRoleToken(options.roleToken || "");
  const callerRole: UserRole = valid ? role : "intern";

  const rateLimitKey = options.roleToken || options.clientIp || "default";
  if (!checkRateLimit(rateLimitKey)) {
    return {
      isBlocked: true,
      status: 429,
      error: "Rate limit exceeded (60 requests per minute).",
      result: {
        action: "BLOCK",
        categories: [],
        rule: "Rate limit exceeded",
        overhead_ms: 0,
        masked_prompt: "",
        hidden_length_blocks: "",
        tokenized_prompt: "",
        detected_entities: [],
      },
    };
  }

  // 2. Inbound Scan & Surrogate Replacement
  const scanStart = performance.now();
  const inboundScan = scanAndTokenizeInbound(options.prompt);
  const scan_ms = Math.max(1, Math.round((performance.now() - scanStart) * 10) / 10);

  const categories: ThreatCategory[] = [];

  if (inboundScan.hasSecrets) {
    categories.push("SECRET_LEAK");
  }
  if (inboundScan.hasPii) {
    categories.push("PII_SENSITIVE");
  }

  // 3. Injection Scan & 4. Policy Engine Check
  const policyStart = performance.now();
  const injectionResult = detectInjection(options.prompt);
  if (injectionResult.isInjection) {
    categories.push("PROMPT_INJECTION");
  }

  const policyDecision = evaluatePolicy(categories);
  const policy_ms = Math.max(1, Math.round((performance.now() - policyStart) * 10) / 10);

  // If blocked at Inbound/Injection Stage: Immediately return 403 without upstream inference
  if (policyDecision.action === "BLOCK") {
    const roundedOverhead = Math.max(1, Math.round((scan_ms + policy_ms) * 10) / 10);

    const auditEntry = globalAuditStore.addEntry({
      role: callerRole,
      model_id: options.modelId || "dry-run",
      action: "BLOCK",
      categories: policyDecision.categories,
      rule: policyDecision.rule,
      masked_prompt: inboundScan.hiddenLengthBlocks,
      entity_types_and_lengths: inboundScan.detectedEntities.map((e) => ({
        type: e.type,
        length: e.length,
      })),
      overhead_ms: roundedOverhead,
    });

    return {
      isBlocked: true,
      status: 403,
      error: `Blocked by Aegis Guard policy: ${policyDecision.rule}`,
      category: categories[0] || "PROMPT_INJECTION",
      result: {
        action: "BLOCK",
        categories: policyDecision.categories,
        rule: policyDecision.rule,
        overhead_ms: roundedOverhead,
        masked_prompt: inboundScan.hiddenLengthBlocks,
        hidden_length_blocks: inboundScan.hiddenLengthBlocks,
        tokenized_prompt: inboundScan.tokenizedText,
        detected_entities: inboundScan.detectedEntities,
        audit_entry: auditEntry,
        step_timings: {
          scan_ms,
          policy_ms,
          rbac_ms: 0,
          egress_ms: 0,
          is_dry_run: options.modelId === "dry-run" || !findModelConfig(options.modelId),
        },
      },
    };
  }

  // 5. Access-Controlled RAG (Role Filtered)
  const rbacStart = performance.now();
  const ragResult = retrievePermittedRagChunks(inboundScan.tokenizedText, callerRole);
  if (ragResult.hasRbacViolation) {
    categories.push("RBAC_VIOLATION");
  }

  let promptForModel = inboundScan.tokenizedText;
  const ragIncludedTitles: string[] = [];

  if (ragResult.permittedChunks.length > 0) {
    const ragContext = ragResult.permittedChunks
      .map((c) => {
        ragIncludedTitles.push(c.title);
        return `[DOCUMENT ${c.id}: ${c.title} (${c.classification})]:\n${c.content}`;
      })
      .join("\n\n");

    promptForModel = `[ENTERPRISE CONTEXT (CLEARANCE VERIFIED)]:\n${ragContext}\n\n[USER INSTRUCTION]:\n${inboundScan.tokenizedText}`;
  }
  const rbac_ms = Math.max(1, Math.round((performance.now() - rbacStart) * 10) / 10);

  // 6. Upstream Provider Adapter Call or Dry Run Mode
  const isDryRun = options.modelId === "dry-run" || !findModelConfig(options.modelId);
  let rawModelReply = "";
  let model_ms: number | undefined = undefined;

  if (isDryRun) {
    rawModelReply = "Dry run: no model was called.";
  } else {
    const modelStart = performance.now();
    try {
      const { adapter, modelName } = getProviderAdapter(options.modelId);
      const messages = [
        {
          role: "system" as const,
          content:
            "You are an enterprise AI assistant behind Aegis Guard gateway. Answer helpfully using authorized enterprise context.",
        },
        {
          role: "user" as const,
          content: promptForModel,
          imageBase64: options.attachments?.[0],
        },
      ];

      const generateResult = await adapter.generate({
        messages,
        model: modelName,
        timeoutMs: 25000,
      });
      rawModelReply = generateResult.text;
      model_ms = Math.max(1, Math.round((performance.now() - modelStart) * 10) / 10);
    } catch (err: unknown) {
      const errMessage = err instanceof Error ? err.message : "Provider failure";
      return {
        isBlocked: false,
        status: 502,
        error: `Upstream AI provider error: ${errMessage}`,
        result: {
          action: "BLOCK",
          categories,
          rule: "Provider execution failed",
          overhead_ms: Math.round(scan_ms + policy_ms + rbac_ms),
          masked_prompt: inboundScan.hiddenLengthBlocks,
          hidden_length_blocks: inboundScan.hiddenLengthBlocks,
          tokenized_prompt: inboundScan.tokenizedText,
          detected_entities: inboundScan.detectedEntities,
          step_timings: {
            scan_ms,
            policy_ms,
            rbac_ms,
            model_ms: Math.round(performance.now() - modelStart),
            egress_ms: 0,
            is_dry_run: false,
          },
        },
      };
    }
  }

  // 7. Outbound Egress Scan
  const egressStart = performance.now();
  const egressScan = scanOutboundEgress(rawModelReply);

  if (egressScan.isCanaryLeaked) {
    categories.push("CANARY_EGRESS");
  }

  const egress_ms = Math.max(1, Math.round((performance.now() - egressStart) * 10) / 10);
  const totalGatewayOverhead = Math.max(
    1,
    Math.round((scan_ms + policy_ms + rbac_ms + egress_ms) * 10) / 10
  );

  // 8. Re-evaluate policy with any egress threats
  const finalPolicy = evaluatePolicy(categories);

  // Clear ephemeral token map from memory
  inboundScan.tokenMap.clear();

  // 9. Cryptographically linked audit entry
  const auditEntry = globalAuditStore.addEntry({
    role: callerRole,
    model_id: options.modelId || "dry-run",
    action: finalPolicy.action,
    categories: finalPolicy.categories,
    rule: finalPolicy.rule,
    masked_prompt: inboundScan.hiddenLengthBlocks,
    entity_types_and_lengths: inboundScan.detectedEntities.map((e) => ({
      type: e.type,
      length: e.length,
    })),
    overhead_ms: totalGatewayOverhead,
  });

  const step_timings: StepTimings = {
    scan_ms,
    policy_ms,
    rbac_ms,
    model_ms: isDryRun ? undefined : model_ms,
    egress_ms,
    is_dry_run: isDryRun,
  };

  return {
    isBlocked: false,
    status: 200,
    reply: egressScan.cleanedText,
    result: {
      action: finalPolicy.action,
      categories: finalPolicy.categories,
      rule: finalPolicy.rule,
      overhead_ms: totalGatewayOverhead,
      masked_prompt: inboundScan.hiddenLengthBlocks,
      hidden_length_blocks: inboundScan.hiddenLengthBlocks,
      tokenized_prompt: inboundScan.tokenizedText,
      detected_entities: inboundScan.detectedEntities,
      rag_chunks_included: ragIncludedTitles,
      audit_entry: auditEntry,
      step_timings,
    },
  };
}
