import crypto from "crypto";

export type UserRole = "intern" | "developer" | "executive";

const JWT_SECRET = process.env.DEMO_JWT_SECRET || "aegis-guard-secret-signing-key-production-2026";

interface TokenPayload {
  role: UserRole;
  iat: number;
  exp: number;
}

/**
 * Creates an HMAC-SHA256 signed role token for demonstration.
 * In production, this would be a full OAuth2/OIDC JWT from an enterprise IdP (e.g., Okta/Entra).
 */
export function signDemoToken(role: UserRole): string {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const payload: TokenPayload = {
    role,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 24 * 3600, // 24 hours
  };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", JWT_SECRET)
    .update(`${header}.${body}`)
    .digest("base64url");

  return `${header}.${body}.${signature}`;
}

/**
 * Validates the HMAC-SHA256 signature and returns the authenticated role.
 */
export function verifyRoleToken(token: string): { valid: boolean; role: UserRole } {
  if (!token || typeof token !== "string") {
    return { valid: false, role: "intern" };
  }

  const parts = token.split(".");
  if (parts.length !== 3) {
    return { valid: false, role: "intern" };
  }

  const [header, body, signature] = parts;
  const expectedSig = crypto
    .createHmac("sha256", JWT_SECRET)
    .update(`${header}.${body}`)
    .digest("base64url");

  if (signature !== expectedSig) {
    return { valid: false, role: "intern" };
  }

  try {
    const payload: TokenPayload = JSON.parse(Buffer.from(body, "base64url").toString("utf-8"));
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return { valid: false, role: "intern" };
    }
    if (["intern", "developer", "executive"].includes(payload.role)) {
      return { valid: true, role: payload.role };
    }
  } catch {
    return { valid: false, role: "intern" };
  }

  return { valid: false, role: "intern" };
}
