-- Cross-app Realtime sync: appointments + notifications (Doctor ↔ Patient)
-- Run in Supabase SQL Editor · enable Realtime on both tables

-- Extend slot appointments for full cross-app fields (text IDs for V0 dev auth)
alter table public.appointments
  alter column patient_id type text using patient_id::text,
  alter column doctor_id type text using doctor_id::text;

alter table public.appointments
  add column if not exists patient_name text,
  add column if not exists patient_mrn text,
  add column if not exists doctor_name text,
  add column if not exists department text,
  add column if not exists reason text,
  add column if not exists token text,
  add column if not exists visit_type text default 'OPD',
  add column if not exists ecosystem_status text default 'Requested';

create index if not exists idx_appointments_doctor on public.appointments (doctor_id, appointment_date);
create index if not exists idx_appointments_patient on public.appointments (patient_id, appointment_date);

-- Unified notifications (patient + doctor audiences)
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  patient_id text,
  doctor_id text,
  title text not null,
  body text not null,
  category text not null default 'system',
  read boolean not null default false,
  related_id text,
  target_audience text not null default 'patient' check (target_audience in ('patient', 'doctor', 'both')),
  created_at timestamptz not null default now()
);

create index if not exists idx_notifications_doctor on public.notifications (doctor_id, created_at desc);
create index if not exists idx_notifications_patient on public.notifications (patient_id, created_at desc);

alter table public.notifications enable row level security;

drop policy if exists "notifications_anon_all" on public.notifications;
create policy "notifications_anon_all"
  on public.notifications for all using (true) with check (true);

-- Ecosystem appointments: allow text IDs for V0 dev sessions
alter table public.ecosystem_appointments
  alter column patient_id type text using patient_id::text,
  alter column doctor_id type text using doctor_id::text;

alter table public.ecosystem_notifications
  alter column patient_id type text using patient_id::text;

alter table public.ecosystem_notifications
  add column if not exists doctor_id text;

-- Realtime: Dashboard → Database → Publications → supabase_realtime
--   add: appointments, notifications, ecosystem_appointments, ecosystem_notifications
