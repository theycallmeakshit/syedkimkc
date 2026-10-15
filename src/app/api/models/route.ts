import { NextResponse } from "next/server";
import { getAvailableModels } from "@/config/providers";

export async function GET() {
  const models = getAvailableModels();

  return NextResponse.json({
    models,
    serverTime: new Date().toISOString(),
    hasConfiguredProviders: models.length > 0,
  });
}
