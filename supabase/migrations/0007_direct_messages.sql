-- Migration 0007: Direct messages between parents

create table if not exists public.direct_messages (
  id uuid primary key default uuid_generate_v4(),
  sender_id uuid not null references public.users (id) on delete cascade,
  recipient_id uuid not null references public.users (id) on delete cascade,
  body text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists direct_messages_sender_idx on public.direct_messages (sender_id, created_at desc);
create index if not exists direct_messages_recipient_idx on public.direct_messages (recipient_id, created_at desc);

alter table public.direct_messages enable row level security;

create policy "participants can view messages" on public.direct_messages
  for select using (auth.uid() = sender_id or auth.uid() = recipient_id);

create policy "sender can insert messages" on public.direct_messages
  for insert with check (auth.uid() = sender_id);

create policy "recipient can mark read" on public.direct_messages
  for update using (auth.uid() = recipient_id);
