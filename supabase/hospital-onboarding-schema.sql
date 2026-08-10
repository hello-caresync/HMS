-- Nexora Hospital App V0 · onboarding & unified RBAC (run in Supabase SQL editor)

create table if not exists public.hospitals (
  id uuid primary key default gen_random_uuid(),
  hospital_name text not null,
  registration_number text not null,
  tax_gstin_id text,
  official_email text not null,
  phone text not null,
  emergency_helpline text,
  address text not null,
  city text not null,
  state text not null,
  pincode text not null,
  total_beds integer not null default 0,
  icu_beds integer not null default 0,
  opd_rooms integer not null default 0,
  ot_suites integer not null default 0,
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.departments (
  id uuid primary key default gen_random_uuid(),
  hospital_id uuid not null references public.hospitals (id) on delete cascade,
  name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (hospital_id, name)
);

create table if not exists public.hospital_members (
  id uuid primary key default gen_random_uuid(),
  hospital_id uuid not null references public.hospitals (id) on delete cascade,
  department_id uuid references public.departments (id) on delete set null,
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text,
  employee_id text not null,
  role text not null check (
    role in ('Doctor', 'Nurse', 'Receptionist', 'Billing', 'Admin', 'Pharmacist')
  ),
  status text not null default 'Active' check (status in ('Active', 'Suspended', 'Inactive')),
  password_hash text not null,
  temp_password_issued_at timestamptz,
  medical_license_number text,
  specialization text,
  qualification text,
  experience_years integer,
  consultation_fee numeric(12, 2),
  opd_room_number text,
  auth_user_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (hospital_id, employee_id),
  unique (hospital_id, email)
);

create index if not exists idx_departments_hospital on public.departments (hospital_id, is_active);
create index if not exists idx_hospital_members_hospital on public.hospital_members (hospital_id, status);
create index if not exists idx_hospital_members_login on public.hospital_members (lower(email));
create index if not exists idx_hospital_members_employee on public.hospital_members (employee_id);

alter table public.hospitals enable row level security;
alter table public.departments enable row level security;
alter table public.hospital_members enable row level security;

drop policy if exists hospitals_anon_all on public.hospitals;
create policy hospitals_anon_all on public.hospitals for all using (true) with check (true);

drop policy if exists departments_anon_all on public.departments;
create policy departments_anon_all on public.departments for all using (true) with check (true);

drop policy if exists hospital_members_anon_all on public.hospital_members;
create policy hospital_members_anon_all on public.hospital_members for all using (true) with check (true);

comment on table public.hospitals is 'Hospital onboarding master record';
comment on table public.departments is 'Active clinical & support departments per hospital';
comment on table public.hospital_members is 'Unified staff/doctor credentials for Hospital & Doctor apps';
