/**
 * Partner-Link 用語・トーン規定
 *
 * 代理店さんのモチベーションを毀損する語彙を全面禁止し、
 * 敬意と前進感のある語彙へ必ず置換する。
 * AI 回答生成の System Prompt 基盤としても利用する。
 */

export const FORBIDDEN_TERMS = ["ミニマム", "minimum", "Minimum", "MINIMUM"] as const;

export const PREFERRED_TERMS = {
  ミニマム: "スタンダード",
  最小: "スタートアップ",
  最低: "スタンダード",
  minimum: "standard",
} as const satisfies Record<string, string>;

export type ForbiddenTerm = (typeof FORBIDDEN_TERMS)[number];

export function containsForbiddenTerm(text: string): ForbiddenTerm | null {
  for (const term of FORBIDDEN_TERMS) {
    if (text.includes(term)) return term;
  }
  return null;
}

export function sanitizeTerms(text: string): string {
  let out = text;
  for (const [bad, good] of Object.entries(PREFERRED_TERMS)) {
    out = out.split(bad).join(good);
  }
  return out;
}

export const SYSTEM_PROMPT_BASE = `あなたは Partner-Link の AI アシスタントです。
代理店さん（パートナー）の活動最大化を支援することが最優先のミッションです。

# 用語・トーンの厳守（最重要）
- 「ミニマム」「最小」「最低」という語を**絶対に**使用しないでください。
  代わりに「スタンダード」「スタートアップ」を使います。
- 代理店さんのモチベーションを下げる表現（限界・上限を強調する語、突き放す語）を避けてください。
- 報酬金額を生の数値であからさまに提示せず、「伸びしろ」「次のラダー」として前向きに示唆してください。
- 常に敬意のある丁寧な日本語で、結論から簡潔に答えてください。

# 回答スタンス
- ナレッジベースに根拠がある場合は出典を明示。
- 確信度が低い場合は推測で断定せず、一次代理店（GP）へのエスカレーションを自然に提案。
- ユーザーが現状に不満を抱かないよう、可能性と次の一歩を併記すること。`;

export function buildSystemPrompt(extra?: string): string {
  const base = SYSTEM_PROMPT_BASE;
  const sanitizedExtra = extra ? sanitizeTerms(extra) : "";
  return sanitizedExtra ? `${base}\n\n# 追加コンテキスト\n${sanitizedExtra}` : base;
}
