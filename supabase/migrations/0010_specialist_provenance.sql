-- Compass: schema prep for the specialist finder / browser-agent search work.
-- Run this after 0002_features.sql.
-- No application code uses these yet — this is schema-only prep.

-- ============================================================
-- specialists: provenance columns
-- ============================================================
alter table public.specialists
  add column if not exists source_url text,
  add column if not exists last_verified_at timestamptz,
  add column if not exists confidence text;

-- Backfill: every existing row came from the static seed data.
update public.specialists
  set confidence = 'seed'
  where confidence is null;

-- ============================================================
-- search_jobs: async job tracking for specialist/benefits search
-- ============================================================
create table if not exists public.search_jobs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users (id) on delete cascade,
  child_id uuid references public.child_profiles (id) on delete cascade,
  job_type text not null
    check (job_type in ('specialist_search', 'benefits_search')),
  status text not null default 'pending'
    check (status in ('pending', 'running', 'done', 'failed')),
  query_params jsonb not null default '{}',
  results jsonb,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists search_jobs_user_id_idx on public.search_jobs (user_id);
create index if not exists search_jobs_child_id_idx on public.search_jobs (child_id);

drop trigger if exists set_updated_at on public.search_jobs;
create trigger set_updated_at before update on public.search_jobs
  for each row execute function public.set_updated_at();

alter table public.search_jobs enable row level security;

create policy "owner can view search jobs" on public.search_jobs
  for select using (auth.uid() = user_id);
create policy "owner can insert search jobs" on public.search_jobs
  for insert with check (auth.uid() = user_id);
create policy "owner can update search jobs" on public.search_jobs
  for update using (auth.uid() = user_id);
create policy "owner can delete search jobs" on public.search_jobs
  for delete using (auth.uid() = user_id);
