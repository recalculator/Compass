-- Compass: Benefits Finder, Weekly Digest, Milestone Alerts
-- Run this after 0001_init.sql.

alter table public.users
  add column if not exists email_digest_enabled boolean not null default true;

-- ============================================================
-- saved_benefits
-- ============================================================
create table if not exists public.saved_benefits (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users (id) on delete cascade,
  program_name text not null,
  state text not null,
  category text not null,
  details jsonb not null default '{}',
  saved_at timestamptz not null default now()
);

create index if not exists saved_benefits_user_id_idx on public.saved_benefits (user_id);

alter table public.saved_benefits enable row level security;

create policy "owner can view saved benefits" on public.saved_benefits
  for select using (auth.uid() = user_id);
create policy "owner can insert saved benefits" on public.saved_benefits
  for insert with check (auth.uid() = user_id);
create policy "owner can delete saved benefits" on public.saved_benefits
  for delete using (auth.uid() = user_id);

-- ============================================================
-- digest_logs
-- ============================================================
create table if not exists public.digest_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users (id) on delete cascade,
  sent_at timestamptz not null default now(),
  status text not null check (status in ('sent', 'failed')),
  error_message text
);

create index if not exists digest_logs_user_id_idx on public.digest_logs (user_id);

alter table public.digest_logs enable row level security;

create policy "owner can view own digest logs" on public.digest_logs
  for select using (auth.uid() = user_id);

-- inserts happen from the server using the service role key (digest send job),
-- which bypasses RLS entirely. No insert policy is needed for normal users.

-- ============================================================
-- milestone_alerts
-- ============================================================
create table if not exists public.milestone_alerts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users (id) on delete cascade,
  child_profile_id uuid not null references public.child_profiles (id) on delete cascade,
  alert_text text not null,
  due_date date,
  status text not null default 'active'
    check (status in ('active', 'done', 'snoozed')),
  snoozed_until timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists milestone_alerts_user_id_idx on public.milestone_alerts (user_id);
create index if not exists milestone_alerts_child_id_idx on public.milestone_alerts (child_profile_id);

alter table public.milestone_alerts enable row level security;

create policy "owner can view milestone alerts" on public.milestone_alerts
  for select using (auth.uid() = user_id);
create policy "owner can insert milestone alerts" on public.milestone_alerts
  for insert with check (auth.uid() = user_id);
create policy "owner can update milestone alerts" on public.milestone_alerts
  for update using (auth.uid() = user_id);
create policy "owner can delete milestone alerts" on public.milestone_alerts
  for delete using (auth.uid() = user_id);
