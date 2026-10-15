import { NextRequest, NextResponse } from "next/server";
import { authenticateDemoUser, signUserToken, DEMO_ACCOUNTS } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    const user = authenticateDemoUser(email, password);
    if (!user) {
      return NextResponse.json(
        {
          error: "Invalid email or password. Please use one of the one-click demo credentials.",
          validDemoAccounts: DEMO_ACCOUNTS.map((acc) => ({
            email: acc.email,
            role: acc.role,
            name: acc.name,
            title: acc.title,
          })),
        },
        { status: 401 }
      );
    }

    const token = signUserToken(user);
    return NextResponse.json({
      token,
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
  } catch {
    return NextResponse.json(
      { error: "Authentication service error." },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    accounts: DEMO_ACCOUNTS.map((acc) => ({
      id: acc.id,
      email: acc.email,
      name: acc.name,
      role: acc.role,
      title: acc.title,
      department: acc.department,
      clearanceLevel: acc.clearanceLevel,
      canAccessTitan: acc.canAccessTitan,
      passwordHint: acc.passwordPlainText,
    })),
  });
}
