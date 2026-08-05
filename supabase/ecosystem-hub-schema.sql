-- Nexora Ecosystem Hub — central audit + activity feed
-- Run after hospital-v0-schema.sql and cross-app-realtime-schema.sql

create table if not exists public.ecosystem_activity (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  actor_role text not null check (actor_role in ('patient', 'doctor', 'hospital', 'vendor', 'system')),
  actor_id text,
  patient_id text,
  doctor_id text,
  related_id text,
  message text not null,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_ecosystem_activity_created on public.ecosystem_activity (created_at desc);
create index if not exists idx_ecosystem_activity_event on public.ecosystem_activity (event_type);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  action text not null,
  actor_role text not null,
  actor_id text,
  entity_type text not null,
  entity_id text,
  payload jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_audit_logs_created on public.audit_logs (created_at desc);

alter table public.ecosystem_activity enable row level security;
alter table public.audit_logs enable row level security;

drop policy if exists ecosystem_activity_anon on public.ecosystem_activity;
create policy ecosystem_activity_anon on public.ecosystem_activity for all using (true) with check (true);

drop policy if exists audit_logs_anon on public.audit_logs;
create policy audit_logs_anon on public.audit_logs for all using (true) with check (true);

-- Extend notifications for vendor role routing
alter table public.notifications add column if not exists vendor_id text;

comment on table public.ecosystem_activity is 'Live activity feed for Hospital Operations Hub dashboard';
comment on table public.audit_logs is 'Immutable audit trail for all ecosystem mutations';
