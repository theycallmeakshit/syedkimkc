import { NextRequest, NextResponse } from "next/server";
import { globalAuditStore } from "@/lib/audit-store";

export async function GET(req: NextRequest) {
  const logs = globalAuditStore.getLogs(500);
  const isChainValid = globalAuditStore.verifyChain();
  const metrics = globalAuditStore.getMetrics();

  const exportPayload = {
    exportedAt: new Date().toISOString(),
    isChainValid,
    metrics,
    totalEntries: logs.length,
    entries: logs,
  };

  return new NextResponse(JSON.stringify(exportPayload, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": 'attachment; filename="aegis-audit-ledger.json"',
    },
  });
}
