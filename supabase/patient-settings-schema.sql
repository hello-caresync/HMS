-- Patient App · Settings workspace (profiles, facilities, family)
-- Run in Supabase SQL Editor · enable Realtime optional

create table if not exists public.patient_profiles (
  id uuid primary key default gen_random_uuid(),
  patient_id text unique not null,
  full_name text not null,
  email text not null,
  phone text,
  date_of_birth date,
  gender text,
  blood_group text,
  street_address text,
  city text,
  pincode text,
  emergency_contact_name text,
  emergency_contact_phone text,
  known_allergies text,
  chronic_conditions text,
  preferred_hospital_id uuid,
  updated_at timestamptz not null default now()
);

create table if not exists public.hospitals_and_clinics (
  id uuid primary key default gen_random_uuid(),
  facility_name text not null,
  facility_type text not null check (facility_type in ('hospital', 'clinic')),
  address text not null,
  city text not null,
  area_pincode text not null,
  latitude numeric,
  longitude numeric,
  distance_km numeric,
  created_at timestamptz not null default now()
);

create index if not exists idx_facilities_pincode on public.hospitals_and_clinics (area_pincode);
create index if not exists idx_facilities_city on public.hospitals_and_clinics (city);

alter table public.patient_profiles
  drop constraint if exists patient_profiles_preferred_hospital_id_fkey;
alter table public.patient_profiles
  add constraint patient_profiles_preferred_hospital_id_fkey
  foreign key (preferred_hospital_id) references public.hospitals_and_clinics (id) on delete set null;

create table if not exists public.patient_family_members (
  id uuid primary key default gen_random_uuid(),
  primary_patient_id text not null,
  full_name text not null,
  relationship text not null,
  date_of_birth date,
  gender text,
  blood_group text,
  medical_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_family_primary on public.patient_family_members (primary_patient_id);

alter table public.patient_profiles enable row level security;
alter table public.hospitals_and_clinics enable row level security;
alter table public.patient_family_members enable row level security;

drop policy if exists "patient_profiles_anon" on public.patient_profiles;
create policy "patient_profiles_anon"
  on public.patient_profiles for all using (true) with check (true);

drop policy if exists "facilities_anon_read" on public.hospitals_and_clinics;
create policy "facilities_anon_read"
  on public.hospitals_and_clinics for select using (true);

drop policy if exists "family_anon" on public.patient_family_members;
create policy "family_anon"
  on public.patient_family_members for all using (true) with check (true);

-- Demo patient profile
insert into public.patient_profiles (
  patient_id, full_name, email, phone, date_of_birth, gender, blood_group,
  street_address, city, pincode,
  emergency_contact_name, emergency_contact_phone,
  known_allergies, chronic_conditions
) values (
  'pat-v0-9021',
  'Aishwarya D S',
  'patient@nexora.com',
  '+91 98765 43210',
  '1992-03-15',
  'Female',
  'B+',
  '42 Healthcare Avenue, Block A',
  'Kochi',
  '682016',
  'R. Srinivasan',
  '+91 97654 32109',
  'Penicillin',
  'Mild asthma (seasonal)'
) on conflict (patient_id) do update set
  full_name = excluded.full_name,
  email = excluded.email,
  phone = excluded.phone,
  updated_at = now();

insert into public.hospitals_and_clinics (
  id, facility_name, facility_type, address, city, area_pincode, distance_km
) values
  (
    'a1000000-0000-4000-a000-000000000001',
    'Nexora Main Campus Hospital',
    'hospital',
    '42 Healthcare Avenue, Block A',
    'Kochi',
    '682016',
    1.2
  ),
  (
    'a1000000-0000-4000-a000-000000000002',
    'Nexora City Centre Clinic',
    'clinic',
    '18 MG Road, Level 3',
    'Kochi',
    '682016',
    1.8
  ),
  (
    'a1000000-0000-4000-a000-000000000003',
    'Lakeside Multi-Specialty Hospital',
    'hospital',
    '7 Wellness Park Road',
    'Ernakulam',
    '682030',
    3.4
  ),
  (
    'a1000000-0000-4000-a000-000000000004',
    'Green Valley Family Clinic',
    'clinic',
    '22 Park Lane, Edapally',
    'Kochi',
    '682024',
    2.6
  ),
  (
    'a1000000-0000-4000-a000-000000000005',
    'Metro Heart & Care Hospital',
    'hospital',
    '5 NH Bypass, Palarivattom',
    'Kochi',
    '682025',
    4.1
  ),
  (
    'a1000000-0000-4000-a000-000000000006',
    'Sunrise Primary Care Clinic',
    'clinic',
    '11 Temple Road, Fort Kochi',
    'Kochi',
    '682001',
    5.2
  )
on conflict (id) do nothing;

insert into public.patient_family_members (
  id, primary_patient_id, full_name, relationship, date_of_birth, gender, blood_group, medical_notes
) values
  (
    'b2000000-0000-4000-a000-000000000001',
    'pat-v0-9021',
    'Riya Srinivasan',
    'Child',
    '2018-06-12',
    'Female',
    'O+',
    'No known allergies'
  ),
  (
    'b2000000-0000-4000-a000-000000000002',
    'pat-v0-9021',
    'R. Srinivasan',
    'Father',
    '1965-11-03',
    'Male',
    'A+',
    'Type 2 diabetes — managed with medication'
  )
on conflict (id) do nothing;
