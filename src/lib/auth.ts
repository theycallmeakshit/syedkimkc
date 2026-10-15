import crypto from "crypto";

export type UserRole = "intern" | "developer" | "executive";

const VALID_ROLES: UserRole[] = ["intern", "developer", "executive"];
const TOKEN_SECRET = process.env.SESSION_SECRET || "aegis-guard-secret-demo-key-2026";
const TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export interface DemoAccount {
  id: string;
  email: string;
  passwordPlainText: string;
  name: string;
  role: UserRole;
  title: string;
  department: string;
  clearanceLevel: number;
  canAccessTitan: boolean;
  canExportAudit: boolean;
  canConfigurePolicies: boolean;
}

export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    id: "user-admin",
    email: "admin@sentinel.ai",
    passwordPlainText: "Admin@12345",
    name: "Admin (CISO)",
    role: "executive",
    title: "Chief Information Security Officer",
    department: "Executive Leadership",
    clearanceLevel: 3,
    canAccessTitan: true,
    canExportAudit: true,
    canConfigurePolicies: true,
  },
  {
    id: "user-analyst",
    email: "analyst@sentinel.ai",
    passwordPlainText: "Analyst@12345",
    name: "SOC Analyst",
    role: "developer",
    title: "Senior Cybersecurity Analyst",
    department: "Information Security & SOC",
    clearanceLevel: 2,
    canAccessTitan: false,
    canExportAudit: true,
    canConfigurePolicies: false,
  },
  {
    id: "user-bob",
    email: "user.bob@sentinel.ai",
    passwordPlainText: "User@12345",
    name: "Bob (Strategy)",
    role: "developer",
    title: "Corporate Strategy Lead",
    department: "Corporate Strategy",
    clearanceLevel: 2,
    canAccessTitan: true,
    canExportAudit: false,
    canConfigurePolicies: false,
  },
  {
    id: "user-alice",
    email: "user.alice@sentinel.ai",
    passwordPlainText: "User@12345",
    name: "Alice (Sales)",
    role: "intern",
    title: "Enterprise Sales Representative",
    department: "Enterprise Sales",
    clearanceLevel: 1,
    canAccessTitan: false,
    canExportAudit: false,
    canConfigurePolicies: false,
  },
];

export function authenticateDemoUser(email: string, passwordPlainText: string): DemoAccount | null {
  const normalizedEmail = email.trim().toLowerCase();
  const found = DEMO_ACCOUNTS.find((acc) => acc.email.toLowerCase() === normalizedEmail);
  if (!found) {
    return null;
  }
  if (found.passwordPlainText !== passwordPlainText) {
    return null;
  }
  return found;
}

export function getDemoUserById(id: string): DemoAccount | null {
  return DEMO_ACCOUNTS.find((acc) => acc.id === id) || null;
}

export function getDemoUserByEmail(email: string): DemoAccount | null {
  const normalizedEmail = email.trim().toLowerCase();
  return DEMO_ACCOUNTS.find((acc) => acc.email.toLowerCase() === normalizedEmail) || null;
}

export function signDemoToken(role: UserRole): string {
  const timestamp = Date.now();
  const payload = `${role}:${timestamp}`;
  const signature = crypto
    .createHmac("sha256", TOKEN_SECRET)
    .update(payload)
    .digest("hex");
  return `${payload}:${signature}`;
}

export function signUserToken(account: DemoAccount): string {
  const timestamp = Date.now();
  const payload = `user:${account.id}:${timestamp}`;
  const signature = crypto
    .createHmac("sha256", TOKEN_SECRET)
    .update(payload)
    .digest("hex");
  return `${payload}:${signature}`;
}

export function verifyRoleToken(token: string | null | undefined): {
  valid: boolean;
  role?: UserRole;
  error?: string;
} {
  if (!token) {
    return { valid: false, error: "Missing role authentication token." };
  }

  const cleanToken = token.startsWith("Bearer ") ? token.slice(7).trim() : token.trim();

  // If token is in user:userId:time:sig format
  if (cleanToken.startsWith("user:")) {
    const parts = cleanToken.split(":");
    if (parts.length === 4) {
      const [, userId, timeStr, signature] = parts;
      const timestamp = parseInt(timeStr, 10);
      if (isNaN(timestamp) || Date.now() - timestamp > TOKEN_TTL_MS) {
        return { valid: false, error: "Role token has expired." };
      }
      const expectedSignature = crypto
        .createHmac("sha256", TOKEN_SECRET)
        .update(`user:${userId}:${timeStr}`)
        .digest("hex");
      if (signature === expectedSignature) {
        const user = getDemoUserById(userId);
        if (user) {
          return { valid: true, role: user.role };
        }
      }
    }
  }

  const parts = cleanToken.split(":");
  if (parts.length !== 3) {
    return { valid: false, error: "Malformed role token format." };
  }

  const [roleStr, timeStr, signature] = parts;
  const role = roleStr as UserRole;
  if (!VALID_ROLES.includes(role)) {
    return { valid: false, error: "Unknown role identifier in token." };
  }

  const timestamp = parseInt(timeStr, 10);
  if (isNaN(timestamp) || Date.now() - timestamp > TOKEN_TTL_MS) {
    return { valid: false, error: "Role token has expired." };
  }

  const expectedSignature = crypto
    .createHmac("sha256", TOKEN_SECRET)
    .update(`${roleStr}:${timeStr}`)
    .digest("hex");

  const sigBuffer = Buffer.from(signature);
  const expBuffer = Buffer.from(expectedSignature);

  if (sigBuffer.length !== expBuffer.length || !crypto.timingSafeEqual(sigBuffer, expBuffer)) {
    return { valid: false, error: "Invalid token cryptographic signature." };
  }

  return { valid: true, role };
}

export function verifyUserToken(token: string | null | undefined): {
  valid: boolean;
  user: DemoAccount | null;
  role: UserRole;
} {
  if (!token) {
    return { valid: false, user: null, role: "intern" };
  }

  const cleanToken = token.startsWith("Bearer ") ? token.slice(7).trim() : token.trim();

  if (cleanToken.startsWith("user:")) {
    const parts = cleanToken.split(":");
    if (parts.length === 4) {
      const [, userId, timeStr, signature] = parts;
      const timestamp = parseInt(timeStr, 10);
      if (isNaN(timestamp) || Date.now() - timestamp > TOKEN_TTL_MS) {
        return { valid: false, user: null, role: "intern" };
      }
      const expectedSignature = crypto
        .createHmac("sha256", TOKEN_SECRET)
        .update(`user:${userId}:${timeStr}`)
        .digest("hex");
      if (signature === expectedSignature) {
        const user = getDemoUserById(userId);
        if (user) {
          return { valid: true, user, role: user.role };
        }
      }
    }
  }

  const roleCheck = verifyRoleToken(token);
  if (roleCheck.valid && roleCheck.role) {
    // If it's a role token, match with first default demo user with that role
    const matchedUser = DEMO_ACCOUNTS.find((acc) => acc.role === roleCheck.role) || null;
    return { valid: true, user: matchedUser, role: roleCheck.role };
  }

  return { valid: false, user: null, role: "intern" };
}
