import { NextRequest, NextResponse } from "next/server";
import { extractExperiment } from "@/lib/llm";
import { ChatMessage } from "@/lib/schema";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const history: ChatMessage[] = body.history;

    if (!Array.isArray(history) || history.length === 0) {
      return NextResponse.json(
        { error: "Request must include a non-empty `history` array." },
        { status: 400 }
      );
    }

    const result = await extractExperiment(history);
    return NextResponse.json(result);
  } catch (err: any) {
    console.error("POST /api/experiment failed:", err);
    return NextResponse.json(
      { error: err?.message ?? "Unknown server error." },
      { status: 500 }
    );
  }
}
