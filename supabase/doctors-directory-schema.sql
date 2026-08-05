-- Patient App · Doctors directory (Supabase SQL editor)

create table if not exists public.doctors (
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
  photo_initials text,
  room_number text,
  token_prefix text,
  avg_consult_minutes int default 12,
  branch_id text,
  slots text[] default '{}',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_doctors_active on public.doctors (is_active, department);

alter table public.doctors enable row level security;

drop policy if exists "doctors_anon_read" on public.doctors;
create policy "doctors_anon_read"
  on public.doctors for select using (true);

drop policy if exists "doctors_anon_write" on public.doctors;
create policy "doctors_anon_write"
  on public.doctors for all using (true) with check (true);

insert into public.doctors (
  id, name, email, department, specialization, experience, languages,
  rating, review_count, available_today, consultation_fee, bio,
  photo_initials, room_number, token_prefix, avg_consult_minutes, branch_id, slots, is_active
) values
  (
    '00000000-0000-4000-a000-000000000101',
    'Dr. Aishwarya D S', 'hospital@curasync.com', 'General Medicine',
    'Internal Medicine · General Physician', '12 years',
    array['English','Hindi','Malayalam'], 4.8, 214, true, 800,
    'Primary care physician specializing in chronic disease management and preventive health.',
    'AD', 'Room 2', 'GEN', 10, 'branch-main',
    array['09:00','09:30','10:00','11:00','14:00','15:30','16:00'], true
  ),
  (
    '00000000-0000-4000-a000-000000000102',
    'Dr. Rajesh Kumar', 'doctor@nexora.com', 'Cardiology',
    'Cardiology · Interventional', '18 years',
    array['English','Hindi','Tamil'], 4.9, 328, true, 1200,
    'Interventional cardiologist with expertise in hypertension, heart failure, and lipid disorders.',
    'RK', 'Room 4', 'CARD', 15, 'branch-main',
    array['10:00','10:30','11:30','15:00','16:30'], true
  ),
  (
    '00000000-0000-4000-a000-000000000103',
    'Dr. Meera Iyer', 'ortho@nexora.com', 'Orthopedics',
    'Orthopedic Surgery · Trauma', '15 years',
    array['English','Hindi'], 4.7, 156, false, 1000,
    'Orthopedic surgeon focused on sports injuries, joint care, and fracture management.',
    'MI', 'Room 6', 'ORT', 14, 'branch-city',
    array['09:30','11:00','14:30'], true
  ),
  (
    '00000000-0000-4000-a000-000000000104',
    'Dr. Priya Menon', 'pediatric@nexora.com', 'Pediatrics',
    'Pediatrics · Neonatology', '10 years',
    array['English','Malayalam'], 4.9, 189, true, 700,
    'Pediatrician providing comprehensive child health, vaccination, and growth monitoring.',
    'PM', 'Room 1', 'PED', 11, 'branch-north',
    array['09:00','10:30','11:30','15:00','16:00'], true
  )
on conflict (id) do update set
  available_today = excluded.available_today,
  rating = excluded.rating,
  review_count = excluded.review_count,
  updated_at = now();

-- Enable Realtime: add `doctors` to supabase_realtime publication
