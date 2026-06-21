-- Add phone number field for Poke integration
alter table public.users
  add column if not exists phone_number text;
