-- Migration 0003: Browserbase search cache
-- Adds source + address columns to specialists.
-- Creates browserbase_benefits as a separate cache table (avoids schema conflict
-- with the existing user-saved saved_benefits table from 0002).

alter table public.specialists
  add column if not exists address text,
  add column if not exists source text not null default 'manual';

create index if not exists specialists_source_idx on public.specialists (source);

create table if not exists public.browserbase_benefits (
  id uuid primary key default uuid_generate_v4(),
  zip_code text not null,
  diagnosis_tag text not null,
  program_name text not null,
  description text,
  contact_info text,
  source text not null default 'browserbase',
  created_at timestamptz not null default now()
);

create index if not exists browserbase_benefits_zip_tag_idx
  on public.browserbase_benefits (zip_code, diagnosis_tag);

create index if not exists browserbase_benefits_created_at_idx
  on public.browserbase_benefits (created_at);

alter table public.browserbase_benefits enable row level security;

create policy "anyone can view browserbase benefits"
  on public.browserbase_benefits for select using (true);
