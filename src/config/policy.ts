export type PolicyAction = "ALLOW" | "WARN" | "MASK" | "BLOCK";

export type ThreatCategory =
  | "PROMPT_INJECTION"
  | "SECRET_LEAK"
  | "CANARY_EGRESS"
  | "RBAC_VIOLATION"
  | "PII_SENSITIVE"
  | "NONE";

export interface PolicyRule {
  category: ThreatCategory;
  action: PolicyAction;
  description: string;
}

export const DEFAULT_POLICY_RULES: Record<ThreatCategory, PolicyRule> = {
  PROMPT_INJECTION: {
    category: "PROMPT_INJECTION",
    action: "BLOCK",
    description: "Adversarial instructions attempting to override model system boundaries are blocked immediately.",
  },
  SECRET_LEAK: {
    category: "SECRET_LEAK",
    action: "BLOCK",
    description: "Inbound credentials, access keys, or internal secret patterns are blocked from transit.",
  },
  CANARY_EGRESS: {
    category: "CANARY_EGRESS",
    action: "BLOCK",
    description: "Outbound egress reflection of security canary tokens is strictly blocked.",
  },
  RBAC_VIOLATION: {
    category: "RBAC_VIOLATION",
    action: "MASK",
    description: "Unauthorized enterprise RAG chunks are quarantined and redacted based on role clearance.",
  },
  PII_SENSITIVE: {
    category: "PII_SENSITIVE",
    action: "MASK",
    description: "Personally identifiable identifiers (PAN, phone, email) are tokenized into safe surrogates.",
  },
  NONE: {
    category: "NONE",
    action: "ALLOW",
    description: "Standard compliant transaction meeting all enterprise boundary checks.",
  },
};

export interface PolicyEvaluation {
  action: PolicyAction;
  rule: string;
  categories: ThreatCategory[];
}

/**
 * Evaluates a set of detected threat categories according to priority:
 * BLOCK > MASK > WARN > ALLOW.
 */
export function evaluatePolicy(categories: ThreatCategory[]): PolicyEvaluation {
  if (categories.length === 0 || (categories.length === 1 && categories[0] === "NONE")) {
    return {
      action: "ALLOW",
      rule: DEFAULT_POLICY_RULES.NONE.description,
      categories: ["NONE"],
    };
  }

  // Priority: BLOCK > MASK > WARN > ALLOW
  if (categories.includes("PROMPT_INJECTION")) {
    return {
      action: "BLOCK",
      rule: DEFAULT_POLICY_RULES.PROMPT_INJECTION.description,
      categories,
    };
  }

  if (categories.includes("SECRET_LEAK")) {
    return {
      action: "BLOCK",
      rule: DEFAULT_POLICY_RULES.SECRET_LEAK.description,
      categories,
    };
  }

  if (categories.includes("CANARY_EGRESS")) {
    return {
      action: "BLOCK",
      rule: DEFAULT_POLICY_RULES.CANARY_EGRESS.description,
      categories,
    };
  }

  if (categories.includes("RBAC_VIOLATION")) {
    return {
      action: "MASK",
      rule: DEFAULT_POLICY_RULES.RBAC_VIOLATION.description,
      categories,
    };
  }

  if (categories.includes("PII_SENSITIVE")) {
    return {
      action: "MASK",
      rule: DEFAULT_POLICY_RULES.PII_SENSITIVE.description,
      categories,
    };
  }

  return {
    action: "ALLOW",
    rule: DEFAULT_POLICY_RULES.NONE.description,
    categories: ["NONE"],
  };
}
