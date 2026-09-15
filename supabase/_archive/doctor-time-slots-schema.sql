-- Doctor time slots + live appointments for Patient App booking (Supabase SQL editor)

create table if not exists public.doctor_time_slots (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null,
  day_of_week int not null check (day_of_week between 0 and 6),
  slot_time time not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (doctor_id, day_of_week, slot_time)
);

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid,
  doctor_id uuid not null,
  appointment_date date not null,
  time_slot time not null,
  status text not null default 'BOOKED',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_doctor_time_slots_lookup
  on public.doctor_time_slots (doctor_id, day_of_week, is_active);

create index if not exists idx_appointments_doctor_date
  on public.appointments (doctor_id, appointment_date, status);

alter table public.doctor_time_slots enable row level security;
alter table public.appointments enable row level security;

drop policy if exists "doctor_time_slots_anon_read" on public.doctor_time_slots;
create policy "doctor_time_slots_anon_read"
  on public.doctor_time_slots for select using (true);

drop policy if exists "appointments_anon_all" on public.appointments;
create policy "appointments_anon_all"
  on public.appointments for all using (true) with check (true);

-- Demo doctor slots (Mon–Sat = 1–6). Re-run safe via ON CONFLICT.
insert into public.doctor_time_slots (doctor_id, day_of_week, slot_time) values
  ('00000000-0000-4000-a000-000000000101', 1, '09:00'), ('00000000-0000-4000-a000-000000000101', 1, '09:30'),
  ('00000000-0000-4000-a000-000000000101', 1, '10:00'), ('00000000-0000-4000-a000-000000000101', 1, '11:00'),
  ('00000000-0000-4000-a000-000000000101', 1, '14:00'), ('00000000-0000-4000-a000-000000000101', 1, '15:30'),
  ('00000000-0000-4000-a000-000000000101', 1, '16:00'),
  ('00000000-0000-4000-a000-000000000102', 1, '10:00'), ('00000000-0000-4000-a000-000000000102', 1, '10:30'),
  ('00000000-0000-4000-a000-000000000102', 1, '11:30'), ('00000000-0000-4000-a000-000000000102', 1, '15:00'),
  ('00000000-0000-4000-a000-000000000102', 1, '16:30'),
  ('00000000-0000-4000-a000-000000000104', 1, '09:00'), ('00000000-0000-4000-a000-000000000104', 1, '10:30'),
  ('00000000-0000-4000-a000-000000000104', 1, '11:30'), ('00000000-0000-4000-a000-000000000104', 1, '15:00'),
  ('00000000-0000-4000-a000-000000000104', 1, '16:00')
on conflict do nothing;

-- Copy Monday slots to Tue–Sat for demo doctors
insert into public.doctor_time_slots (doctor_id, day_of_week, slot_time)
select doctor_id, d, slot_time
from public.doctor_time_slots
cross join generate_series(2, 6) as d
where day_of_week = 1
on conflict do nothing;

-- Enable Realtime in Supabase Dashboard → Database → Publications → supabase_realtime:
--   add tables: appointments, doctor_time_slots
