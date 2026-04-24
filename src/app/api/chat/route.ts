import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildSystemPrompt, sanitizeTerms } from "@/constants/terms";
import {
  CONFIDENCE_THRESHOLD,
  KNOWLEDGE,
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

/**
 * ナレッジベース全体をコンテキストとして整形する（LLM用）
 * トークン節約のため上位N件のみ渡す
 */
function buildKnowledgeContext(query: string, topN = 5): string {
  const qLower = query.toLowerCase();
  // スコアリングして上位N件を取得
  const scored = KNOWLEDGE.map((entry) => {
    let score = 0;
    for (const tag of entry.tags) {
      if (qLower.includes(tag.toLowerCase())) score += 2;
    }
    const combined = (entry.question + " " + entry.answer).toLowerCase();
    const words = qLower.split(/\s+/).filter((w) => w.length > 1);
    for (const w of words) {
      if (combined.includes(w)) score += 1;
    }
    return { entry, score };
  });

  const top = scored
    .sort((a, b) => b.score - a.score)
    .slice(0, topN)
    .filter((s) => s.score > 0);

  if (top.length === 0) {
    // スコア0でも全件から上位N件を返す（フォールバック）
    return KNOWLEDGE.slice(0, topN)
      .map((e) => `Q: ${e.question}\nA: ${e.answer}`)
      .join("\n\n---\n\n");
  }

  return top
    .map((s) => `Q: ${s.entry.question}\nA: ${s.entry.answer}`)
    .join("\n\n---\n\n");
}

/**
 * OpenAI API を使って LLM 回答を生成する
 * OPENAI_API_KEY が設定されていない場合は null を返す
 */
async function generateLLMAnswer(
  query: string,
  systemPrompt: string,
  knowledgeContext: string
): Promise<string | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const baseUrl = process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1";
  const model = process.env.OPENAI_MODEL ?? "gpt-4.1-mini";

  const messages = [
    {
      role: "system",
      content: `${systemPrompt}

# 参照ナレッジベース（最重要）
以下は実際の代理店さんからの質問と運営側の公式回答です。
回答はこのナレッジを最優先で参照し、忠実に反映してください。
ナレッジに記載のない内容は推測で答えず、担当者へのエスカレーションを提案してください。

${knowledgeContext}`,
    },
    {
      role: "user",
      content: query,
    },
  ];

  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: 800,
        temperature: 0.3,
      }),
    });

    if (!res.ok) {
      console.error("OpenAI API error:", res.status, await res.text());
      return null;
    }

    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    return data.choices?.[0]?.message?.content ?? null;
  } catch (err) {
    console.error("OpenAI fetch error:", err);
    return null;
  }
}

export async function POST(req: Request) {
  const { query, sessionId, menuType } = (await req.json()) as ChatRequest;

  if (!query?.trim()) {
    return NextResponse.json({ error: "query is required" }, { status: 400 });
  }

  const systemPrompt = buildSystemPrompt(
    menuType ? `ユーザー流入メニュー: ${menuType}` : undefined
  );

  // まず n-gram で高速マッチを試みる
  const hit = searchKnowledge(query);

  let answer: string;
  let references: KnowledgeReference[] = [];
  let matched = false;
  let confidence = 0;
  let shouldEscalate = false;

  if (hit && hit.confidence >= CONFIDENCE_THRESHOLD) {
    // === 高信頼度マッチ: ナレッジベースの回答をそのまま使用 ===
    matched = true;
    confidence = hit.confidence;
    answer = hit.entry.answer;
    references = hit.entry.references;
  } else {
    // === 低信頼度: LLM にナレッジコンテキストを渡して回答生成を試みる ===
    confidence = hit?.confidence ?? 0;

    const knowledgeContext = buildKnowledgeContext(query);
    const llmAnswer = await generateLLMAnswer(query, systemPrompt, knowledgeContext);

    if (llmAnswer) {
      // LLM が回答を生成できた場合
      matched = true;
      answer = llmAnswer;
      // LLM 回答でも参照元として最近傍エントリの参照を付与
      references = hit?.entry.references ?? [];
      // LLM 回答でも確信度が低い場合はエスカレーションオプションを表示
      shouldEscalate = confidence < 0.1;
    } else {
      // LLM も使えない場合のフォールバック
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
  }

  // 禁止用語は最終出力で必ず置換
  const safeAnswer = sanitizeTerms(answer);

  const payload: ChatResponse = {
    answer: safeAnswer,
    references,
    matched,
    confidence,
    shouldEscalate,
  };

  // Supabase へのログ保存（best-effort）
  try {
    const supabase = await createClient();
    await supabase.from("raw_interaction_logs").insert({
      session_id: sessionId ?? null,
      query,
      answer: safeAnswer,
    });
  } catch {
    // ログ保存の失敗はユーザー応答をブロックしない
  }

  return NextResponse.json({
    ...payload,
    systemPromptUsed: systemPrompt.length,
  });
}
