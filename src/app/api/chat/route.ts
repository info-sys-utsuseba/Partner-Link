import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildSystemPrompt, sanitizeTerms } from "@/constants/terms";

export const runtime = "nodejs";

type ChatRequest = {
  query: string;
  sessionId?: string;
};

export async function POST(req: Request) {
  const { query, sessionId } = (await req.json()) as ChatRequest;

  if (!query?.trim()) {
    return NextResponse.json({ error: "query is required" }, { status: 400 });
  }

  // TODO: 実モデル接続。スピードリリース用に echo + system prompt の存在を証明する最小実装。
  const systemPrompt = buildSystemPrompt();
  const draft = `ご質問ありがとうございます。現時点ではスタートアップ構成での仮応答です。\n\n【ご質問】\n${query}`;
  const answer = sanitizeTerms(draft);

  const supabase = await createClient();
  await supabase.from("raw_interaction_logs").insert({
    session_id: sessionId ?? null,
    query,
    answer,
  });

  return NextResponse.json({ answer, systemPromptUsed: systemPrompt.length });
}
