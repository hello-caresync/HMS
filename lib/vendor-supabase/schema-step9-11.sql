-- Nexora Vendor App · Step 9+ tables (run in Supabase SQL editor if not present)

create table if not exists public.compliance_documents (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendors (id) on delete cascade,
  document_type text not null,
  registration_number text,
  expiry_date date,
  file_url text,
  status text not null default 'PENDING_REVIEW',
  created_at timestamptz not null default now()
);

create table if not exists public.vendor_contracts (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendors (id) on delete cascade,
  title text not null,
  hospital_name text not null,
  effective_date date not null,
  expiry_date date not null,
  status text not null default 'Active',
  pdf_url text,
  terms_url text,
  created_at timestamptz not null default now()
);

-- Optional vendor score columns for analytics dashboard
alter table public.vendors
  add column if not exists compliance_status text,
  add column if not exists performance_rating numeric,
  add column if not exists on_time_delivery_pct numeric;

-- Quotations, product specs, FSR fields, meeting requests (vendor portal buttons)
create table if not exists public.quotations (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendors (id) on delete cascade,
  rfq_id text,
  total_amount numeric not null default 0,
  notes text,
  created_at timestamptz not null default now()
);

alter table public.products
  add column if not exists spec_title text,
  add column if not exists spec_text text,
  add column if not exists spec_file_url text;

alter table public.service_tickets
  add column if not exists resolution_details text,
  add column if not exists fsr_file_url text;

alter table public.invoices
  add column if not exists file_url text;

create table if not exists public.vendor_meeting_requests (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendors (id) on delete cascade,
  channel text not null,
  subject text not null,
  scheduled_at timestamptz not null,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.vendor_messages (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendors (id) on delete cascade,
  channel text not null default 'Procurement',
  subject text not null,
  body text not null,
  created_at timestamptz not null default now()
);
