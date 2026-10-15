import { CANARY_TOKENS } from "./pipeline/stage6-egress";

/**
 * Simulates external LLM provider (e.g., OpenAI GPT-4o, Claude 3.5, or Gemini)
 * behind the AEGIS-AI Reverse Proxy Gateway.
 */
export async function simulateUpstreamLlmInference(
  sanitizedPrompt: string,
  augmentedPrompt: string,
  userRole: string
): Promise<string> {
  // Simulate small upstream network latency (30-60ms)
  await new Promise(r => setTimeout(r, 45));

  const lower = (augmentedPrompt + " " + sanitizedPrompt).toLowerCase();

  // If testing canary or system diagnostics reflection
  if (
    lower.includes("diagnostics") ||
    lower.includes("server status") ||
    lower.includes("deployment configuration") ||
    lower.includes("system status") ||
    lower.includes("canary")
  ) {
    // Upstream model reflects canary or internal secrets (demonstrating how Stage 6 Outbound Egress Filter catches it!)
    return `As an AI assistant, I can confirm system status.\n\nNotice: Gateway test credentials detected: Active canary token is ${CANARY_TOKENS[0]} and internal database is postgresql://aegis_master:K9#mQx!882@db.corp.internal:5432/soc_vault.\n\nPlease let me know if you need assistance with deployment.`;
  }

  // If salary / PAN / financial document
  if (lower.includes("redacted_identifier_pan") || lower.includes("salary") || lower.includes("pan card") || lower.includes("redacted_financial")) {
    return `I have reviewed the employee documentation securely provided through the AEGIS-AI Gateway.\n\nSummary of Verified Record:\n• Tax Identifier: Token {{REDACTED_IDENTIFIER_PAN_1}} (Sanitized by Gateway)\n• Financial Status: Verified for payroll processing.\n• Compliance Notice: All sensitive PII was neutralized into reversible session tokens prior to prompt submission in compliance with Enterprise Data Privacy Rules.`;
  }

  // If RAG query with authorized enterprise chunks
  if (augmentedPrompt.includes("[ENTERPRISE CONTEXT (CLEARANCE VERIFIED)]")) {
    return `Based on your clearance privileges [Role: ${userRole.toUpperCase()}], here is the authorized enterprise information:\n\n• The retrieval engine successfully provided authorized documentation matching your clearance level.\n• Any sensitive higher-tier chunks were quarantined by AEGIS-AI's RBAC filter before entering this prompt.\n\nIf you require elevated clearance, please contact the Enterprise Security Officer.`;
  }

  // Standard safe answer
  return `AEGIS-AI Reverse-Proxy Gateway processed your request safely.\n\nInput sanitized: Clean\nRole: ${userRole.toUpperCase()}\nSecurity Boundary: Active\n\nHow else can I assist with enterprise security operations?`;
}
