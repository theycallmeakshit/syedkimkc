import { NextRequest, NextResponse } from "next/server";
import { globalAuditStore } from "@/lib/audit-store";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const limit = parseInt(url.searchParams.get("limit") || "100", 10);

  const logs = globalAuditStore.getLogs(limit);
  const metrics = globalAuditStore.getMetrics();

  return NextResponse.json({
    metrics,
    logs,
    serverTime: new Date().toISOString()
  });
}
