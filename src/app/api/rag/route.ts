import { NextRequest, NextResponse } from "next/server";
import { ENTERPRISE_KNOWLEDGE_BASE, ROLE_CLEARANCE_MAP, retrieveRagDocuments } from "@/lib/rag-store";
import { UserRole } from "@/lib/types";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const role = (url.searchParams.get("role") || "intern") as UserRole;
  const query = url.searchParams.get("query") || "financial earnings audit policy";

  const retrievalResult = retrieveRagDocuments(query, role);

  return NextResponse.json({
    roleMatrix: ROLE_CLEARANCE_MAP,
    knowledgeBase: ENTERPRISE_KNOWLEDGE_BASE,
    retrievalSimulation: retrievalResult
  });
}
