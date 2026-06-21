-- Weekly digest email feature removed (Mailgun, /api/digest/*, EmailPreferences).
drop table if exists public.digest_logs;
alter table public.users drop column if exists email_digest_enabled;
