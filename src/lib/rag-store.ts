import { RagChunk, UserRole } from "./types";

export const ROLE_CLEARANCE_MAP: Record<UserRole, { level: number; label: string; maxClassification: string }> = {
  intern: { level: 1, label: "Level 1: Restricted Intern", maxClassification: "PUBLIC" },
  contractor: { level: 1, label: "Level 1: Third-Party Contractor", maxClassification: "PUBLIC" },
  employee: { level: 2, label: "Level 2: Full-Time Employee", maxClassification: "INTERNAL" },
  finance_analyst: { level: 3, label: "Level 3: Finance Specialist", maxClassification: "CONFIDENTIAL_FINANCIAL" },
  c_suite_executive: { level: 4, label: "Level 4: Executive Clearance", maxClassification: "RESTRICTED_EXECUTIVE" },
  security_admin: { level: 5, label: "Level 5: SOC SuperAdmin", maxClassification: "SECURITY_AUDIT" },
};

export const ENTERPRISE_KNOWLEDGE_BASE: Array<{
  id: string;
  title: string;
  classification: RagChunk['classification'];
  requiredClearanceLevel: number;
  keywords: string[];
  content: string;
}> = [
  {
    id: "DOC-PUB-01",
    title: "Public Corporate Mission & Generative AI Policy 2026",
    classification: "PUBLIC",
    requiredClearanceLevel: 1,
    keywords: ["policy", "guidelines", "acceptable use", "ai", "overview", "public", "company"],
    content: "All enterprise employees and contractors must route all LLM requests through the AEGIS-AI security gateway. Storing raw client identifiers in model memory is prohibited. Public guidelines mandate zero-knowledge logging and encrypted transmission."
  },
  {
    id: "DOC-INT-02",
    title: "Internal Microservices Architecture & Gateway Specs",
    classification: "INTERNAL",
    requiredClearanceLevel: 2,
    keywords: ["architecture", "gateway", "microservices", "spec", "internal", "engineering", "api"],
    content: "AEGIS-AI acts as an inline reverse proxy running on port 3000/8000. Text modalities are scanned for regex/NER PII, while multi-modal image payloads invoke local OCR with cv2.rectangle visual redaction before reaching upstream inference clusters."
  },
  {
    id: "DOC-FIN-03",
    title: "Q3 2026 Preliminary Financial Audit & Executive Earnings",
    classification: "CONFIDENTIAL_FINANCIAL",
    requiredClearanceLevel: 3,
    keywords: ["financial", "q3", "earnings", "revenue", "ebitda", "audit", "balance sheet", "salary", "tax"],
    content: "CONFIDENTIAL FINANCIAL: Q3 Gross Revenue clocked $428.4M with EBITDA margin of 31.8%. Retained enterprise treasury holds $95.2M in Tier-1 bank reserves (Account: 50100492819201, IFSC: HDFC0001234). Disbursed employee payroll totals $182.4M."
  },
  {
    id: "DOC-EXEC-04",
    title: "Project Titan: Unannounced M&A Acquisition Strategy & Valuation",
    classification: "RESTRICTED_EXECUTIVE",
    requiredClearanceLevel: 4,
    keywords: ["titan", "acquisition", "m&a", "merger", "valuation", "strategy", "executive", "board"],
    content: "RESTRICTED TO C-SUITE: Project Titan details the all-cash acquisition of CyberDefense Labs for $142M scheduled for formal announcement in Q4. Target enterprise value includes intellectual property, 18 patents, and existing US federal security certifications."
  },
  {
    id: "DOC-SEC-05",
    title: "Infrastructure Secrets, Active Canary Keys & SOC Runbook",
    classification: "SECURITY_AUDIT",
    requiredClearanceLevel: 5,
    keywords: ["secrets", "canary", "soc", "admin", "keys", "firewall", "credentials", "incident"],
    content: "STRICTLY SECURITY ADMIN ONLY: Active Gateway Egress Canary Key is AEGIS-CANARY-SEC-99823-ENTERPRISE-VAULT. Master HSM database string: postgresql://aegis_master:K9#mQx!882@db.corp.internal:5432/soc_vault. Any outbound reflection of this token triggers immediate 403 quarantine and SOC incident escalation."
  }
];

export function retrieveRagDocuments(query: string, userRole: UserRole): {
  chunks: RagChunk[];
  allowedCount: number;
  blockedCount: number;
  totalRetrieved: number;
  rbacSummary: string;
} {
  const userClearance = ROLE_CLEARANCE_MAP[userRole] || ROLE_CLEARANCE_MAP.intern;
  const lowerQuery = query.toLowerCase();

  // Find candidate chunks by keyword or semantic match (or return all relevant if query is broad)
  const matchedDocs = ENTERPRISE_KNOWLEDGE_BASE.filter(doc => {
    return doc.keywords.some(kw => lowerQuery.includes(kw)) ||
           lowerQuery.includes("rag") ||
           lowerQuery.includes("document") ||
           lowerQuery.includes("confidential") ||
           lowerQuery.includes("financial") ||
           lowerQuery.includes("internal") ||
           lowerQuery.includes("secret") ||
           lowerQuery.includes("project");
  });

  // If no specific match, pick top 3 docs as baseline context
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
        content: `[RESTRICTED CHUNK REDACTED BY AEGIS-AI RBAC]: Document classification "${doc.classification}" requires Clearance Level ${doc.requiredClearanceLevel}, but role "${userRole}" possesses Clearance Level ${userClearance.level} (${userClearance.maxClassification} max).`,
        allowed: false,
        quarantineReason: `Insufficient privilege: Role '${userRole}' (Level ${userClearance.level}) cannot access classification '${doc.classification}' (Level ${doc.requiredClearanceLevel}).`
      });
    }
  }

  const rbacSummary = blockedCount > 0 
    ? `RBAC Enforced: ${blockedCount} restricted chunk(s) quarantined out of ${chunks.length} retrieved. Allowed: ${allowedCount}.`
    : `RBAC Verified: All ${allowedCount} retrieved chunk(s) authorized for role '${userRole}' (Level ${userClearance.level}).`;

  return {
    chunks,
    allowedCount,
    blockedCount,
    totalRetrieved: chunks.length,
    rbacSummary
  };
}


export interface KnowledgeChunk {
  id: string;
  title: string;
  min_role: "intern" | "developer" | "executive";
  classification: "PUBLIC" | "INTERNAL" | "RESTRICTED";
  keywords: string[];
  content: string;
}

export const ROLE_HIERARCHY: Record<string, number> = {
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

export function retrievePermittedRagChunks(
  query: string,
  callerRole: "intern" | "developer" | "executive" | string
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
      const requiredLevel = ROLE_HIERARCHY[chunk.min_role];
      if (callerLevel >= requiredLevel) {
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
