import { NextRequest, NextResponse } from "next/server";
import { verifyUserToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Missing authorization token." }, { status: 401 });
  }

  const token = authHeader.substring(7).trim();
  const { valid, user, role } = verifyUserToken(token);

  if (!valid) {
    return NextResponse.json({ error: "Invalid or expired session token." }, { status: 401 });
  }

  if (user) {
    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        title: user.title,
        department: user.department,
        clearanceLevel: user.clearanceLevel,
        canAccessTitan: user.canAccessTitan,
        canExportAudit: user.canExportAudit,
        canConfigurePolicies: user.canConfigurePolicies,
      },
    });
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      id: "anonymous-role",
      email: `${role}@aegis.corp`,
      name: `Role: ${role.toUpperCase()}`,
      role,
      title: `${role.toUpperCase()} Clearance`,
      department: "Corporate",
      clearanceLevel: role === "executive" ? 3 : role === "developer" ? 2 : 1,
      canAccessTitan: role === "executive",
      canExportAudit: role === "executive" || role === "developer",
      canConfigurePolicies: role === "executive",
    },
  });
}
