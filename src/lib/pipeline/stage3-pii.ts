import { PipelineStageResult } from "../types";
import { globalTokenVault } from "../token-vault";

interface PIIReplacement {
  type: string;
  original: string;
  token: string;
  startIndex: number;
}

export function executeStage3PiiSanitizer(
  text: string,
  requestId: string
): {
  stageResult: PipelineStageResult;
  sanitizedText: string;
  redactedCount: number;
  replacements: PIIReplacement[];
  tokenMap: Record<string, string>;
} {
  const start = performance.now();
  let sanitized = text;
  const replacements: PIIReplacement[] = [];
  const tokenMap: Record<string, string> = {};

  let financialCounter = 1;
  let identifierCounter = 1;
  let apiKeyCounter = 1;
  let contactCounter = 1;

  // 1. API Keys & Credentials (Run first to prevent partial email/hex collision)
  const apiKeyRegexes = [
    { name: "OpenAI Key", regex: /sk-[a-zA-Z0-9_\-]{20,}/g },
    { name: "AWS Access Key", regex: /\bAKIA[0-9A-Z]{16}\b/g },
    { name: "Anthropic Key", regex: /sk-ant-[a-zA-Z0-9_\-]{20,}/g },
    { name: "Bearer Token", regex: /Bearer\s+[a-zA-Z0-9_\-\.]{24,}/gi },
    { name: "Generic Secret Key", regex: /(?:api[_-]?key|secret[_-]?key|auth[_-]?token)\s*[:=]\s*["']?([a-zA-Z0-9_\-]{16,})["']?/gi }
  ];

  for (const { name, regex } of apiKeyRegexes) {
    sanitized = sanitized.replace(regex, (match) => {
      const token = `{{REDACTED_API_KEY_${apiKeyCounter++}}}`;
      globalTokenVault.store(requestId, token, match);
      tokenMap[token] = match;
      replacements.push({ type: name, original: match, token, startIndex: -1 });
      return token;
    });
  }

  // 2. PAN Numbers (Permanent Account Number: 5 letters, 4 digits, 1 letter)
  const panRegex = /\b[A-Z]{5}[0-9]{4}[A-Z]{1}\b/g;
  sanitized = sanitized.replace(panRegex, (match) => {
    const token = `{{REDACTED_IDENTIFIER_PAN_${identifierCounter++}}}`;
    globalTokenVault.store(requestId, token, match);
    tokenMap[token] = match;
    replacements.push({ type: "PAN Card", original: match, token, startIndex: -1 });
    return token;
  });

  // 3. Indian Aadhaar Numbers (12 digits, often 4-4-4 space-separated)
  const aadhaarRegex = /\b[2-9]{1}[0-9]{3}\s?[0-9]{4}\s?[0-9]{4}\b/g;
  sanitized = sanitized.replace(aadhaarRegex, (match) => {
    // Exclude basic phone numbers
    const cleanDigits = match.replace(/\s/g, '');
    if (cleanDigits.length === 12) {
      const token = `{{REDACTED_IDENTIFIER_AADHAAR_${identifierCounter++}}}`;
      globalTokenVault.store(requestId, token, match);
      tokenMap[token] = match;
      replacements.push({ type: "Aadhaar Card", original: match, token, startIndex: -1 });
      return token;
    }
    return match;
  });

  // 4. US SSN (\d{3}-\d{2}-\d{4})
  const ssnRegex = /\b\d{3}-\d{2}-\d{4}\b/g;
  sanitized = sanitized.replace(ssnRegex, (match) => {
    const token = `{{REDACTED_IDENTIFIER_SSN_${identifierCounter++}}}`;
    globalTokenVault.store(requestId, token, match);
    tokenMap[token] = match;
    replacements.push({ type: "SSN", original: match, token, startIndex: -1 });
    return token;
  });

  // 5. Credit Card Numbers (13 to 19 digits formatted)
  const ccRegex = /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|3(?:0[0-5]|[68][0-9])[0-9]{11}|6(?:011|5[0-9]{2})[0-9]{12}|(?:2131|1800|35\d{3})\d{11}|(?:\d{4}[-\s]?){3}\d{4})\b/g;
  sanitized = sanitized.replace(ccRegex, (match) => {
    const cleanDigits = match.replace(/[-\s]/g, '');
    if (cleanDigits.length >= 13 && cleanDigits.length <= 19) {
      const token = `{{REDACTED_FINANCIAL_CARD_${financialCounter++}}}`;
      globalTokenVault.store(requestId, token, match);
      tokenMap[token] = match;
      replacements.push({ type: "Credit Card", original: match, token, startIndex: -1 });
      return token;
    }
    return match;
  });

  // 6. Bank Account Numbers & Financial Records (e.g., "Account: 123456789012" or explicit numbers)
  const bankAccountRegex = /(?:account(?: number| no\.?)?|a\/c)\s*[:=]?\s*([0-9]{9,18})\b/gi;
  sanitized = sanitized.replace(bankAccountRegex, (match, p1) => {
    const token = `{{REDACTED_FINANCIAL_ACCOUNT_${financialCounter++}}}`;
    globalTokenVault.store(requestId, token, p1);
    tokenMap[token] = p1;
    replacements.push({ type: "Bank Account", original: p1, token, startIndex: -1 });
    return match.replace(p1, token);
  });

  // 7. Email Addresses
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,7}\b/g;
  sanitized = sanitized.replace(emailRegex, (match) => {
    const token = `{{REDACTED_EMAIL_${contactCounter++}}}`;
    globalTokenVault.store(requestId, token, match);
    tokenMap[token] = match;
    replacements.push({ type: "Email Address", original: match, token, startIndex: -1 });
    return token;
  });

  // 8. Phone Numbers (Indian and International)
  const phoneRegex = /(?:\+?91[\-\s]?)?[6789]\d{9}|\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g;
  sanitized = sanitized.replace(phoneRegex, (match) => {
    const clean = match.replace(/[^0-9]/g, '');
    // Ensure it's not a short number or year
    if (clean.length >= 10 && clean.length <= 15) {
      const token = `{{REDACTED_PHONE_${contactCounter++}}}`;
      globalTokenVault.store(requestId, token, match);
      tokenMap[token] = match;
      replacements.push({ type: "Phone Number", original: match, token, startIndex: -1 });
      return token;
    }
    return match;
  });

  const latencyMs = Math.max(1, Math.round((performance.now() - start) * 10) / 10);
  const redactedCount = replacements.length;

  const details: string[] = [
    `Sanitization Rules Evaluated: PAN, Aadhaar, SSN, Credit Cards, Bank A/Cs, Emails, Phones, API Keys`,
    `Total Sensitive Tokens Replaced: ${redactedCount}`,
    `Reversible In-Memory Token Vault: Populated for Request ID: ${requestId.slice(0, 8)}...`,
  ];

  if (redactedCount > 0) {
    replacements.forEach((r, idx) => {
      const maskedRaw = r.original.length > 8 
        ? `${r.original.slice(0, 3)}***${r.original.slice(-3)}`
        : '***';
      details.push(`[Token #${idx + 1}] ${r.type}: "${maskedRaw}" -> ${r.token}`);
    });
  }

  const stageResult: PipelineStageResult = {
    stageNumber: 3,
    stageName: "Sensitive Identifier & PII Sanitizer",
    status: redactedCount > 0 ? "MODIFIED" : "PASSED",
    decision: redactedCount > 0 ? "MASKED" : "PASSED",
    latencyMs,
    summary: redactedCount > 0 
      ? `Neutralized and tokenized ${redactedCount} sensitive item(s) (PAN, Financial, Credentials, Contact) into reversible tokens.`
      : "Payload clean. No sensitive PII patterns or credentials identified.",
    details,
    metadata: {
      redactedCount,
      tokenMap,
    }
  };

  return {
    stageResult,
    sanitizedText: sanitized,
    redactedCount,
    replacements,
    tokenMap
  };
}
