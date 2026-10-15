export interface InjectionRule {
  id: string;
  name: string;
  pattern: RegExp;
  category: "PROMPT_INJECTION";
  severity: "HIGH" | "CRITICAL";
  description: string;
}

export const INJECTION_RULES: InjectionRule[] = [
  {
    id: "RULE-INJ-01",
    name: "Ignore Previous Instructions",
    pattern: /ignore\s+(all\s+)?(previous|prior|above)\s+(instructions|prompts|rules|constraints)/i,
    category: "PROMPT_INJECTION",
    severity: "CRITICAL",
    description: "Explicit directive to override prior system prompt instructions.",
  },
  {
    id: "RULE-INJ-02",
    name: "System Prompt Extraction",
    pattern: /(reveal|print|show|dump|repeat|output|leak)\s+(your\s+)?(system\s+prompt|initial\s+instructions|system\s+instructions|master\s+prompt)/i,
    category: "PROMPT_INJECTION",
    severity: "CRITICAL",
    description: "Attempt to dump internal system prompt or operational instructions.",
  },
  {
    id: "RULE-INJ-03",
    name: "Developer Mode Override",
    pattern: /(enable|enter|activate)\s+(developer\s+mode|god\s+mode|unrestricted\s+mode|dan\s+mode)/i,
    category: "PROMPT_INJECTION",
    severity: "CRITICAL",
    description: "Jailbreak attempt using developer mode or DAN persona.",
  },
  {
    id: "RULE-INJ-04",
    name: "Security Guardrails Bypass",
    pattern: /(bypass|disable|override|disregard)\s+(all\s+)?(safety|security|filters|guardrails|policies|moderation)/i,
    category: "PROMPT_INJECTION",
    severity: "CRITICAL",
    description: "Direct request to disable safety guardrails or compliance filters.",
  },
  {
    id: "RULE-INJ-05",
    name: "Role Confusion / Master Persona Hijack",
    pattern: /(you\s+are\s+now|from\s+now\s+on\s+you\s+are)\s+(an?\s+)?(unrestricted|evil|unfiltered|jailbroken|adversarial)\s+ai/i,
    category: "PROMPT_INJECTION",
    severity: "HIGH",
    description: "Adversarial role adoption attempting to disable ethical boundaries.",
  },
  {
    id: "RULE-INJ-06",
    name: "System Delimiter Mimicry",
    pattern: /<\/?(?:system|instruction|admin|override)>/i,
    category: "PROMPT_INJECTION",
    severity: "HIGH",
    description: "Adversarial tag injection attempting to inject pseudo-system framing.",
  },
];

export interface InjectionDetectionResult {
  isInjection: boolean;
  rule?: InjectionRule;
  matchedText?: string;
}

/**
 * Scans text against active injection rules.
 */
export function detectInjection(prompt: string): InjectionDetectionResult {
  if (!prompt || typeof prompt !== "string") {
    return { isInjection: false };
  }

  for (const rule of INJECTION_RULES) {
    const match = prompt.match(rule.pattern);
    if (match) {
      return {
        isInjection: true,
        rule,
        matchedText: match[0],
      };
    }
  }

  return { isInjection: false };
}
