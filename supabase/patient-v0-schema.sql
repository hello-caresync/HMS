-- Nexora Patient App V0 · Ecosystem schema (Supabase SQL editor)

create table if not exists public.ecosystem_patients (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text unique not null,
  phone text,
  mrn text unique not null,
  date_of_birth date,
  blood_group text,
  gender text,
  emergency_contact_name text,
  emergency_contact_phone text,
  insurance_provider text,
  insurance_policy_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ecosystem_doctors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text unique not null,
  department text not null,
  specialization text,
  experience text,
  languages text[] default '{}',
  rating numeric default 4.5,
  review_count int default 0,
  available_today boolean default true,
  consultation_fee numeric default 0,
  bio text,
  created_at timestamptz not null default now()
);

create table if not exists public.ecosystem_appointments (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid references public.ecosystem_patients(id),
  doctor_id uuid references public.ecosystem_doctors(id),
  patient_name text not null,
  patient_mrn text,
  doctor_name text not null,
  department text not null,
  appointment_date date not null,
  appointment_time time not null,
  end_time time,
  reason text,
  status text not null default 'Requested',
  visit_type text default 'OPD',
  token text,
  location text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ecosystem_prescriptions (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid references public.ecosystem_patients(id),
  doctor_id uuid references public.ecosystem_doctors(id),
  appointment_id uuid references public.ecosystem_appointments(id),
  medicines jsonb not null default '[]',
  status text default 'active',
  notes text,
  issued_at timestamptz not null default now()
);

create table if not exists public.ecosystem_medical_records (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid references public.ecosystem_patients(id),
  record_type text not null,
  title text not null,
  summary text,
  metadata jsonb default '{}',
  recorded_at timestamptz not null default now()
);

create table if not exists public.ecosystem_notifications (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid references public.ecosystem_patients(id),
  title text not null,
  body text not null,
  category text not null,
  read boolean default false,
  related_id text,
  created_at timestamptz not null default now()
);

create table if not exists public.ecosystem_lab_orders (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid references public.ecosystem_patients(id),
  doctor_id uuid references public.ecosystem_doctors(id),
  appointment_id uuid,
  test_name text not null,
  status text default 'ordered',
  result_summary text,
  ordered_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.ecosystem_radiology_orders (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid references public.ecosystem_patients(id),
  doctor_id uuid references public.ecosystem_doctors(id),
  appointment_id uuid,
  study_name text not null,
  status text default 'ordered',
  findings text,
  ordered_at timestamptz not null default now(),
  completed_at timestamptz
);

alter table public.ecosystem_patients enable row level security;
alter table public.ecosystem_doctors enable row level security;
alter table public.ecosystem_appointments enable row level security;
alter table public.ecosystem_prescriptions enable row level security;
alter table public.ecosystem_medical_records enable row level security;
alter table public.ecosystem_notifications enable row level security;
alter table public.ecosystem_lab_orders enable row level security;
alter table public.ecosystem_radiology_orders enable row level security;

create policy "eco_v0_anon_all" on public.ecosystem_patients for all using (true) with check (true);
create policy "eco_v0_anon_all" on public.ecosystem_doctors for all using (true) with check (true);
create policy "eco_v0_anon_all" on public.ecosystem_appointments for all using (true) with check (true);
create policy "eco_v0_anon_all" on public.ecosystem_prescriptions for all using (true) with check (true);
create policy "eco_v0_anon_all" on public.ecosystem_medical_records for all using (true) with check (true);
create policy "eco_v0_anon_all" on public.ecosystem_notifications for all using (true) with check (true);
create policy "eco_v0_anon_all" on public.ecosystem_lab_orders for all using (true) with check (true);
create policy "eco_v0_anon_all" on public.ecosystem_radiology_orders for all using (true) with check (true);
