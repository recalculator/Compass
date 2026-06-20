-- Compass initial schema
-- Run this in the Supabase SQL editor, or via `supabase db push`.

create extension if not exists "uuid-ossp";

-- ============================================================
-- users (profile data layered on top of Supabase auth.users)
-- ============================================================
create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- child_profiles
-- ============================================================
create table if not exists public.child_profiles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users (id) on delete cascade,
  child_name text not null,
  birth_date date,
  diagnosis text[] default '{}',
  current_services text[] default '{}',
  location_zip text,
  location_city text,
  location_state text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists child_profiles_user_id_idx on public.child_profiles (user_id);

-- ============================================================
-- documents
-- ============================================================
create table if not exists public.documents (
  id uuid primary key default uuid_generate_v4(),
  child_id uuid not null references public.child_profiles (id) on delete cascade,
  uploaded_by uuid not null references public.users (id) on delete cascade,
  file_name text not null,
  file_path text not null,
  document_type text not null default 'other'
    check (document_type in ('iep', 'evaluation', 'therapy_note', 'other')),
  extracted_text text,
  extracted_data jsonb,
  status text not null default 'processing'
    check (status in ('processing', 'complete', 'failed')),
  created_at timestamptz not null default now()
);

create index if not exists documents_child_id_idx on public.documents (child_id);

-- ============================================================
-- roadmap_items
-- ============================================================
create table if not exists public.roadmap_items (
  id uuid primary key default uuid_generate_v4(),
  child_id uuid not null references public.child_profiles (id) on delete cascade,
  document_id uuid references public.documents (id) on delete set null,
  type text not null
    check (type in ('diagnosis', 'evaluation', 'service_start', 'goal', 'recommendation', 'milestone', 'next_step')),
  title text not null,
  description text,
  item_date date,
  is_next_step boolean not null default false,
  status text default 'pending'
    check (status in ('pending', 'in_progress', 'done')),
  created_at timestamptz not null default now()
);

create index if not exists roadmap_items_child_id_idx on public.roadmap_items (child_id);
create index if not exists roadmap_items_next_step_idx on public.roadmap_items (child_id, is_next_step);

-- ============================================================
-- community_posts
-- ============================================================
create table if not exists public.community_posts (
  id uuid primary key default uuid_generate_v4(),
  author_id uuid not null references public.users (id) on delete cascade,
  title text not null,
  body text not null,
  topic text not null default 'general'
    check (topic in ('newly_diagnosed', 'iep_help', 'school', 'behavior', 'therapies', 'general')),
  created_at timestamptz not null default now()
);

create index if not exists community_posts_topic_idx on public.community_posts (topic);

