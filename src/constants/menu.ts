/**
 * LINE リッチメニュー 6 流入に対応した初期表示コンフィグ。
 * URL クエリ `?type=scheme` のように渡されることを想定。
 */

export type MenuType =
  | "scheme"
  | "fee"
  | "materials"
  | "referral"
  | "tools"
  | "support";

export type MenuConfig = {
  label: string;
  greeting: string;
  quickReplies: string[];
};

export const MENU_CONFIG: Record<MenuType, MenuConfig> = {
  scheme: {
    label: "スキーム・助成金",
    greeting:
      "損金スキームや助成金（人材開発支援助成金「事業展開等リスキリング支援コース」）に関するご質問を承ります。気になるトピックをお選びください。",
    quickReplies: [
      "3月決算企業で前期損金として計上できますか？",
      "助成金の正式名称を教えてください",
      "雇用保険未加入の法人は対象になりますか？",
      "個人でも受講できますか？",
    ],
  },
  fee: {
    label: "料金・報酬",
    greeting:
      "研修費用・お客様の実質負担・代理店報酬に関するご質問を承ります。気になるトピックをお選びください。",
    quickReplies: [
      "クライアントの一時負担はいくらですか？",
      "税抜40万円／税込44万円の認識で合ってますか？",
      "代理店報酬の発生タイミングと請求フローは？",
      "紹介報酬の請求書はどこに送ればよいですか？",
    ],
  },
  materials: {
    label: "営業資料・デモ",
    greeting:
      "営業資料・Canva 紹介資料・デモ動画についてご案内いたします。お客様提案に使える素材をお選びください。",
    quickReplies: [
      "お客様にそのままシェアしてよい資料は？",
      "カリキュラムやデモ動画を見たい",
      "税理士・士業向けのプレゼン資料はありますか？",
      "ウリアゲAIX／カクヤクAIX の紹介資料リンクをください",
    ],
  },
  referral: {
    label: "送客・紹介フロー",
    greeting:
      "見込み顧客のお繋ぎ方、紹介制度、社内／社外へのアプローチ方法を承ります。",
    quickReplies: [
      "見込み客をどうお繋ぎすればよいですか？",
      "UBM 代理店以外の紹介も可能ですか？",
      "税理士法人にアポを取る際のコツは？",
      "社内の経理部門に提案したい",
    ],
  },
  tools: {
    label: "AIツール活用",
    greeting:
      "Manus・Genspark・必殺仕訳人など、商談を加速する AI ツール活用をご支援します。",
    quickReplies: [
      "Manus のデータ利用方針を教えて",
      "Genspark で提案の質を上げるコツは？",
      "必殺仕訳人のリンクをください",
      "不動産会社100名規模にどう提案する？",
    ],
  },
  support: {
    label: "運用サポート",
    greeting:
      "セミナー予約・アーカイブ・代理店窓口など、運用に関するご質問を承ります。",
    quickReplies: [
      "セミナーの再予約ができません",
      "Zoom セミナーのアーカイブはどこで見られますか？",
      "代理店の問い合わせ窓口を教えてください",
      "助成金制度がなくなった場合のリスクは？",
    ],
  },
};

export const DEFAULT_MENU: MenuConfig = {
  label: "Partner-Link",
  greeting:
    "Partner-Link へようこそ。代理店さんの活動を加速する AI アシスタントです。ご質問をそのまま入力いただくか、下のサジェストからお選びください。",
  quickReplies: [
    "助成金の正式名称は？",
    "クライアントの実質負担額は？",
    "お客様に共有できる資料は？",
    "見込み客のお繋ぎ方を教えて",
    "税理士向けの提案資料はありますか？",
    "代理店報酬の請求フローを教えて",
  ],
};

export function resolveMenu(type: string | null | undefined): MenuConfig {
  if (!type) return DEFAULT_MENU;
  const key = type as MenuType;
  return MENU_CONFIG[key] ?? DEFAULT_MENU;
}
