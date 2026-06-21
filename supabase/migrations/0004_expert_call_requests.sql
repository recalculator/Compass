-- Compass: live expert connect — Terac-sourced human expert + Google Meet call.

create table if not exists public.expert_call_requests (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users (id) on delete cascade,
  child_id uuid references public.child_profiles (id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'launched', 'matched', 'scheduled', 'failed', 'cancelled')),
  topic text not null,
  terac_opportunity_id text,
  terac_submission_id text,
  calendar_event_id text,
  meet_link text,
  scheduled_at timestamptz,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists expert_call_requests_user_id_idx on public.expert_call_requests (user_id);
create index if not exists expert_call_requests_child_id_idx on public.expert_call_requests (child_id);

drop trigger if exists set_updated_at on public.expert_call_requests;
create trigger set_updated_at before update on public.expert_call_requests
  for each row execute function public.set_updated_at();

alter table public.expert_call_requests enable row level security;

create policy "owner can view expert call requests" on public.expert_call_requests
  for select using (auth.uid() = user_id);
create policy "owner can insert expert call requests" on public.expert_call_requests
  for insert with check (auth.uid() = user_id);
create policy "owner can update expert call requests" on public.expert_call_requests
  for update using (auth.uid() = user_id);
create policy "owner can delete expert call requests" on public.expert_call_requests
  for delete using (auth.uid() = user_id);
