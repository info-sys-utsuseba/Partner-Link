# Partner-Link

代理店支援を加速させる自律改善型AIプラットフォーム。代理店（パートナー）の活動を最大化するためのAIチャットボット及びポータル環境。公式LINEの対話データやサービス資料を統合し、Supabase + Vercelを用いた拡張性の高いアーキテクチャで構築。Manusによる自動データ収集と、質問傾向の分析による自律的なナレッジ改善を実現します。

## 技術スタック

- **Framework:** Next.js 15 (App Router) + TypeScript
- **Styling:** Tailwind CSS
- **BaaS:** Supabase (Auth / Postgres / Storage)
- **Deploy:** Vercel
- **LINE 連携:** LINE Messaging API

## セットアップ

### Dev Container（推奨）

VS Code + Dev Containers 拡張で `Reopen in Container` を実行。詳細は [.devcontainer/README.md](./.devcontainer/README.md) を参照。

### ローカル

```bash
npm install
cp .env.example .env.local  # 環境変数を設定
npm run dev
```

[http://localhost:3000](http://localhost:3000) を開いて動作確認。

## スクリプト

| コマンド | 用途 |
| --- | --- |
| `npm run dev` | 開発サーバー起動 |
| `npm run build` | 本番ビルド |
| `npm run start` | 本番サーバー起動 |
| `npm run lint` | ESLint 実行 |

## ディレクトリ構成

```
src/
  app/              # Next.js App Router
  lib/supabase/     # Supabase クライアント (client / server)
```
