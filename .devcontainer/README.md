# Dev Container

Partner-Link の開発環境（Next.js + Supabase + Vercel）を Dev Container で提供します。

## 起動方法

1. VS Code に **Dev Containers** 拡張をインストール
2. このリポジトリを開き、コマンドパレットから `Dev Containers: Reopen in Container` を実行
3. 初回はビルドに数分かかります。完了すると `post-create.sh` が依存関係を自動インストールします

## 含まれるもの

- Node.js 20 (Debian Bookworm)
- GitHub CLI (`gh`)
- Supabase CLI (`supabase`)
- Vercel CLI (`vercel`)
- Docker-in-Docker（Supabase ローカルスタック起動用）

## 転送ポート

| ポート | 用途 |
| ------ | ---- |
| 3000   | Next.js dev server |
| 54321  | Supabase API |
| 54322  | Supabase Postgres |
| 54323  | Supabase Studio |

## 環境変数

`.env.example` があれば自動で `.env.local` にコピーされます。Supabase / LINE / その他 API キーはここで設定してください。
