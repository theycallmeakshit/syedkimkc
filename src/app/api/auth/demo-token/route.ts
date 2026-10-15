import { NextRequest, NextResponse } from "next/server";
import { signDemoToken, UserRole } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const role = (body.role || "intern") as UserRole;

    if (!["intern", "developer", "executive"].includes(role)) {
      return NextResponse.json({ error: "Invalid role specified." }, { status: 400 });
    }

    const token = signDemoToken(role);
    return NextResponse.json({
      token,
      role,
      issuedAt: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json({ error: "Failed to generate demo token." }, { status: 500 });
  }
}
