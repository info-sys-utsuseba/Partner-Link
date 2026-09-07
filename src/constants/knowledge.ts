/**
 * Partner-Link ナレッジベース
 *
 * `docs/line_qa_database.md` から抽出した Q&A を TS 定数化。
 * 実運用ではここを Supabase / pgvector に移行する想定だが、
 * MVP では静的データ + 文字列 n-gram スコアリングで高速に回答する。
 */

export type ReferenceKind = "pdf" | "video" | "link" | "email";

export type KnowledgeReference = {
  label: string;
  url?: string;
  kind: ReferenceKind;
};

export type KnowledgeEntry = {
  id: string;
  question: string;
  answer: string;
  tags: string[];
  references: KnowledgeReference[];
};

export const KNOWLEDGE: KnowledgeEntry[] = [
  {
    id: "k-settlement-timing",
    question:
      "3月決算企業で決算直前に申し込んだ場合、前期の損金として計上できますか？",
    answer:
      "結論、間に合わせることができます。現在は e-learning が使えますので、ご契約いただいて e-learning を 10 時間分視聴していただけましたら、2 日ほどで開始可能です。ただし 9 月 1 日以降は e-learning 利用時の助成金割合が半分になるため、それ以降は通常のグループコンサルの提供となります。",
    tags: ["損金スキーム", "助成金", "決算対応", "e-learning"],
    references: [
      { label: "AI研修損金スキーム.pdf", kind: "pdf" },
      { label: "AI研修_代理店報酬制度.pdf", kind: "pdf" },
    ],
  },
  {
    id: "k-subsidy-name",
    question: "本スキームで活用できる助成金の正式名称を教えてください。",
    answer:
      "人材開発支援助成金の「事業展開等リスキリング支援コース」でございます。制度概要は厚生労働省の公式パンフレットをご参照ください。",
    tags: ["助成金", "スキーム", "商工会議所"],
    references: [
      {
        label: "厚生労働省 人材開発支援助成金パンフレット",
        url: "https://www.mhlw.go.jp/content/11800000/001514283.pdf",
        kind: "link",
      },
    ],
  },
  {
    id: "k-client-fee",
    question: "研修実施時、クライアント様の一時的な負担額はどれくらいになりますか？",
    answer:
      "一時金で一人当たり 400,000 円（税抜／税込 440,000 円）をご負担いただきます。その後、約半年後に 75% 補助されるため 300,000 円が国よりバックされ、実質手出しは税込で約 140,000 円。ご案内上は「手出し 100,000 円」と整理しており、節税効果を加味すれば実質負担 0 円という説明も可能です。",
    tags: ["料金", "助成金", "クライアント負担", "税込税抜"],
    references: [
      { label: "AI研修損金スキーム.pdf", kind: "pdf" },
      { label: "AI研修代理店報酬.mp4", kind: "video" },
    ],
  },
  {
    id: "k-share-materials",
    question:
      "お送りいただいた AI 研修の資料を、企業さまにそのままシェアしても問題ありませんか？",
    answer:
      "資料の共有は問題ございません。どうぞそのままご活用くださいませ。（※研修動画など一部の社内限定コンテンツはご共有前にご確認ください）",
    tags: ["資料共有", "営業ツール", "コンプライアンス"],
    references: [
      { label: "AI研修損金スキーム.pdf", kind: "pdf" },
      { label: "AI研修_代理店報酬制度.pdf", kind: "pdf" },
    ],
  },
  {
    id: "k-lead-route",
    question:
      "代理店から獲得した見込み客を運営側におつなぎする際の導線はどれが最適ですか？",
    answer:
      "フロントセミナーは公式LINEからご案内しておりますので、個別のお客様をお繋ぎいただく場合は佐藤の LINE、またはメール（h.sato@utsuseba.jp）へ直接ご紹介ください。まずは佐藤がアテンドいたします。事業パートナー様用ポータル（Notion）に全体情報がまとまっております。",
    tags: ["送客フロー", "代理店運用", "導線", "紹介"],
    references: [
      {
        label: "【AIX事業】事業パートナー様用ポータル (Notion)",
        url: "https://woozy-manatee-004.notion.site/UBM-AI-37063c185e33467a9aa883c69fab4d8f",
        kind: "link",
      },
      {
        label: "佐藤 LINE",
        url: "https://line.me/ti/p/PlBWmgqcSH",
        kind: "link",
      },
      { label: "h.sato@utsuseba.jp", kind: "email" },
    ],
  },
  {
    id: "k-service-canva",
    question: "サービス紹介資料をお客様に共有しても大丈夫でしょうか？",
    answer:
      "もちろんでございます。下記の Canva 紹介資料は代理店様・お客様問わず積極的にご活用いただけます。",
    tags: ["資料共有", "営業ツール", "Canva", "紹介資料"],
    references: [
      {
        label: "【攻】ウリアゲAIX Canva 紹介資料",
        url: "https://www.canva.com/design/DAG-BdFSYXo/edFYwmRXoJg4VzyKbYyWlw/view",
        kind: "link",
      },
      {
        label: "【守】カクヤクAIX Canva 紹介資料",
        url: "https://www.canva.com/design/DAG_br0F0Vg/D4f-CVwMz3qYjtP0CBK-HA/view",
        kind: "link",
      },
    ],
  },
  {
    id: "k-referral-outside",
    question: "紹介制度は UBM の代理店以外の方でも利用できますか？",
    answer:
      "問題ございません。代理店様にて割合を調整いただければ運用可能です。つまり、代理店様が受け取った紹介報酬の中からご自身で配分を決めていただく形でご活用いただけます。",
    tags: ["紹介制度", "代理店報酬", "スキーム"],
    references: [],
  },
  {
    id: "k-individual-enrollment",
    question:
      "AIX の研修は個人でも受講できますか？最小受講人数や助成金の条件は？",
    answer:
      "中小企業様向けにうまく調整し、結論 1 名様からでも受講いただける方向で進めております。助成金は雇用保険加入のうえ申請、という流れで合っております。1 名受講の場合でも費用 40 万円・雇用助成金利用で実質 10 万円という金額感は変わりません。",
    tags: ["受講条件", "助成金", "個人受講", "スタートアップ人数"],
    references: [],
  },
  {
    id: "k-manus-data",
    question: "Manus に ChatGPT や Genspark のようなデータコントロール設定はありますか？",
    answer:
      "現時点では、Manus に ChatGPT や Genspark のような「データコントロール設定」は設けられておりません。ただし公式ヘルプでは、会話内容がそのまま AI 学習に使われることはなく、個人を特定できない形に匿名化された集計データのみがサービス改善に利用される、と明記されております。",
    tags: ["Manus", "データプライバシー", "ツール仕様"],
    references: [
      {
        label: "Manus 公式ヘルプ（データ利用方針）",
        url: "https://help.manus.im/en/articles/11711822-will-manus-use-user-data-for-model-training-purposes",
        kind: "link",
      },
    ],
  },
  {
    id: "k-tax-inclusive",
    question:
      "研修費用「1人当たり40万円」の税表示について、支払い金額は税込44万円という認識で合っていますか？",
    answer:
      "ご認識の通りでございます。税抜 40 万円／税込 44 万円でご案内をお願いいたします。",
    tags: ["料金", "税込税抜", "見積"],
    references: [],
  },
  {
    id: "k-curriculum-demo",
    question:
      "実際の研修スケジュールやカリキュラム、デモ動画など、お客様がイメージできる資料はありますか？",
    answer:
      "下記の Canva サービス紹介資料にダイジェスト・カリキュラム・デモ動画がすべて掲載されております。こちらでお客様にイメージいただけるかと存じます。",
    tags: ["カリキュラム", "営業資料", "デモ動画"],
    references: [
      {
        label: "ウリアゲAIX サービス紹介資料 (Canva)",
        url: "https://www.canva.com/design/DAG-BdFSYXo/edFYwmRXoJg4VzyKbYyWlw/view",
        kind: "link",
      },
      {
        label: "カクヤクAIX サービス紹介資料 (Canva)",
        url: "https://www.canva.com/design/DAG_br0F0Vg/D4f-CVwMz3qYjtP0CBK-HA/view",
        kind: "link",
      },
    ],
  },
  {
    id: "k-tax-pro-slides",
    question: "税理士・士業向けのプレゼン資料はありますか？",
    answer:
      "税理士向けはかなり実績がございます。既存カリキュラム「税理士AI大学」の紹介資料と、税理士向け販促チラシ（表裏 3 パターン×組み合わせ自由）をご活用ください。",
    tags: ["税理士", "士業", "提案資料"],
    references: [
      {
        label: "税理士AI大学 紹介資料",
        url: "https://drive.google.com/file/d/10h-rAV4mUwWzEn6syEeboBVBfs7rEFWT/view",
        kind: "link",
      },
      {
        label: "税理士向けカクヤクAIXご案内チラシ_表裏3パターン.pdf",
        kind: "pdf",
      },
    ],
  },
  {
    id: "k-shiwake",
    question:
      "会計事務所向け提案資料にある「必殺仕訳人」のプロンプトやツールを使わせていただけますか？",
    answer:
      "もちろん共有いたします。ツール本体と使い方解説動画のリンクを下記にご案内いたします。税理士様へのご提案時に非常に強い武器になります。",
    tags: ["必殺仕訳人", "税理士", "AIツール"],
    references: [
      {
        label: "必殺仕訳人（税理士向け AI 仕訳自動化ツール）",
        url: "https://ai-shiwakenin.com/clients",
        kind: "link",
      },
      {
        label: "必殺仕訳人 使い方解説動画 (Loom)",
        url: "https://www.loom.com/share/a9868065cbf74d37bfdd3c771d180dd4",
        kind: "video",
      },
    ],
  },
  {
    id: "k-tax-apo",
    question:
      "代理店から税理士法人へアポを取る際、有効な資料やアプローチ方法を教えてください。",
    answer:
      "税理士様にご好評いただいている「必殺仕訳人」をご紹介いただくと、サービス内容とメリットを明確に伝えられます。合わせて税理士AI大学の提案 PDF と解説動画をご活用ください。",
    tags: ["税理士", "アポイント", "営業ノウハウ"],
    references: [
      {
        label: "動画での解説 (NoLang)",
        url: "https://no-lang.com/video/6b2d4c1c-ea40-4bd9-a1e1-841a15a20dd4",
        kind: "video",
      },
      {
        label: "必殺仕訳人",
        url: "https://ai-shiwakenin.com",
        kind: "link",
      },
      {
        label: "使い方解説動画 (YouTube)",
        url: "https://youtu.be/UfFaT06oPxw",
        kind: "video",
      },
      { label: "税理士AI大学.pdf", kind: "pdf" },
    ],
  },
  {
    id: "k-agent-reward-flow",
    question: "代理店報酬の発生タイミングと請求フローを教えてください。",
    answer:
      "入金が確認できた時点で報酬発生条件達成となります。請求は「月末締め・翌月5日までに指定アドレスへ請求書をご送付いただき、月末にお振込み」となります。助成金対象外（雇用保険非加入など）の場合は通常契約となり、費用は 1 名 40 万円×人数分をクライアント様にて先行ご負担いただきます。詳細は事業パートナー様用ポータルをご参照ください。",
    tags: ["代理店報酬", "請求", "入金", "スキーム"],
    references: [
      {
        label: "【AIX事業】事業パートナー様用ポータル (Notion)",
        url: "https://woozy-manatee-004.notion.site/AIX-37063c185e33467a9aa883c69fab4d8f",
        kind: "link",
      },
    ],
  },
  {
    id: "k-manus-coupon",
    question: "Manus の紹介コードをいただくことは可能ですか？",
    answer:
      "大変申し訳ございません。紹介コードの配布は、皆様に平等な対応をさせていただくため、こちらからは行わない方針となっております。活用ノウハウのご共有は随時行っておりますので、お気軽にご相談ください。",
    tags: ["Manus", "紹介コード", "ツール"],
    references: [],
  },
  {
    id: "k-genspark-pitch",
    question:
      "Genspark を使った提案時に、お客様への提案の質を上げるためのポイントを教えてください。",
    answer:
      "ポイントは 2 点でございます。(1) 商談の文字起こしやメモなどの記録をしっかり残し、それを読み込ませることで精度の高い提案を作成する。(2) 顧客の状況（商談前／商談後など）に合わせてプロンプトを使い分ける。各プロンプトの詳細は下記ページにまとまっております。",
    tags: ["Genspark", "提案ノウハウ", "プロンプト"],
    references: [
      {
        label: "プロンプト一覧・詳細 (Notion)",
        url: "https://www.notion.so/3085e34a57ed8045bf58c7fadb4f3f50",
        kind: "link",
      },
    ],
  },
  {
    id: "k-realestate-pitch",
    question:
      "100 名規模の不動産会社に AI 人材育成を提案したい場合、どのように話を持っていくべきですか？",
    answer:
      "まず無料の AI 導入診断ツールで、年間コスト削減額や改善ポイントを数値化して上長様へのご提案材料としてください。営業にすぐ使える「ド根性道場」GPT ツールや、サービス紹介動画も合わせてご活用いただけます。",
    tags: ["提案方法", "不動産業界", "導入診断"],
    references: [
      {
        label: "AI 導入診断ツール（無料・最短10秒）",
        url: "https://aidiagnosis-wxpz59bh.manus.space/",
        kind: "link",
      },
      {
        label: "ド根性道場 GPT",
        url: "https://chatgpt.com/g/g-68b92f5baf808191b444df80e1e436cb",
        kind: "link",
      },
      {
        label: "サービス紹介動画 (YouTube)",
        url: "https://www.youtube.com/watch?v=BxZAFMwCbeE",
        kind: "video",
      },
    ],
  },
  {
    id: "k-inhouse-pitch",
    question:
      "社内の経理部門へ AI 研修を提案したい場合、プレゼン方法やお試し研修の有無を教えてください。",
    answer:
      "素晴らしいお声がけでございます。佐藤の LINE またはメール（h.sato@utsuseba.jp）へご紹介いただけましたら、まずは課題感をお伺いする無料コンサル（30 分〜1 時間）を代表が設けさせていただきます。「ウリアゲAIX」「カクヤクAIX」の Canva 資料が強い興味づけに役立ちます。",
    tags: ["経理部門", "社内提案", "お試し研修"],
    references: [
      {
        label: "佐藤 LINE",
        url: "https://line.me/ti/p/PlBWmgqcSH",
        kind: "link",
      },
      { label: "h.sato@utsuseba.jp", kind: "email" },
    ],
  },
  {
    id: "k-seminar-booking",
    question:
      "セミナー予約が「予約済み」と表示されて再予約ができません。どうすれば良いでしょうか？",
    answer:
      "キャンセル反映後のシステム上の遅延で「予約済み」と表示されるケースがございます。運営側で予約状況を確認のうえ、問題なく登録されていればリマインドメッセージ（Zoom リンク）を当日前日 21 時頃にお送りいたします。お急ぎの場合はお気軽に代理店サポート窓口までお問い合わせください。",
    tags: ["セミナー予約", "運用サポート"],
    references: [],
  },
  {
    id: "k-archive-onclass",
    question:
      "Zoom セミナーのアーカイブ動画はオンクラスに格納されますか？",
    answer:
      "アーカイブ動画のオンクラス格納運用は回ごとに異なるケースがございます。格納予定・リードタイムは佐藤より個別にご案内となりますので、該当回の開催日と併せて担当にご確認ください。",
    tags: ["アーカイブ動画", "オンクラス", "セミナー運営"],
    references: [],
  },
  {
    id: "k-contact-window",
    question:
      "代理店向けの各種窓口はどこに連絡すれば良いですか？（個別相談・紹介・質問）",
    answer:
      "個別の質問・ご相談・ご紹介は本チャット、または代理店ポータルページで案内している公式LINEが公式窓口でございます。今後 AIX 公式LINE へのご登録をお願いする可能性がございますので、ご案内の際はご登録ください。",
    tags: ["窓口", "問い合わせ", "公式LINE"],
    references: [
      {
        label: "AIX 公式LINE",
        url: "https://lin.ee/SA0Czvd",
        kind: "link",
      },
    ],
  },
  {
    id: "k-reward-invoice",
    question: "代理店紹介報酬の請求はどのように行えば良いでしょうか？",
    answer:
      "入金完了で紹介報酬発生となります。請求は「月末締め・翌月5日までに指定アドレスへ請求書をご送付いただき、月末にお振込み」となります。進捗や疑問点の窓口は AIX 公式LINE に移管しておりますので、ご登録のうえ「事業パートナー（UBM）／氏名」をお送りください。",
    tags: ["紹介報酬", "請求", "入金確認"],
    references: [
      {
        label: "AIX 公式LINE",
        url: "https://lin.ee/SA0Czvd",
        kind: "link",
      },
    ],
  },
  {
    id: "k-subsidy-risk",
    question:
      "助成金制度自体がなくなった場合、事業はどうなりますか？競合との差別化は？",
    answer:
      "本件は Zoom 面談で個別にご説明している重要論点でございます。助成金非依存シナリオ・競合比較の資料は現在ドキュメント化を進めており、個別の Zoom をご希望の場合は担当にお繋ぎいたしますので「担当者に繋ぐ」よりお問い合わせください。",
    tags: ["事業継続性", "差別化", "競合"],
    references: [],
  },
];

