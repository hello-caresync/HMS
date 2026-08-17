-- Regal Hospital Admin Hub · doctor_profiles + inventory_items
-- Run in Supabase SQL Editor. Safe to re-run.

create table if not exists public.doctor_profiles (
  id varchar(50) primary key,
  name varchar(150) not null,
  email varchar(150) unique not null,
  password_hash varchar(255) not null,
  department varchar(100) not null,
  room varchar(50) not null,
  fee numeric not null,
  is_on_duty boolean default true,
  created_at timestamptz default now()
);

create table if not exists public.inventory_items (
  id uuid primary key default gen_random_uuid(),
  item_name text not null,
  category text not null default 'Medicine',
  quantity_in_stock numeric not null default 0,
  reorder_level numeric not null default 10,
  unit_price numeric not null default 0,
  vendor_name text,
  item_code text,
  facility_code text default 'RH-BLR-01',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_inventory_items_facility on public.inventory_items (facility_code, created_at desc);
create index if not exists idx_doctor_profiles_email on public.doctor_profiles (email);

alter table public.doctor_profiles enable row level security;
alter table public.inventory_items enable row level security;

drop policy if exists "doctor_profiles_anon_all" on public.doctor_profiles;
create policy "doctor_profiles_anon_all" on public.doctor_profiles for all using (true) with check (true);

drop policy if exists "inventory_items_anon_all" on public.inventory_items;
create policy "inventory_items_anon_all" on public.inventory_items for all using (true) with check (true);

-- Seed 41 Regal Hospital clinicians (test password: RegalDoc@2026)
insert into public.doctor_profiles (id, name, email, password_hash, department, room, fee)
values
  ('RH-D01', 'Dr. Suriraju V', 'suriraju.v@regalhospital.com', 'RegalDoc@2026', 'Urology', 'Room 101', 700),
  ('RH-D02', 'Dr. Chandrakanth S. Kesari', 'chandrakanth.kesari@regalhospital.com', 'RegalDoc@2026', 'General Surgery', 'Room 204', 800),
  ('RH-D03', 'Dr. Ananya R', 'ananya.r@regalhospital.com', 'RegalDoc@2026', 'General Medicine', 'Room 102', 600),
  ('RH-D04', 'Dr. Vikramaditya Rao', 'vikramaditya.rao@regalhospital.com', 'RegalDoc@2026', 'Cardiology', 'Room 301', 900),
  ('RH-D05', 'Dr. Meera Nambiar', 'meera.nambiar@regalhospital.com', 'RegalDoc@2026', 'Cardiology', 'Room 302', 850),
  ('RH-D06', 'Dr. Rajesh Kumar Hegde', 'rajesh.hegde@regalhospital.com', 'RegalDoc@2026', 'Orthopedics', 'Room 201', 850),
  ('RH-D07', 'Dr. Shalini Deshmukh', 'shalini.deshmukh@regalhospital.com', 'RegalDoc@2026', 'Orthopedics', 'Room 202', 750),
  ('RH-D08', 'Dr. Arvind Swamy', 'arvind.swamy@regalhospital.com', 'RegalDoc@2026', 'Neurology', 'Room 401', 950),
  ('RH-D09', 'Dr. Kavitha Reddy', 'kavitha.reddy@regalhospital.com', 'RegalDoc@2026', 'Neurosurgery', 'Room 402', 1200),
  ('RH-D10', 'Dr. Pradeep Verma', 'pradeep.verma@regalhospital.com', 'RegalDoc@2026', 'Gastroenterology', 'Room 205', 800),
  ('RH-D11', 'Dr. Sunitha Gopal', 'sunitha.gopal@regalhospital.com', 'RegalDoc@2026', 'Gastroenterology', 'Room 206', 750),
  ('RH-D12', 'Dr. Anand Kulkarni', 'anand.kulkarni@regalhospital.com', 'RegalDoc@2026', 'Nephrology', 'Room 105', 850),
  ('RH-D13', 'Dr. Archana Bhat', 'archana.bhat@regalhospital.com', 'RegalDoc@2026', 'Pediatrics', 'Room 108', 650),
  ('RH-D14', 'Dr. Rohan D''Souza', 'rohan.dsouza@regalhospital.com', 'RegalDoc@2026', 'Pediatrics', 'Room 109', 650),
  ('RH-D15', 'Dr. Deepa Shankar', 'deepa.shankar@regalhospital.com', 'RegalDoc@2026', 'Obstetrics & Gynecology', 'Room 210', 800),
  ('RH-D16', 'Dr. Priyanka Murthy', 'priyanka.murthy@regalhospital.com', 'RegalDoc@2026', 'Obstetrics & Gynecology', 'Room 211', 750),
  ('RH-D17', 'Dr. Harish Prasad', 'harish.prasad@regalhospital.com', 'RegalDoc@2026', 'Pulmonology', 'Room 305', 700),
  ('RH-D18', 'Dr. Nandini Sen', 'nandini.sen@regalhospital.com', 'RegalDoc@2026', 'Dermatology', 'Room 112', 600),
  ('RH-D19', 'Dr. Karthik Subramanian', 'karthik.subramanian@regalhospital.com', 'RegalDoc@2026', 'ENT', 'Room 115', 650),
  ('RH-D20', 'Dr. Smita Joshi', 'smita.joshi@regalhospital.com', 'RegalDoc@2026', 'Ophthalmology', 'Room 118', 700),
  ('RH-D21', 'Dr. Manoj Kumar', 'manoj.kumar@regalhospital.com', 'RegalDoc@2026', 'Ophthalmology', 'Room 119', 700),
  ('RH-D22', 'Dr. Sangeetha Iyengar', 'sangeetha.iyengar@regalhospital.com', 'RegalDoc@2026', 'Endocrinology', 'Room 308', 800),
  ('RH-D23', 'Dr. Rakesh Nair', 'rakesh.nair@regalhospital.com', 'RegalDoc@2026', 'Oncology', 'Room 405', 1000),
  ('RH-D24', 'Dr. Gautham Pai', 'gautham.pai@regalhospital.com', 'RegalDoc@2026', 'Oncology', 'Room 406', 1000),
  ('RH-D25', 'Dr. Vani S. Rao', 'vani.rao@regalhospital.com', 'RegalDoc@2026', 'Psychiatry', 'Room 122', 750),
  ('RH-D26', 'Dr. Ashok Patel', 'ashok.patel@regalhospital.com', 'RegalDoc@2026', 'Rheumatology', 'Room 310', 800),
  ('RH-D27', 'Dr. Varun Sundaram', 'varun.sundaram@regalhospital.com', 'RegalDoc@2026', 'Vascular Surgery', 'Room 215', 900),
  ('RH-D28', 'Dr. Rashmi Kulkarni', 'rashmi.kulkarni@regalhospital.com', 'RegalDoc@2026', 'Anaesthesiology', 'OT Wing', 700),
  ('RH-D29', 'Dr. Sumeet Bhalla', 'sumeet.bhalla@regalhospital.com', 'RegalDoc@2026', 'Plastic Surgery', 'Room 218', 1100),
  ('RH-D30', 'Dr. Nithya Srinivas', 'nithya.srinivas@regalhospital.com', 'RegalDoc@2026', 'Pathology', 'Central Lab', 500),
  ('RH-D31', 'Dr. Jayakrishnan Nair', 'jayakrishnan.nair@regalhospital.com', 'RegalDoc@2026', 'Radiology', 'Imaging Block', 600),
  ('RH-D32', 'Dr. Bhavana Shah', 'bhavana.shah@regalhospital.com', 'RegalDoc@2026', 'Radiology', 'Imaging Block', 600),
  ('RH-D33', 'Dr. Santosh Shetty', 'santosh.shetty@regalhospital.com', 'RegalDoc@2026', 'Emergency Medicine', 'ER Trauma 1', 800),
  ('RH-D34', 'Dr. Madhavi Latha', 'madhavi.latha@regalhospital.com', 'RegalDoc@2026', 'Nuclear Medicine', 'Diagnostic Wing', 900),
  ('RH-D35', 'Dr. Chethan Gowda', 'chethan.gowda@regalhospital.com', 'RegalDoc@2026', 'Physical Medicine & Rehab', 'Rehab Unit', 650),
  ('RH-D36', 'Dr. Anushree Roy', 'anushree.roy@regalhospital.com', 'RegalDoc@2026', 'Clinical Immunology', 'Room 312', 750),
  ('RH-D37', 'Dr. Girish Menon', 'girish.menon@regalhospital.com', 'RegalDoc@2026', 'Cardiothoracic Surgery', 'Room 304', 1300),
  ('RH-D38', 'Dr. Lavanya Krishnan', 'lavanya.krishnan@regalhospital.com', 'RegalDoc@2026', 'Pediatric Surgery', 'Room 110', 850),
  ('RH-D39', 'Dr. Hemanth Kumar', 'hemanth.kumar@regalhospital.com', 'RegalDoc@2026', 'Geriatrics', 'Room 106', 700),
  ('RH-D40', 'Dr. Aparna Nair', 'aparna.nair@regalhospital.com', 'RegalDoc@2026', 'Infectious Diseases', 'Room 104', 750),
  ('RH-D41', 'Dr. Balaji Venkat', 'balaji.venkat@regalhospital.com', 'RegalDoc@2026', 'Pain Management', 'Room 220', 800)
on conflict (id) do nothing;

-- Enable Realtime: inventory_items, doctor_profiles, purchase_orders
