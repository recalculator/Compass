-- Migration 0005: Benefits state-level search
-- Adds state_code so benefits can be cached per state (not just zip),
-- since most disability benefit programs are state-administered.

alter table public.browserbase_benefits
  add column if not exists state_code text;

-- zip_code can now be null (state-level searches don't need it)
alter table public.browserbase_benefits
  alter column zip_code drop not null;

create index if not exists browserbase_benefits_state_tag_idx
  on public.browserbase_benefits (state_code, diagnosis_tag);
