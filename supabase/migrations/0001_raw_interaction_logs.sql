-- Partner-Link: 自律改善ループの素材となる生ログ
-- query / answer / timestamp のみを保持し、後続のクラスタリング・分析はここを起点に行う。

create extension if not exists "pgcrypto";

create table if not exists public.raw_interaction_logs (
  id           uuid        primary key default gen_random_uuid(),
  session_id   uuid,
  query        text        not null,
  answer       text        not null,
  created_at   timestamptz not null default now()
);

create index if not exists raw_interaction_logs_created_at_idx
  on public.raw_interaction_logs (created_at desc);

create index if not exists raw_interaction_logs_session_id_idx
  on public.raw_interaction_logs (session_id);

alter table public.raw_interaction_logs enable row level security;

-- 匿名クライアントからの INSERT のみ許可（読み取りは service_role で実施）
create policy "anon can insert interaction logs"
  on public.raw_interaction_logs
  for insert
  to anon, authenticated
  with check (true);
