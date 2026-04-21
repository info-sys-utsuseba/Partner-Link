#!/usr/bin/env bash
set -e

echo "==> Enabling corepack (pnpm/yarn)"
sudo corepack enable || true

if [ -f "package.json" ]; then
  echo "==> Installing npm dependencies"
  npm install
fi

if [ ! -f ".env.local" ] && [ -f ".env.example" ]; then
  echo "==> Creating .env.local from .env.example"
  cp .env.example .env.local
fi

echo "==> Versions"
node -v
npm -v
command -v supabase >/dev/null && supabase --version || true
command -v vercel >/dev/null && vercel --version || true
command -v gh >/dev/null && gh --version | head -n1 || true

echo "==> Dev container ready."
