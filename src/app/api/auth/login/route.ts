import { NextRequest, NextResponse } from "next/server";
import { authenticateUser, signUserToken, USERS } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON in request body." }, { status: 400 });
    }

    const identifier = body.email || body.employee_id || body.user_id || body.identifier;
    const password = body.password;

    if (!identifier) {
      return NextResponse.json(
        { error: "Email or Employee ID is required to sign in." },
        { status: 400 }
      );
    }

    const authResult = authenticateUser(identifier, password);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        {
          error: authResult.message || "Authentication failed.",
          availableAccounts: USERS.map((u) => ({
            id: u.id,
            name: u.name,
            email: u.email,
            role: u.role,
            roleBadge: u.roleBadge,
            clearance: u.clearance,
            passwordHint: u.password,
          })),
        },
        { status: 401 }
      );
    }

    const token = signUserToken(authResult.user);

    return NextResponse.json({
      status: "success",
      token,
      user: authResult.user,
    });
  } catch (err: any) {
    console.error("Login route error:", err);
    return NextResponse.json(
      { error: err?.message || "Authentication service internal error." },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    users: USERS.map((u) => ({
      id: u.id,
      user_id: u.user_id,
      full_name: u.full_name,
      name: u.name,
      title: u.title,
      email: u.email,
      classification_level: u.classification_level,
      role: u.role,
      pipelineRole: u.pipelineRole,
      clearance: u.clearance,
      roleBadge: u.roleBadge,
      access_permissions: u.access_permissions,
      description: u.description,
      avatar: u.avatar,
      passwordHint: u.password,
      canAccessTitan: u.canAccessTitan,
    })),
  });
}
