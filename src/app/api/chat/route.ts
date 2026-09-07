import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildSystemPrompt, sanitizeTerms, normalizeQuery } from "@/constants/terms";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";

type ChatRequest = {
  query: string;
  sessionId?: string;
};

// ナレッジベースのエントリ型
type KnowledgeEntry = {
  question: string;
  answer: string;
  tags: string[];
  score?: number;
};

/**
 * docs/line_qa_database.md を解析してナレッジエントリ配列を返す
 */
function loadKnowledgeBase(): KnowledgeEntry[] {
  try {
    const dbPath = path.join(process.cwd(), "docs", "line_qa_database.md");
    const content = fs.readFileSync(dbPath, "utf-8");
    const entries: KnowledgeEntry[] = [];

    // ## Q: で始まるセクションを分割
    const sections = content.split(/^## Q:/m).slice(1);

    for (const section of sections) {
      const lines = section.trim().split("\n");
      const question = lines[0]?.trim() ?? "";

      // タグ抽出
      const tagLine = lines.find((l) => l.includes("#"));
      const tags = tagLine
        ? (tagLine.match(/#[^\s#]+/g) ?? []).map((t) => t.slice(1))
        : [];

      // **回答:** 以降のテキストを抽出
      const answerStart = section.indexOf("**回答:**");
      const answerEnd = section.indexOf("\n**参照リソース:**");
      let answer = "";
      if (answerStart !== -1) {
        const rawAnswer =
          answerEnd !== -1
            ? section.slice(answerStart + 6, answerEnd)
            : section.slice(answerStart + 6);
        answer = rawAnswer.trim();
      }

      if (question && answer) {
        entries.push({ question, answer, tags });
      }
    }

    return entries;
  } catch {
    return [];
  }
}

// 検索用キーワードリスト（日本語は単語単位でマッチング）
const SEARCH_KEYWORDS = [
  "プラン", "スタンダード", "スタートアップ", "ウリアゲ", "カクヤク",
  "比較", "違い", "報酬", "請求", "請求書", "入金", "月末", "翌月",
  "助成金", "補助金", "人材開発", "リスキリング",
  "税理士", "士業", "会計", "経理",
  "公式LINE", "LINE", "連絡", "問い合わせ",
  "紹介", "送客", "代理店", "見込み",
  "研修", "カリキュラム", "デモ", "資料",
  "スケジュール", "期日", "締め",
  "フロー", "手順", "方法",
  "提案", "アプローチ", "営業",
  "費用", "金額", "価格", "コスト",
  "節税", "損金", "経費",
  "グループ", "招待", "担当者", "企業名",
  "AIX", "AI研修", "Manus", "Genspark",
];

/**
 * キーワードリストベースのスコアリング（日本語対応版）
 * - 定義済みキーワードリストでマッチング
 * - タグマッチにボーナス
 * - 正規化クエリを使用
 */
function scoreEntry(entry: KnowledgeEntry, normalizedQuery: string, originalQuery: string): number {
  const qLower = normalizedQuery.toLowerCase();
  const origLower = originalQuery.toLowerCase();
  const questionLower = entry.question.toLowerCase();
  const answerLower = entry.answer.toLowerCase();
  const tagStr = entry.tags.join(" ").toLowerCase();

  let score = 0;

  // 質問文との完全一致ボーナス
  if (questionLower.includes(origLower)) score += 0.5;
  if (questionLower.includes(qLower)) score += 0.3;

  // キーワードリストベースのマッチング
  for (const kw of SEARCH_KEYWORDS) {
    const kwLower = kw.toLowerCase();
    const queryHasKw = origLower.includes(kwLower) || qLower.includes(kwLower);
    if (!queryHasKw) continue;

    if (questionLower.includes(kwLower)) score += 0.15;
    if (answerLower.includes(kwLower)) score += 0.06;
    if (tagStr.includes(kwLower)) score += 0.12;
  }

  // プラン比較系ボーナス
  const planKeywords = ["プラン", "比較", "違い", "スタンダード", "スタートアップ", "ウリアゲ", "カクヤク"];
  const hasPlanQuery = planKeywords.some((k) => origLower.includes(k.toLowerCase()));
  const hasPlanEntry = planKeywords.some(
    (k) => questionLower.includes(k.toLowerCase()) || tagStr.includes(k.toLowerCase())
  );
  if (hasPlanQuery && hasPlanEntry) score += 0.25;

  // 請求フロー系ボーナス
  const billingKeywords = ["請求", "入金", "月末", "翌月", "フロー"];
  const hasBillingQuery = billingKeywords.some((k) => origLower.includes(k.toLowerCase()));
  const hasBillingEntry = billingKeywords.some(
    (k) => questionLower.includes(k.toLowerCase()) || tagStr.includes(k.toLowerCase())
  );
  if (hasBillingQuery && hasBillingEntry) score += 0.25;

  return Math.min(score, 1.0);
}

/**
 * ナレッジベースから上位N件を検索して返す
 */
function searchKnowledge(query: string, topN = 5): { entries: KnowledgeEntry[]; maxScore: number } {
  const entries = loadKnowledgeBase();
  const normalized = normalizeQuery(query);

  const scored = entries.map((e) => ({
    ...e,
    score: scoreEntry(e, normalized, query),
  }));

  scored.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  const top = scored.slice(0, topN).filter((e) => (e.score ?? 0) > 0.05);
  const maxScore = top[0]?.score ?? 0;

  return { entries: top, maxScore };
}

export async function POST(req: Request) {
  const { query, sessionId } = (await req.json()) as ChatRequest;

  if (!query?.trim()) {
    return NextResponse.json({ error: "query is required" }, { status: 400 });
  }

  const systemPrompt = buildSystemPrompt();
  const { entries: topEntries, maxScore } = searchKnowledge(query);

  let answer: string;
  let confidence = maxScore;

  // --- 3段階フォールバック ---
  // Stage 1: 高信頼度 (≥0.45) → ナレッジ直接回答
  if (maxScore >= 0.45 && topEntries.length > 0) {
    const best = topEntries[0];
    answer = sanitizeTerms(best.answer);
    confidence = maxScore;
  }
  // Stage 2: LLM生成（OpenAI API利用可能な場合）
  else if (process.env.OPENAI_API_KEY) {
    try {
      const { OpenAI } = await import("openai");
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
        baseURL: process.env.OPENAI_BASE_URL,
      });

      // コンテキストとして上位エントリを渡す
      const contextText =
        topEntries.length > 0
          ? topEntries
              .map(
                (e, i) =>
                  `【参考${i + 1}】Q: ${e.question}\nA: ${e.answer}`
              )
              .join("\n\n")
          : "（関連するナレッジが見つかりませんでした）";

      const completion = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `以下のナレッジベースの情報を参考に、代理店様の質問に回答してください。

【ナレッジベース（参考情報）】
${contextText}

【代理店様の質問】
${query}

【回答の注意事項】
- ナレッジベースの数値・期日・手順（月末締め・翌月5日・指定アドレスへの請求書送付・月末入金など）は省略せず正確に含めてください。
- プランに関する質問（スタンダード・スタートアップ・ウリアゲ・カクヤク）には、必ず他のプランとの比較も提示してください。
- 回答の最後に必ず「事業パートナー公式LINE」への誘導と「企業名・担当者名のお知らせ」「グループLINEへのご招待」の案内を含めてください。
- 「ミニマム」「佐藤個人LINE」「佐藤のLINE」という語は絶対に使用しないでください。`,
          },
        ],
        temperature: 0.3,
        max_tokens: 800,
      });

      const raw = completion.choices[0]?.message?.content ?? "";
      answer = sanitizeTerms(raw);
      confidence = Math.max(maxScore, 0.6);
    } catch {
      // Stage 3: エスカレーション
      answer = sanitizeTerms(
        `ご質問ありがとうございます。「${query}」については、より詳細な情報が必要なため、直接ご確認いただくことをお勧めします。\n\n詳細のご相談は **事業パートナー公式LINE** よりご連絡ください。その際、**企業名・担当者名** をお知らせいただけますと、運営側でグループLINEを作成し、担当者様をご招待いたします。`
      );
      confidence = 0.1;
    }
  }
  // Stage 3: エスカレーション（API未設定）
  else {
    answer = sanitizeTerms(
      `ご質問ありがとうございます。「${query}」については、詳細のご相談を **事業パートナー公式LINE** にてお受けしております。\n\nその際、**企業名・担当者名** をお知らせいただけますと、運営側でグループLINEを作成し、担当者様をご招待いたします。`
    );
    confidence = 0.1;
  }

  // Supabaseにログを記録
  try {
    const supabase = await createClient();
    await supabase.from("raw_interaction_logs").insert({
      session_id: sessionId ?? null,
      query,
      answer,
    });
  } catch {
    // ログ記録失敗は無視（回答は返す）
  }

  return NextResponse.json({ answer, confidence });
}
