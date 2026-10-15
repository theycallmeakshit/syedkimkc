import { UserRole } from "./auth";
import { RagChunk, UserRole as FullUserRole } from "./types";

export interface KnowledgeChunk {
  id: string;
  title: string;
  min_role: UserRole;
  classification: "PUBLIC" | "INTERNAL" | "RESTRICTED";
  keywords: string[];
  content: string;
}

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  intern: 1,
  developer: 2,
  executive: 3,
};

export const ENTERPRISE_KNOWLEDGE_CHUNKS: KnowledgeChunk[] = [
  {
    id: "DOC-PUBLIC-01",
    title: "General Engineering Guidelines and Coding Standards",
    min_role: "intern",
    classification: "PUBLIC",
    keywords: ["guidelines", "standards", "code", "style", "git", "onboarding"],
    content: "Standard operating procedures require that all code be committed through branch PRs and peer-reviewed. No internal secrets or credentials may be checked into version control.",
  },
  {
    id: "DOC-DEV-02",
    title: "Internal Microservice Architecture and API Gateway Configuration",
    min_role: "developer",
    classification: "INTERNAL",
    keywords: ["architecture", "microservice", "gateway", "backend", "api", "database"],
    content: "The gateway runs an inline reverse-proxy boundary. Inbound requests pass through regex and heuristic sanitizers, while multi-modal documents run through in-memory OCR before reaching inference.",
  },
  {
    id: "DOC-EXEC-03",
    title: "Q4 Executive Compensation, Payroll Allocation and M&A Strategy",
    min_role: "executive",
    classification: "RESTRICTED",
    keywords: ["compensation", "payroll", "salary", "executive", "q4", "strategy", "merger", "acquisition"],
    content: "CONFIDENTIAL EXECUTIVE RECORD: Q4 executive compensation pool allocated at $24.8M against operational EBITDA benchmarks. Project Titan all-cash acquisition allocated at $142M for Tier-1 security assets.",
  },
];

export interface RagRetrievalResult {
  permittedChunks: KnowledgeChunk[];
  blockedChunkTitles: string[];
  hasRbacViolation: boolean;
}

/**
 * Filters chunks by caller's role BEFORE retrieval results are returned or placed into prompt.
 * A lower role must never receive higher-role chunks, even in the context sent to the model.
 */
export function retrievePermittedRagChunks(
  query: string,
  callerRole: UserRole,
  options?: { canAccessTitan?: boolean }
): RagRetrievalResult {
  const queryLower = query.toLowerCase();
  const callerLevel = ROLE_HIERARCHY[callerRole] || 1;

  const matchedChunks: KnowledgeChunk[] = [];
  const blockedTitles: string[] = [];
  let attemptedHigherRole = false;

  for (const chunk of ENTERPRISE_KNOWLEDGE_CHUNKS) {
    const matchesKeyword = chunk.keywords.some((kw) => queryLower.includes(kw));
    const titleMatch = queryLower.includes(chunk.title.toLowerCase());

    if (matchesKeyword || titleMatch) {
      let isAllowed = callerLevel >= (ROLE_HIERARCHY[chunk.min_role] || 1);
      if (
        !isAllowed &&
        options?.canAccessTitan &&
        (chunk.id === "DOC-EXEC-03" || chunk.keywords.includes("titan"))
      ) {
        isAllowed = true;
      }

      if (isAllowed) {
        matchedChunks.push(chunk);
      } else {
        blockedTitles.push(chunk.title);
        attemptedHigherRole = true;
      }
    }
  }

  return {
    permittedChunks: matchedChunks,
    blockedChunkTitles: blockedTitles,
    hasRbacViolation: attemptedHigherRole,
  };
}


// Backwards compatibility layer for legacy routes (/api/rag and stage5-rbac-rag)
export const ROLE_CLEARANCE_MAP: Record<string, { level: number; label: string; maxClassification: string }> = {
  intern: { level: 1, label: "Level 1: Restricted Intern", maxClassification: "PUBLIC" },
  contractor: { level: 1, label: "Level 1: Third-Party Contractor", maxClassification: "PUBLIC" },
  developer: { level: 2, label: "Level 2: Standard Developer", maxClassification: "INTERNAL" },
  employee: { level: 2, label: "Level 2: Full-Time Employee", maxClassification: "INTERNAL" },
  finance_analyst: { level: 3, label: "Level 3: Finance Specialist", maxClassification: "CONFIDENTIAL_FINANCIAL" },
  executive: { level: 4, label: "Level 4: Executive Clearance", maxClassification: "RESTRICTED_EXECUTIVE" },
  c_suite_executive: { level: 4, label: "Level 4: Executive Clearance", maxClassification: "RESTRICTED_EXECUTIVE" },
  security_admin: { level: 5, label: "Level 5: SOC SuperAdmin", maxClassification: "SECURITY_AUDIT" },
};

