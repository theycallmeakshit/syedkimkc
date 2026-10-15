import { NextRequest, NextResponse } from "next/server";
import { runGatewayPipeline } from "@/lib/pipeline/gateway-pipeline";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    let roleToken = "";
    if (authHeader && authHeader.startsWith("Bearer ")) {
      roleToken = authHeader.substring(7).trim();
    }

    const body = await req.json();
    if (!roleToken && body.role_token) {
      roleToken = body.role_token;
    }

    const clientIp = req.headers.get("x-forwarded-for") || "127.0.0.1";

    const pipelineResponse = await runGatewayPipeline({
      prompt: body.prompt,
      modelId: body.model_id,
      roleToken,
      attachments: body.attachments,
      clientIp,
    });

    if (pipelineResponse.isBlocked) {
      return NextResponse.json(
        {
          error: pipelineResponse.error,
          category: pipelineResponse.category,
          result: pipelineResponse.result,
        },
        { status: pipelineResponse.status }
      );
    }

    return NextResponse.json(
      {
        reply: pipelineResponse.reply,
        result: pipelineResponse.result,
      },
      { status: pipelineResponse.status }
    );
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Internal gateway failure.";
    return NextResponse.json(
      {
        error: errorMsg,
      },
      { status: 500 }
    );
  }
}
