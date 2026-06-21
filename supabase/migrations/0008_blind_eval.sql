-- Compass x Terac hackathon: blind v1-vs-v2 prompt comparison, collected
-- from a second, separate Terac opportunity of general-population
-- annotators. Each pair holds two summaries in randomized A/B slots; the
-- v1/v2 label per slot is recorded so results can be tallied later, but
-- never shown to the annotator on the /compare page itself.

create table if not exists public.comparison_pairs (
  id text primary key,
  summary_a text not null,
  summary_b text not null,
  label_a text not null check (label_a in ('v1_baseline', 'v2_improved')),
  label_b text not null check (label_b in ('v1_baseline', 'v2_improved')),
  created_at timestamptz not null default now()
);

create table if not exists public.comparison_results (
  id uuid primary key default uuid_generate_v4(),
  pair_id text not null references public.comparison_pairs (id) on delete cascade,
  choice text not null check (choice in ('a', 'b', 'tie')),
  created_at timestamptz not null default now()
);

create index if not exists comparison_results_pair_id_idx on public.comparison_results (pair_id);

-- Same reasoning as 0007_annotation_layer.sql: internal research data with
-- no owning Compass user, submitted by an anonymous Terac participant.
-- RLS enabled with no policies — service-role client only.
alter table public.comparison_pairs enable row level security;
alter table public.comparison_results enable row level security;
