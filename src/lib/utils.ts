import { ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import crypto from "crypto";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Computes SHA-256 hash for Zero-Knowledge logging.
 * The raw plaintext payload is never stored; only its cryptographic fingerprint.
 */
export function computeZeroKnowledgeHash(input: string): string {
  if (!input) return "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";
  return crypto.createHash("sha256").update(input, "utf8").digest("hex");
}

export function formatMs(ms: number): string {
  if (ms < 1) return "<1ms";
  return `${Math.round(ms)}ms`;
}

export function generateUUID(): string {
  return crypto.randomUUID();
}
