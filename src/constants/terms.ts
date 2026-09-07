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

/**
 * キーワード同義語マップ
 * ナレッジ検索時のマッチング精度向上のため、
 * ユーザー入力のキーワードを正規化する
 */
export const KEYWORD_SYNONYMS: Record<string, string[]> = {
  ウリアゲ: ["売上", "ウリアゲAIX", "うりあげ", "売上AIX", "攻め", "営業", "集客"],
  カクヤク: ["節税", "カクヤクAIX", "かくやく", "節税AIX", "守り", "コスト削減", "経理", "会計"],
  スタンダード: ["スタンダードプラン", "standard", "標準", "通常プラン"],
  スタートアップ: ["スタートアッププラン", "startup", "お試し", "小規模", "入門"],
  助成金: ["補助金", "人材開発支援助成金", "リスキリング", "助成"],
  報酬: ["紹介料", "インセンティブ", "代理店報酬", "紹介報酬", "手数料"],
  請求: ["請求書", "請求フロー", "入金", "支払い", "月末"],
  公式LINE: ["LINE", "公式ライン", "事業パートナーLINE", "連絡先", "問い合わせ"],
  プラン: ["コース", "プログラム", "メニュー", "サービス"],
  税理士: ["士業", "会計士", "税務", "会計事務所"],
};

/**
 * ユーザー入力を正規化してナレッジ検索精度を向上させる
 */
export function normalizeQuery(query: string): string {
  let normalized = sanitizeTerms(query);
  for (const [canonical, synonyms] of Object.entries(KEYWORD_SYNONYMS)) {
    for (const syn of synonyms) {
      if (normalized.includes(syn) && !normalized.includes(canonical)) {
        normalized = normalized + ` ${canonical}`;
      }
    }
  }
  return normalized;
}

export const SYSTEM_PROMPT_BASE = `あなたは Partner-Link の AI アシスタントです。
UBM｜AI財務戦略サポートの事業パートナー（代理店）様の活動最大化を支援することが最優先のミッションです。

# 用語・トーンの厳守（最重要）
- 「ミニマム」「最小」「最低」という語を**絶対に**使用しないでください。
  代わりに「スタンダード」「スタートアップ」を使います。
- 代理店さんのモチベーションを下げる表現（限界・上限を強調する語、突き放す語）を避けてください。
- 報酬金額を生の数値であからさまに提示せず、「伸びしろ」「次のラダー」として前向きに示唆してください。
- 常に敬意のある丁寧な日本語で、結論から簡潔に答えてください。

# プラン提案の方針（重要）
- 「スタンダードプランでご案内します」「スタートアッププランでご案内します」という質問には、
  必ず**他のプランとの比較**も提示してください。
  単一プランのみの案内は、お客様の選択肢を狭めるため推奨しません。
- ウリアゲAIX（攻め・売上最大化）とカクヤクAIX（守り・コスト削減）の違いを
  企業の課題に合わせて説明できるよう、常に両プランの特徴を把握してください。
- プラン詳細・報酬制度の統合資料は「AI研修_代理店報酬制度.pdf」です。

# 数値・期日・手順の厳守（重要）
- ナレッジベースに記載された数値（金額・割合・人数）、期日（月末締め・翌月5日など）、
  手順（請求フロー・送客フローなど）は**省略せず正確に**回答してください。
- 請求フロー: 月末締め・翌月5日までに指定アドレスへ請求書を送付・月末入金。

# コンタクトフロー（必須）
- どんな質問に対しても、回答の**締めくくりに必ず**以下の案内を含めてください：
  「詳細のご相談は **事業パートナー公式LINE** よりご連絡ください。
   その際、**企業名・担当者名** をお知らせいただけますと、
   運営側でグループLINEを作成し、担当者様をご招待いたします。」
- 「佐藤個人LINE」「佐藤のLINE」への誘導は**絶対に**行わないでください。
  すべての問い合わせ・紹介は「事業パートナー公式LINE」に統一されています。

# 回答スタンス
- ナレッジベースに根拠がある場合は出典を明示。
- 確信度が低い場合は推測で断定せず、事業パートナー公式LINEへのエスカレーションを自然に提案。
- ユーザーが現状に不満を抱かないよう、可能性と次の一歩を併記すること。
- 回答は簡潔にまとめ、最後に必ず公式LINEへの誘導文を添えること。`;

export function buildSystemPrompt(extra?: string): string {
  const base = SYSTEM_PROMPT_BASE;
  const sanitizedExtra = extra ? sanitizeTerms(extra) : "";
  return sanitizedExtra ? `${base}\n\n# 追加コンテキスト\n${sanitizedExtra}` : base;
}