-- ============================================================
-- community_comments
-- ============================================================
create table if not exists public.community_comments (
  id uuid primary key default uuid_generate_v4(),
  post_id uuid not null references public.community_posts (id) on delete cascade,
  parent_comment_id uuid references public.community_comments (id) on delete cascade,
  author_id uuid not null references public.users (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists community_comments_post_id_idx on public.community_comments (post_id);

-- ============================================================
-- specialists
-- ============================================================
create table if not exists public.specialists (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  specialty_type text not null
    check (specialty_type in ('aba', 'speech', 'ot', 'feeding', 'developmental_pediatrician', 'pt', 'psychology', 'neurology', 'other')),
  practice_name text,
  zip_code text not null,
  city text,
  state text,
  phone text,
  website text,
  insurance_accepted text[] default '{}',
  telehealth boolean not null default false,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists specialists_zip_idx on public.specialists (zip_code);
create index if not exists specialists_type_idx on public.specialists (specialty_type);

-- ============================================================
-- updated_at triggers
-- ============================================================
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_updated_at on public.users;
create trigger set_updated_at before update on public.users
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at on public.child_profiles;
create trigger set_updated_at before update on public.child_profiles
  for each row execute function public.set_updated_at();

-- ============================================================
-- auto-create public.users row when someone signs up
-- ============================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- Row Level Security
-- ============================================================
alter table public.users enable row level security;
alter table public.child_profiles enable row level security;
alter table public.documents enable row level security;
alter table public.roadmap_items enable row level security;
alter table public.community_posts enable row level security;
alter table public.community_comments enable row level security;
alter table public.specialists enable row level security;

-- users: can read/update only their own row
create policy "users can view own row" on public.users
  for select using (auth.uid() = id);
create policy "users can update own row" on public.users
  for update using (auth.uid() = id);

-- child_profiles: owner-only
create policy "owner can view child profiles" on public.child_profiles
  for select using (auth.uid() = user_id);
create policy "owner can insert child profiles" on public.child_profiles
  for insert with check (auth.uid() = user_id);
create policy "owner can update child profiles" on public.child_profiles
  for update using (auth.uid() = user_id);
create policy "owner can delete child profiles" on public.child_profiles
  for delete using (auth.uid() = user_id);

-- documents: owner-only, scoped via child_profiles.user_id
create policy "owner can view documents" on public.documents
  for select using (
    exists (select 1 from public.child_profiles cp where cp.id = child_id and cp.user_id = auth.uid())
  );
create policy "owner can insert documents" on public.documents
  for insert with check (
    exists (select 1 from public.child_profiles cp where cp.id = child_id and cp.user_id = auth.uid())
  );
create policy "owner can update documents" on public.documents
  for update using (
    exists (select 1 from public.child_profiles cp where cp.id = child_id and cp.user_id = auth.uid())
  );
create policy "owner can delete documents" on public.documents
  for delete using (
    exists (select 1 from public.child_profiles cp where cp.id = child_id and cp.user_id = auth.uid())
  );

-- roadmap_items: owner-only, scoped via child_profiles.user_id
create policy "owner can view roadmap items" on public.roadmap_items
  for select using (
    exists (select 1 from public.child_profiles cp where cp.id = child_id and cp.user_id = auth.uid())
  );
create policy "owner can insert roadmap items" on public.roadmap_items
  for insert with check (
    exists (select 1 from public.child_profiles cp where cp.id = child_id and cp.user_id = auth.uid())
  );
create policy "owner can update roadmap items" on public.roadmap_items
  for update using (
    exists (select 1 from public.child_profiles cp where cp.id = child_id and cp.user_id = auth.uid())
  );
create policy "owner can delete roadmap items" on public.roadmap_items
  for delete using (
    exists (select 1 from public.child_profiles cp where cp.id = child_id and cp.user_id = auth.uid())
  );

-- community_posts: anyone authenticated can read; only the author can write/edit/delete
create policy "authenticated can view posts" on public.community_posts
  for select using (auth.role() = 'authenticated');
create policy "author can insert posts" on public.community_posts
  for insert with check (auth.uid() = author_id);
create policy "author can update own posts" on public.community_posts
  for update using (auth.uid() = author_id);
create policy "author can delete own posts" on public.community_posts
  for delete using (auth.uid() = author_id);

-- community_comments: anyone authenticated can read; only the author can write/edit/delete
create policy "authenticated can view comments" on public.community_comments
  for select using (auth.role() = 'authenticated');
create policy "author can insert comments" on public.community_comments
  for insert with check (auth.uid() = author_id);
create policy "author can update own comments" on public.community_comments
  for update using (auth.uid() = author_id);
create policy "author can delete own comments" on public.community_comments
  for delete using (auth.uid() = author_id);

-- specialists: public read-only directory (writes happen via service role / admin)
create policy "anyone can view specialists" on public.specialists
  for select using (true);

-- ============================================================
-- Storage bucket for uploaded documents (IEPs, evaluations, etc.)
-- ============================================================
insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

create policy "owner can upload documents to storage"
  on storage.objects for insert
  with check (bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "owner can read own documents from storage"
  on storage.objects for select
  using (bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "owner can delete own documents from storage"
  on storage.objects for delete
  using (bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text);
