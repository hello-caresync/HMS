-- Nexora Hospital App · Step 2–3 core tables (run in Supabase SQL editor)

create table if not exists public.patients (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  uhid text not null,
  department text,
  phone text,
  status text not null default 'Active',
  module_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.admissions (
  id uuid primary key default gen_random_uuid(),
  patient_name text not null,
  uhid text,
  ward text,
  department text,
  status text not null default 'Admitted',
  module_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  token text not null,
  patient_name text not null,
  department text not null,
  provider text,
  scheduled_time text,
  location text,
  status text not null default 'Confirmed',
  channels jsonb default '{"sms":true,"email":false,"whatsapp":false}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.billing_invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_number text not null,
  patient_name text not null,
  department text,
  amount numeric not null default 0,
  tax_amount numeric not null default 0,
  total_amount numeric not null default 0,
  status text not null default 'Submitted',
  module_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.staff (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  role_title text,
  department text,
  status text not null default 'Active',
  module_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_patients_module on public.patients (module_id);
create index if not exists idx_admissions_module on public.admissions (module_id);
create index if not exists idx_billing_module on public.billing_invoices (module_id);
create index if not exists idx_staff_module on public.staff (module_id);

alter table public.patients enable row level security;
alter table public.admissions enable row level security;
alter table public.appointments enable row level security;
alter table public.billing_invoices enable row level security;
alter table public.staff enable row level security;

drop policy if exists "hospital_patients_anon_all" on public.patients;
create policy "hospital_patients_anon_all" on public.patients for all using (true) with check (true);

drop policy if exists "hospital_admissions_anon_all" on public.admissions;
create policy "hospital_admissions_anon_all" on public.admissions for all using (true) with check (true);

drop policy if exists "hospital_appointments_anon_all" on public.appointments;
create policy "hospital_appointments_anon_all" on public.appointments for all using (true) with check (true);

drop policy if exists "hospital_billing_anon_all" on public.billing_invoices;
create policy "hospital_billing_anon_all" on public.billing_invoices for all using (true) with check (true);

drop policy if exists "hospital_staff_anon_all" on public.staff;
create policy "hospital_staff_anon_all" on public.staff for all using (true) with check (true);

-- Step 3 extensions (safe to re-run)
alter table public.admissions add column if not exists doctor_name text;
alter table public.admissions add column if not exists bed_number text;
alter table public.admissions add column if not exists discharge_date timestamptz;

alter table public.billing_invoices add column if not exists paid_amount numeric not null default 0;
alter table public.billing_invoices add column if not exists payment_status text not null default 'Unpaid';

create table if not exists public.pharmacy_inventory (
  id uuid primary key default gen_random_uuid(),
  sku text not null,
  item_name text not null,
  category text,
  quantity_in_stock numeric not null default 0,
  reorder_level numeric not null default 10,
  status text not null default 'In Stock',
  module_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_pharmacy_module on public.pharmacy_inventory (module_id);

alter table public.pharmacy_inventory enable row level security;

drop policy if exists "hospital_pharmacy_anon_all" on public.pharmacy_inventory;
create policy "hospital_pharmacy_anon_all" on public.pharmacy_inventory for all using (true) with check (true);
