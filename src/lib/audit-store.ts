import { AuditLogEntry } from "./types";

class AuditLogStore {
  private logs: AuditLogEntry[] = [];
  private maxLogs = 500;

  constructor() {
    this.logs = [];
  }

  public addEntry(entry: AuditLogEntry) {
    this.logs.unshift(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.pop();
    }
  }

  public getLogs(limit: number = 100): AuditLogEntry[] {
    return this.logs.slice(0, limit);
  }

  public getMetrics() {
    const total = this.logs.length;
    const blocked = this.logs.filter((l) => l.action === "BLOCK").length;
    const masked = this.logs.filter((l) => l.action === "MASK").length;
    const piiRedacted = this.logs.reduce((acc, l) => acc + l.piiTokensCount, 0);
    const rbacQuarantined = this.logs.reduce((acc, l) => acc + l.ragQuarantinedCount, 0);
    const canaryBreaches = this.logs.filter((l) => l.canaryDetected).length;
    const avgLatency =
      total > 0
        ? Math.round(this.logs.reduce((acc, l) => acc + l.latencyMs, 0) / total)
        : 0;

    return {
      totalRequests: total,
      blockedRequests: blocked,
      maskedRequests: masked,
      piiRedactedCount: piiRedacted,
      rbacQuarantinedCount: rbacQuarantined,
      canaryBreachesIntercepted: canaryBreaches,
      avgLatencyMs: avgLatency,
    };
  }

  public clearLogs() {
    this.logs = [];
  }
}

export const globalAuditStore = new AuditLogStore();
