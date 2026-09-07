-- Partner-Link: エスカレーション問い合わせ
-- AI が確信度高く回答できない場合に、代理店経由で GP（ゼネラルパートナー）へ繋ぐための受け皿。

create extension if not exists "pgcrypto";

create table if not exists public.inquiries (
  id              uuid        primary key default gen_random_uuid(),
  agent_id        text        not null,
  customer_name   text        not null,
  customer_email  text        not null,
  question        text        not null,
  session_id      uuid,
  created_at      timestamptz not null default now()
);

create index if not exists inquiries_created_at_idx
  on public.inquiries (created_at desc);

create index if not exists inquiries_agent_id_idx
  on public.inquiries (agent_id);

alter table public.inquiries enable row level security;

create policy "anon can insert inquiries"
  on public.inquiries
  for insert
  to anon, authenticated
  with check (true);
