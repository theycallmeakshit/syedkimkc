import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Try fetching generated sample images from Python FastAPI service
    const res = await fetch("http://127.0.0.1:8000/api/samples", { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }
  } catch (err) {
    // Fallback if FastAPI is not reachable
  }

  return NextResponse.json({
    pan_card: null,
    salary_slip: null
  });
}
