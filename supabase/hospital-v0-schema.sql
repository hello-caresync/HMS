-- Nexora Hospital App V0 · production schema (run after hospital-schema.sql + cross-app-realtime-schema.sql)

-- Extend patients table
alter table public.patients
  add column if not exists first_name text,
  add column if not exists last_name text,
  add column if not exists age int,
  add column if not exists gender text,
  add column if not exists blood_group text,
  add column if not exists medical_history text,
  add column if not exists emergency_contact text,
  add column if not exists insurance_provider text,
  add column if not exists patient_id text;

-- Extend staff table
alter table public.staff
  add column if not exists first_name text,
  add column if not exists last_name text,
  add column if not exists role text,
  add column if not exists email text,
  add column if not exists consultation_fee numeric default 0;

-- Extend appointments (may already exist from cross-app schema)
alter table public.appointments
  add column if not exists appointment_date date,
  add column if not exists time_slot time,
  add column if not exists patient_id text,
  add column if not exists doctor_id text;

-- OPD live queue
create table if not exists public.opd_visits (
  id uuid primary key default gen_random_uuid(),
  patient_id text not null,
  patient_name text not null,
  doctor_id text,
  doctor_name text,
  queue_number text not null,
  department text not null default 'General',
  status text not null default 'Waiting',
  appointment_id text,
  checked_in_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_opd_status on public.opd_visits (status, created_at desc);

-- Admissions (extend if using legacy admissions table)
alter table public.admissions
  add column if not exists patient_id text,
  add column if not exists attending_doctor_id text,
  add column if not exists attending_doctor_name text,
  add column if not exists ward_number text,
  add column if not exists bed_number text,
  add column if not exists diagnosis text;

-- Billing invoices
alter table public.billing_invoices
  add column if not exists patient_id text,
  add column if not exists line_items jsonb default '[]'::jsonb;

-- Pharmacy inventory
alter table public.pharmacy_inventory
  add column if not exists unit_price numeric default 0;

-- Vendors
create table if not exists public.vendors (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  contact_person text,
  email text,
  phone text,
  rating numeric default 4.0,
  created_at timestamptz not null default now()
);

-- Purchase orders
create table if not exists public.purchase_orders (
  id uuid primary key default gen_random_uuid(),
  vendor_id text not null,
  vendor_name text,
  item_details text not null,
  status text not null default 'Draft',
  total_cost numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_po_vendor on public.purchase_orders (vendor_id, status);

-- Hospital notifications extensions
alter table public.notifications
  add column if not exists recipient_role text default 'hospital',
  add column if not exists message text,
  add column if not exists severity text default 'info',
  add column if not exists read_status boolean default false;

-- RLS (dev permissive)
alter table public.opd_visits enable row level security;
alter table public.vendors enable row level security;
alter table public.purchase_orders enable row level security;

drop policy if exists "opd_visits_anon_all" on public.opd_visits;
create policy "opd_visits_anon_all" on public.opd_visits for all using (true) with check (true);

drop policy if exists "vendors_anon_all" on public.vendors;
create policy "vendors_anon_all" on public.vendors for all using (true) with check (true);

drop policy if exists "purchase_orders_anon_all" on public.purchase_orders;
create policy "purchase_orders_anon_all" on public.purchase_orders for all using (true) with check (true);

-- Realtime publication (Dashboard → Database → Publications → supabase_realtime):
--   appointments, opd_visits, ecosystem_appointments, purchase_orders,
--   pharmacy_inventory, billing_invoices, invoices, notifications
