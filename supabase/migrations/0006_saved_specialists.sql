-- Migration 0006: Saved specialists (user-pinned providers from live search)

create table if not exists public.saved_specialists (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users (id) on delete cascade,
  name text not null,
  specialty text not null,
  phone text,
  address text,
  description text,
  profile_url text,
  saved_at timestamptz not null default now()
);

create index if not exists saved_specialists_user_id_idx on public.saved_specialists (user_id);

alter table public.saved_specialists enable row level security;

create policy "owner can view saved specialists" on public.saved_specialists
  for select using (auth.uid() = user_id);
create policy "owner can insert saved specialists" on public.saved_specialists
  for insert with check (auth.uid() = user_id);
create policy "owner can delete saved specialists" on public.saved_specialists
  for delete using (auth.uid() = user_id);
