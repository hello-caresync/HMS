-- Successful platform-root login audit.
-- Never stores the root passcode or any credential secret.

create table if not exists public.super_admin_login_events (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  event_type text not null default 'LOGIN_SUCCESS',
  user_agent text,
  created_at timestamptz not null default now(),
  constraint super_admin_login_events_email_check
    check (lower(email) = 'platform.root@regalhealth.io'),
  constraint super_admin_login_events_type_check
    check (event_type = 'LOGIN_SUCCESS')
);

create index if not exists idx_super_admin_login_events_created_at
  on public.super_admin_login_events (created_at desc);

alter table public.super_admin_login_events enable row level security;

drop policy if exists super_admin_login_events_insert on public.super_admin_login_events;
create policy super_admin_login_events_insert
  on public.super_admin_login_events
  for insert
  to anon, authenticated
  with check (
    lower(email) = 'platform.root@regalhealth.io'
    and event_type = 'LOGIN_SUCCESS'
  );

revoke all on table public.super_admin_login_events from anon, authenticated;
grant insert on table public.super_admin_login_events to anon, authenticated;

comment on table public.super_admin_login_events is
  'Append-only successful platform-root login events; credential secrets are never stored.';
