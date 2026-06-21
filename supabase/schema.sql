-- Run this in Supabase Dashboard → SQL Editor
-- https://supabase.com/dashboard → your project → SQL Editor

create table if not exists public.match_records (
  id text primary key,
  end_time bigint not null,
  data jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists match_records_end_time_idx
  on public.match_records (end_time desc);

alter table public.match_records enable row level security;

-- API uses service role key; RLS blocks direct anon access.
create policy "no anon access"
  on public.match_records
  for all
  to anon
  using (false)
  with check (false);