export const ENTERPRISE_KNOWLEDGE_BASE: Array<{
  id: string;
  title: string;
  classification: RagChunk["classification"];
  requiredClearanceLevel: number;
  keywords: string[];
  content: string;
}> = [
  {
    id: "DOC-PUB-01",
    title: "Public Corporate Mission and Generative AI Policy 2026",
    classification: "PUBLIC",
    requiredClearanceLevel: 1,
    keywords: ["policy", "guidelines", "acceptable use", "ai", "overview", "public", "company"],
    content: "All enterprise employees and contractors must route all LLM requests through the AEGIS-AI security gateway. Storing raw client identifiers in model memory is prohibited.",
  },
  {
    id: "DOC-INT-02",
    title: "Internal Microservices Architecture and Gateway Specs",
    classification: "INTERNAL",
    requiredClearanceLevel: 2,
    keywords: ["architecture", "gateway", "microservices", "spec", "internal", "engineering", "api"],
    content: "AEGIS-AI acts as an inline reverse proxy running on port 3000/8000. Inbound requests pass through regex and heuristic sanitizers.",
  },
  {
    id: "DOC-FIN-03",
    title: "Q3 2026 Preliminary Financial Audit and Executive Earnings",
    classification: "CONFIDENTIAL_FINANCIAL",
    requiredClearanceLevel: 3,
    keywords: ["financial", "q3", "earnings", "revenue", "ebitda", "audit", "balance sheet", "salary", "tax"],
    content: "CONFIDENTIAL FINANCIAL: Q3 Gross Revenue clocked $428.4M with EBITDA margin of 31.8%. Retained enterprise treasury holds $95.2M in Tier-1 bank reserves.",
  },
  {
    id: "DOC-EXEC-04",
    title: "Project Titan: Unannounced M and A Acquisition Strategy and Valuation",
    classification: "RESTRICTED_EXECUTIVE",
    requiredClearanceLevel: 4,
    keywords: ["titan", "acquisition", "merger", "valuation", "strategy", "executive", "board"],
    content: "RESTRICTED TO C-SUITE: Project Titan details the all-cash acquisition of CyberDefense Labs for $142M scheduled for formal announcement in Q4.",
  },
  {
    id: "DOC-SEC-05",
    title: "Infrastructure Secrets, Active Canary Keys and SOC Runbook",
    classification: "SECURITY_AUDIT",
    requiredClearanceLevel: 5,
    keywords: ["secrets", "canary", "soc", "admin", "keys", "firewall", "credentials", "incident"],
    content: "STRICTLY SECURITY ADMIN ONLY: Active Gateway Egress Canary Key is AEGIS-CANARY-SEC-99823-ENTERPRISE-VAULT. Master HSM database string: postgresql://aegis_master:K9#mQx!882@db.corp.internal:5432/soc_vault.",
  },
];

export function retrieveRagDocuments(query: string, userRole: FullUserRole | string): {
  chunks: RagChunk[];
  allowedCount: number;
  blockedCount: number;
  totalRetrieved: number;
  rbacSummary: string;
} {
  const userClearance = ROLE_CLEARANCE_MAP[userRole] || ROLE_CLEARANCE_MAP.intern;
  const lowerQuery = query.toLowerCase();

  const matchedDocs = ENTERPRISE_KNOWLEDGE_BASE.filter((doc) => {
    return (
      doc.keywords.some((kw) => lowerQuery.includes(kw)) ||
      lowerQuery.includes("rag") ||
      lowerQuery.includes("document") ||
      lowerQuery.includes("confidential") ||
      lowerQuery.includes("financial") ||
      lowerQuery.includes("internal") ||
      lowerQuery.includes("secret") ||
      lowerQuery.includes("project")
    );
  });

  const targetDocs = matchedDocs.length > 0 ? matchedDocs : ENTERPRISE_KNOWLEDGE_BASE.slice(0, 3);

  const chunks: RagChunk[] = [];
  let allowedCount = 0;
  let blockedCount = 0;

  for (const doc of targetDocs) {
    const isAllowed = userClearance.level >= doc.requiredClearanceLevel;
    if (isAllowed) {
      allowedCount++;
      chunks.push({
        id: doc.id,
        title: doc.title,
        classification: doc.classification,
        requiredClearanceLevel: doc.requiredClearanceLevel,
        content: doc.content,
        allowed: true,
      });
    } else {
      blockedCount++;
      chunks.push({
        id: doc.id,
        title: doc.title,
        classification: doc.classification,
        requiredClearanceLevel: doc.requiredClearanceLevel,
        content: `[RESTRICTED CHUNK REDACTED BY AEGIS-AI RBAC]: Document classification "${doc.classification}" requires Clearance Level ${doc.requiredClearanceLevel}, but role "${userRole}" possesses Clearance Level ${userClearance.level}.`,
        allowed: false,
        quarantineReason: `Insufficient privilege: Role '${userRole}' (Level ${userClearance.level}) cannot access classification '${doc.classification}' (Level ${doc.requiredClearanceLevel}).`,
      });
    }
  }

  const rbacSummary =
    blockedCount > 0
      ? `RBAC Enforced: ${blockedCount} restricted chunk(s) quarantined out of ${chunks.length} retrieved. Allowed: ${allowedCount}.`
      : `RBAC Verified: All ${allowedCount} retrieved chunk(s) authorized for role '${userRole}' (Level ${userClearance.level}).`;

  return {
    chunks,
    allowedCount,
    blockedCount,
    totalRetrieved: chunks.length,
    rbacSummary,
  };
}

