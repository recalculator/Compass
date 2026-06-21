-- Compass x Terac hackathon: human-data annotation layer for the AI
-- nurse intake summary. Call notes are generated from the Vapi comfort
-- agent's intake conversation; annotations are submitted by a
-- general-population Terac participant rating/correcting that summary.

create table if not exists public.call_notes (
  id uuid primary key default uuid_generate_v4(),
  expert_call_request_id uuid not null references public.expert_call_requests (id) on delete cascade,
  ai_generated_summary text not null,
  model_version text not null default 'v1_baseline',
  created_at timestamptz not null default now()
);

create index if not exists call_notes_expert_call_request_id_idx
  on public.call_notes (expert_call_request_id);

create table if not exists public.annotations (
  id uuid primary key default uuid_generate_v4(),
  call_notes_id uuid not null references public.call_notes (id) on delete cascade,
  terac_submission_id text,
  clarity_rating integer not null check (clarity_rating between 1 and 5),
  corrected_summary text,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists annotations_call_notes_id_idx on public.annotations (call_notes_id);

-- This is internal research data, not parent-owned: the parent never reads
-- or writes these rows, and the person submitting an annotation is a Terac
-- participant with no Compass account (no auth.uid() to scope by). RLS is
-- enabled with no policies, so all access goes through the service-role
-- client from trusted server routes (the webhook handler and the public
-- /annotate route), never directly from a browser with the anon key.
alter table public.call_notes enable row level security;
alter table public.annotations enable row level security;
