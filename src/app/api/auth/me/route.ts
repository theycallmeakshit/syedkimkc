import { NextRequest, NextResponse } from "next/server";
import { verifyUserToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization") || "";
    if (!authHeader) {
      return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
    }

    const { valid, user, role } = verifyUserToken(authHeader);
    if (!valid || !user) {
      return NextResponse.json({ authenticated: false, user: null, role }, { status: 401 });
    }

    return NextResponse.json({
      authenticated: true,
      user,
      role,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to verify session." },
      { status: 500 }
    );
  }
}
