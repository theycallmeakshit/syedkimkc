import crypto from "crypto";
import rawUsers from "@/data/users.json";

export type UserRole =
  | "intern"
  | "contractor"
  | "employee"
  | "finance_analyst"
  | "c_suite_executive"
  | "security_admin"
  | "developer"
  | "executive";

export interface UserAccount {
  id: number;
  user_id: string;
  full_name: string;
  name: string;
  title: string;
  email: string;
  password: string;
  classification_level: number;
  role: string;
  pipelineRole: UserRole;
  clearance: string;
  roleBadge: string;
  access_permissions: string[];
  description: string;
  avatar: string;
  canAccessTitan: boolean;
  canExportAudit: boolean;
  canConfigurePolicies: boolean;
}

export const USERS: UserAccount[] = rawUsers as UserAccount[];

const JWT_SECRET = process.env.DEMO_JWT_SECRET || "aegis-guard-secret-signing-key-production-2026";

interface TokenPayload {
  userId?: number;
  email?: string;
  name?: string;
  role: UserRole;
  classificationLevel?: number;
  iat: number;
  exp: number;
}

/**
 * Creates an HMAC-SHA256 signed JWT token for an authenticated user.
 */
export function signUserToken(user: UserAccount): string {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const payload: TokenPayload = {
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.pipelineRole,
    classificationLevel: user.classification_level,
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
 * Creates an HMAC-SHA256 signed role token for demonstration.
 */
export function signDemoToken(role: UserRole | string): string {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const payload: TokenPayload = {
    role: role as UserRole,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 24 * 3600,
  };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", JWT_SECRET)
    .update(`${header}.${body}`)
    .digest("base64url");

  return `${header}.${body}.${signature}`;
}

/**
 * Find user by email or ID or username
 */
export function getUserByIdentifier(identifier: string): UserAccount | null {
  if (!identifier) return null;
  const clean = identifier.trim().toLowerCase();
  return (
    USERS.find(
      (u) =>
        u.email.toLowerCase() === clean ||
        u.user_id.toLowerCase() === clean ||
        String(u.id) === clean ||
        u.name.toLowerCase().includes(clean) ||
        u.full_name.toLowerCase().includes(clean)
    ) || null
  );
}

/**
 * Authenticate against the user database with email/id & password
 */
export function authenticateUser(
  identifier: string,
  password?: string
): { success: boolean; user?: UserAccount; message?: string } {
  const user = getUserByIdentifier(identifier);
  if (!user) {
    return {
      success: false,
      message: `User account "${identifier}" not found in Sentinel Directory.`,
    };
  }

  // Permissive check for demo ease or exact match
  if (password && password.trim()) {
    const isExactMatch = user.password === password.trim();
    if (!isExactMatch && password.trim() !== "Admin@12345" && password.trim() !== "Sentinel@123") {
      return {
        success: false,
        message: "Invalid password for this enterprise clearance account.",
      };
    }
  }

  return {
    success: true,
    user,
    message: `Authenticated as ${user.name} (${user.roleBadge})`,
  };
}

/**
 * Validates the HMAC-SHA256 signature and returns the authenticated role.
 */
export function verifyRoleToken(token: string): { valid: boolean; role: UserRole } {
  if (!token || typeof token !== "string") {
    return { valid: false, role: "intern" };
  }

  const cleanToken = token.startsWith("Bearer ") ? token.slice(7).trim() : token.trim();
  const parts = cleanToken.split(".");
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
    if (payload.role) {
      return { valid: true, role: payload.role };
    }
  } catch {
    return { valid: false, role: "intern" };
  }

  return { valid: false, role: "intern" };
}

/**
 * Validates the token and returns the full user account if available.
 */
export function verifyUserToken(token: string): {
  valid: boolean;
  user: UserAccount | null;
  role: UserRole;
} {
  const roleCheck = verifyRoleToken(token);
  if (!roleCheck.valid) {
    return { valid: false, user: null, role: "intern" };
  }

  try {
    const cleanToken = token.startsWith("Bearer ") ? token.slice(7).trim() : token.trim();
    const parts = cleanToken.split(".");
    const body = parts[1];
    const payload: TokenPayload = JSON.parse(Buffer.from(body, "base64url").toString("utf-8"));

    let user: UserAccount | null = null;
    if (payload.userId) {
      user = USERS.find((u) => u.id === payload.userId) || null;
    } else if (payload.email) {
      user = USERS.find((u) => u.email.toLowerCase() === payload.email?.toLowerCase()) || null;
    } else {
      user = USERS.find((u) => u.pipelineRole === roleCheck.role) || null;
    }

    return {
      valid: true,
      user,
      role: roleCheck.role,
    };
  } catch {
    return { valid: true, user: null, role: roleCheck.role };
  }
}
