-- Compass: mic-first intake means topic is now derived from the AI intake
-- conversation (via the Vapi end-of-call webhook), not collected upfront,
-- so it can't be required at insert time. Also adds a real claim timeout
-- so the UI can stop polling forever if no annotator claims the task.

alter table public.expert_call_requests
  alter column topic drop not null;

alter table public.expert_call_requests
  add column if not exists claim_timeout_at timestamptz;

alter table public.expert_call_requests
  drop constraint if exists expert_call_requests_status_check;

alter table public.expert_call_requests
  add constraint expert_call_requests_status_check
  check (status in ('pending', 'launched', 'matched', 'scheduled', 'timed_out', 'failed', 'cancelled'));
