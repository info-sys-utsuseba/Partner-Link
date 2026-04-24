# Partner-Link デプロイ用指示書（Manus 投入版）

本ドキュメントは **Manus にそのままコピペして実行** させるための、完結したデプロイ手順とソースコード一式です。
前提: Supabase プロジェクト・Vercel アカウント・GitHub リポジトリは作成済みであること。

---

## 0. 成果物サマリ

| レイヤー | 役割 | ファイル |
| :--- | :--- | :--- |
| UI | ルート（Suspense 境界） | `src/app/page.tsx` |
| UI | チャット本体（6流入対応／参照元／エスカレーション） | `src/app/ChatView.tsx` |
| API | チャット応答（ナレッジ検索＋禁止用語サニタイズ） | `src/app/api/chat/route.ts` |
| API | エスカレーション送信 | `src/app/api/inquiry/route.ts` |
| 定数 | 用語規定・System Prompt | `src/constants/terms.ts`（既存） |
| 定数 | ナレッジベース＋検索関数 | `src/constants/knowledge.ts` |
| 定数 | 6 流入メニュー設定 | `src/constants/menu.ts` |
| 定数 | 代理店リスト（GP） | `src/constants/agents.ts` |
| DB | 生ログテーブル | `supabase/migrations/0001_raw_interaction_logs.sql`（既存） |
| DB | エスカレーション保存 | `supabase/migrations/0002_inquiries.sql` |

---

## 1. 実行コマンド（Manus 用）

```bash
# 1. 依存インストール
npm install

# 2. 環境変数（.env.local）
cp .env.example .env.local
# -> NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY を Supabase ダッシュボードから設定

# 3. Supabase マイグレーション適用
#    ローカル:   supabase db push
#    リモート:  Supabase Studio の SQL エディタで supabase/migrations/*.sql を順に実行
#              （0001 → 0002 の順）

# 4. 開発起動
npm run dev   # http://localhost:3000

# 5. 本番ビルド検証
npm run build && npm run start

# 6. Vercel デプロイ
#    - GitHub と連携してプッシュで自動デプロイ
#    - Vercel の Environment Variables に Supabase の URL / ANON_KEY を設定
```

## 2. LINE リッチメニュー連携

各メニューから公開 URL に対し、以下の `?type=` パラメータを付与して誘導してください。

| type | 用途 |
| :--- | :--- |
| `scheme` | スキーム・助成金 |
| `fee` | 料金・報酬 |
| `materials` | 営業資料・デモ |
| `referral` | 送客・紹介フロー |
| `tools` | AIツール活用 |
| `support` | 運用サポート |

例: `https://<your-vercel-domain>.vercel.app/?type=scheme`

未指定・未定義値はデフォルト表示にフォールバックします。

---

## 3. ソースコード全文

### 3.1 `src/constants/terms.ts`（既存・据え置き）

> 禁止用語「ミニマム／最小／最低」を「スタンダード／スタートアップ」へ置換するサニタイザと、
> Partner-Link 用 System Prompt のベース。API ルートの最終段で必ず `sanitizeTerms()` を通します。

（既存のまま変更なし）

### 3.2 `src/constants/knowledge.ts`（新規）

`docs/line_qa_database.md` の 24 件を TS 定数化し、文字 2-gram + タグブーストで簡易検索します。
`CONFIDENCE_THRESHOLD` を下回る質問は自動でエスカレーション提案に流します。

→ リポジトリ同梱の `src/constants/knowledge.ts` 参照（600行程度）。

### 3.3 `src/constants/menu.ts`（新規）

```ts
export type MenuType =
  | "scheme" | "fee" | "materials" | "referral" | "tools" | "support";
// 各 type ごとに { label, greeting, quickReplies[4] } を保持。
// resolveMenu(type) で安全にフォールバック。
```

### 3.4 `src/constants/agents.ts`（新規）

代理店 20 件（匿名化済）を静的配列で保持。本番では `agents` テーブル化推奨。

### 3.5 `src/app/api/chat/route.ts`（刷新）

```ts
// 1. query を受け取り searchKnowledge() でヒット検索
// 2. confidence >= 0.32 なら回答と references を返す
// 3. 未達なら shouldEscalate=true + 担当への誘導文を返す
// 4. いずれも最終段で sanitizeTerms() を適用
// 5. raw_interaction_logs へ best-effort で INSERT
```

### 3.6 `src/app/api/inquiry/route.ts`（新規）

```ts
// agentId / customerName / customerEmail / question / sessionId を受領。
// AGENTS に存在する agentId のみ許可。メール・文字数をバリデーション。
// public.inquiries に INSERT し、完了メッセージを返す。
```

### 3.7 `src/app/page.tsx`（刷新）

```tsx
// Server Component。useSearchParams を使う ChatView を <Suspense> で包むだけ。
```

### 3.8 `src/app/ChatView.tsx`（新規）

```tsx
// Client Component。
// - useSearchParams() で ?type= を読み取り resolveMenu() で初期表示を決定
// - 初回の greeting バブル + 4つ（デフォルトは6つ）のクイックリプライを表示
// - assistant 吹き出しに参照元リスト（📄/🎥/🔗/✉️ アイコン付き）
// - shouldEscalate=true の吹き出しに「担当者に繋ぐ（GPに質問）」ボタン
// - ボタン押下で吹き出し内インライン展開される代理店選択フォーム
// - /api/inquiry 成功時に system 吹き出し（緑ピル）で確定メッセージ
```

### 3.9 `supabase/migrations/0002_inquiries.sql`（新規）

```sql
create table public.inquiries (
  id uuid primary key default gen_random_uuid(),
  agent_id text not null,
  customer_name text not null,
  customer_email text not null,
  question text not null,
  session_id uuid,
  created_at timestamptz not null default now()
);
-- indexes + RLS + anon insert ポリシー
```

---

## 4. 動作確認シナリオ

| # | 操作 | 期待挙動 |
| :-- | :-- | :-- |
| 1 | `/?type=scheme` を開く | バッジ「スキーム・助成金」・関連クイックリプライ4件 |
| 2 | 「助成金の正式名称を教えてください」を送信 | 「人材開発支援助成金…」回答＋厚労省 PDF リンク |
| 3 | 「ミニマム金額は？」と送信 | 応答中の「ミニマム」が「スタンダード」に置換される |
| 4 | 「宇宙旅行のおすすめは？」と送信 | エスカレーション誘導文＋「担当者に繋ぐ」ボタン表示 |
| 5 | 4 のボタンを押下 | 代理店選択・名前・メール・質問のフォームが吹き出し内展開 |
| 6 | 必須項目を埋めて送信 | `public.inquiries` に 1 行 INSERT され、緑ピルで完了メッセージ |

---

## 5. 既知の拡張ポイント（MVP 後）

1. `searchKnowledge` を Supabase `pgvector` + OpenAI embeddings に置換
2. `buildSystemPrompt()` を LLM に本接続（Anthropic/OpenAI の API キー差し込み済）
3. `raw_interaction_logs` からクラスタリングで「未解決質問」を半自動抽出し `unresolved_questions.md` に追加する自律改善ループ
4. `AGENTS` を Supabase テーブル化し、GP へ即時 LINE/Email 通知
5. `inquiries` への INSERT を Edge Function で受け、Slack/LINE Notify へルーティング
