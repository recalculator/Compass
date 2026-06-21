-- Compass: replace Google Meet links with an in-app Daily.co call room +
-- Vapi comfort-agent call id.

alter table public.expert_call_requests
  drop column if exists calendar_event_id,
  drop column if exists meet_link,
  add column if not exists room_url text,
  add column if not exists room_name text,
  add column if not exists vapi_call_id text;
