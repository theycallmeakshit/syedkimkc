import crypto from "crypto";
import { UserRole } from "./auth";
import { PolicyAction, ThreatCategory } from "../config/policy";

export interface AuditEntityMetadata {
  type: string;
  length: number;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  role: UserRole;
  model_id: string;
  action: PolicyAction;
  categories: ThreatCategory[];
  rule: string;
  masked_prompt: string;
  entity_types_and_lengths: AuditEntityMetadata[];
  overhead_ms: number;
  previous_hash: string;
  hash: string;
}

export interface AuditEntryParams {
  role: UserRole;
  model_id: string;
  action: PolicyAction;
  categories: ThreatCategory[];
  rule: string;
  masked_prompt: string;
  entity_types_and_lengths: AuditEntityMetadata[];
  overhead_ms: number;
}

const GENESIS_HASH = "0000000000000000000000000000000000000000000000000000000000000000";

class AuditLogStore {
  private logs: AuditLogEntry[] = [];
  private maxLogs = 500;

  constructor() {
    this.logs = [];
  }

  public getLatestHash(): string {
    if (this.logs.length === 0) return GENESIS_HASH;
    return this.logs[0].hash;
  }

  public addEntry(params: AuditEntryParams | any): AuditLogEntry {
    const timestamp = params.timestamp || new Date().toISOString();
    const previous_hash = this.getLatestHash();

    const role: UserRole =
      params.role === "developer" || params.role === "executive"
        ? params.role
        : params.userRole === "c_suite_executive" || params.userRole === "executive"
        ? "executive"
        : params.userRole === "employee" || params.userRole === "finance_analyst" || params.userRole === "developer"
        ? "developer"
        : "intern";

    const model_id: string = params.model_id || "upstream-gateway";
    const action: PolicyAction =
      params.action === "BLOCK"
        ? "BLOCK"
        : params.action === "MASK"
        ? "MASK"
        : "ALLOW";
    const categories: ThreatCategory[] = Array.isArray(params.categories)
      ? params.categories
      : params.threat && params.threat !== "NONE"
      ? [params.threat as ThreatCategory]
      : [];
    const rule: string = params.rule || params.summary || "Policy evaluation";
    const masked_prompt: string = params.masked_prompt || "[Zero knowledge payload]";
    const entity_types_and_lengths: AuditEntityMetadata[] =
      Array.isArray(params.entity_types_and_lengths)
        ? params.entity_types_and_lengths
        : [];
    const overhead_ms: number =
      typeof params.overhead_ms === "number"
        ? params.overhead_ms
        : typeof params.latencyMs === "number"
        ? params.latencyMs
        : 0;

    // Canonical representation for reproducible SHA-256 calculation
    const canonicalPayload = JSON.stringify({
      timestamp,
      role,
      model_id,
      action,
      categories,
      rule,
      masked_prompt,
      entity_types_and_lengths,
      overhead_ms,
    });

    const hash = crypto
      .createHash("sha256")
      .update(previous_hash + canonicalPayload)
      .digest("hex");

    const entry: AuditLogEntry = {
      id: params.id || `AUDIT-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`,
      timestamp,
      role,
      model_id,
      action,
      categories,
      rule,
      masked_prompt,
      entity_types_and_lengths,
      overhead_ms,
      previous_hash,
      hash,
    };

    // Store newest first
    this.logs.unshift(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.pop();
    }

    return entry;
  }

  public getLogs(limit = 100): AuditLogEntry[] {
    return this.logs.slice(0, limit);
  }

  /**
   * Verifies the SHA-256 cryptographic hash chain of the audit log.
   */
  public verifyChain(): boolean {
    if (this.logs.length === 0) return true;

    // Verify from oldest to newest
    const chronological = [...this.logs].reverse();
    let prev = GENESIS_HASH;

    for (const entry of chronological) {
      if (entry.previous_hash !== prev) {
        return false;
      }

      const canonicalPayload = JSON.stringify({
        timestamp: entry.timestamp,
        role: entry.role,
        model_id: entry.model_id,
        action: entry.action,
        categories: entry.categories,
        rule: entry.rule,
        masked_prompt: entry.masked_prompt,
        entity_types_and_lengths: entry.entity_types_and_lengths,
        overhead_ms: entry.overhead_ms,
      });

      const expected = crypto
        .createHash("sha256")
        .update(entry.previous_hash + canonicalPayload)
        .digest("hex");

      if (entry.hash !== expected) {
        return false;
      }

      prev = entry.hash;
    }

    return true;
  }

  public getMetrics() {
    const total = this.logs.length;
    const blocked = this.logs.filter((l) => l.action === "BLOCK").length;
    const masked = this.logs.filter((l) => l.action === "MASK").length;
    const totalEntitiesMasked = this.logs.reduce(
      (acc, l) => acc + l.entity_types_and_lengths.length,
      0
    );
    const avgOverhead =
      total > 0
        ? Math.round(this.logs.reduce((acc, l) => acc + l.overhead_ms, 0) / total)
        : 0;

    return {
      totalRequests: total,
      blockedRequests: blocked,
      maskedRequests: masked,
      entitiesMaskedCount: totalEntitiesMasked,
      piiRedactedCount: totalEntitiesMasked,
      rbacQuarantinedCount: this.logs.filter((l) => l.categories.includes("RBAC_VIOLATION")).length,
      canaryBreachesIntercepted: this.logs.filter((l) => l.categories.includes("CANARY_EGRESS")).length,
      avgLatencyMs: avgOverhead,
      avgOverheadMs: avgOverhead,
      isChainValid: this.verifyChain(),
    };
  }

  public clearLogs(): void {
    this.logs = [];
  }
}

export const globalAuditStore = new AuditLogStore();
