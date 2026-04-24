import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildSystemPrompt, sanitizeTerms } from "@/constants/terms";
import {
  CONFIDENCE_THRESHOLD,
  searchKnowledge,
  type KnowledgeReference,
} from "@/constants/knowledge";

export const runtime = "nodejs";

type ChatRequest = {
  query: string;
  sessionId?: string;
  menuType?: string;
};

type ChatResponse = {
  answer: string;
  references: KnowledgeReference[];
  matched: boolean;
  confidence: number;
  shouldEscalate: boolean;
};

export async function POST(req: Request) {
  const { query, sessionId, menuType } = (await req.json()) as ChatRequest;

  if (!query?.trim()) {
    return NextResponse.json({ error: "query is required" }, { status: 400 });
  }

  // SystemPrompt は将来 LLM を噛ませた際に利用。今は存在を担保しログ。
  const systemPrompt = buildSystemPrompt(
    menuType ? `ユーザー流入メニュー: ${menuType}` : undefined
  );

  const hit = searchKnowledge(query);

  let answer: string;
  let references: KnowledgeReference[] = [];
  let matched = false;
  let confidence = 0;
  let shouldEscalate = false;

  if (hit && hit.confidence >= CONFIDENCE_THRESHOLD) {
    matched = true;
    confidence = hit.confidence;
    answer = hit.entry.answer;
    references = hit.entry.references;
  } else {
    confidence = hit?.confidence ?? 0;
    shouldEscalate = true;
    const suggestion = hit
      ? `もしかすると「${hit.entry.question}」に関連するご質問でしょうか。`
      : "";
    answer = [
      "ご質問ありがとうございます。現在のナレッジでは確信度高くお答えしづらい内容でした。",
      suggestion,
      "より的確にお応えするため、一次代理店（GP）担当へお繋ぎすることも可能です。下の『担当者に繋ぐ』ボタンからお気軽にご依頼ください。",
    ]
      .filter(Boolean)
      .join("\n\n");
  }

  // 禁止用語は最終出力で必ず置換（要件: terms.ts のサニタイズを最終段階で適用）
  const safeAnswer = sanitizeTerms(answer);

  const payload: ChatResponse = {
    answer: safeAnswer,
    references,
    matched,
    confidence,
    shouldEscalate,
  };

  try {
    const supabase = await createClient();
    await supabase.from("raw_interaction_logs").insert({
      session_id: sessionId ?? null,
      query,
      answer: safeAnswer,
    });
  } catch {
    // ログ保存の失敗はユーザー応答をブロックしない（自律改善ループは best-effort）
  }

  return NextResponse.json({
    ...payload,
    systemPromptUsed: systemPrompt.length,
  });
}