const particlePattern = /[はがをのにでとも、。・\s,.!?！？「」『』()（）\[\]]/g;

function normalize(text: string): string {
  return text.toLowerCase().replace(particlePattern, " ");
}

function bigrams(text: string): Set<string> {
  const t = normalize(text).replace(/\s+/g, "");
  const s = new Set<string>();
  for (let i = 0; i < t.length - 1; i += 1) {
    s.add(t.slice(i, i + 2));
  }
  return s;
}

export type SearchResult = {
  entry: KnowledgeEntry;
  score: number;
  confidence: number;
};

/**
 * 文字 2-gram のオーバーラップでスコアリング。
 * タグが質問文に含まれていれば追加スコアを加算。
 */
export function searchKnowledge(query: string): SearchResult | null {
  const qBigrams = bigrams(query);
  if (qBigrams.size === 0) return null;

  let best: SearchResult | null = null;

  for (const entry of KNOWLEDGE) {
    const haystack = normalize(
      [entry.question, entry.tags.join(" "), entry.answer].join(" ")
    ).replace(/\s+/g, "");

    let overlap = 0;
    for (const bg of qBigrams) {
      if (haystack.includes(bg)) overlap += 1;
    }

    let tagBoost = 0;
    const qLower = normalize(query);
    for (const tag of entry.tags) {
      if (qLower.includes(tag.toLowerCase())) tagBoost += 3;
    }

    const score = overlap + tagBoost;
    const confidence = overlap / qBigrams.size;

    if (!best || score > best.score) {
      best = { entry, score, confidence };
    }
  }

  return best;
}

export const CONFIDENCE_THRESHOLD = 0.32;
