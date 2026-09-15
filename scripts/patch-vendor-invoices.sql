-- Vendor billing invoices (post-delivery settlement workflow)
create table if not exists public.vendor_invoices (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid,
  po_id uuid,
  po_number text,
  hospital_id text,
  hospital_name text,
  item_description text,
  invoice_number text not null,
  subtotal numeric not null default 0,
  tax_amount numeric not null default 0,
  total_amount numeric not null default 0,
  payment_status text not null default 'AWAITING_SETTLEMENT',
  due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  payment_reference text,
  payment_method text,
  settled_at timestamptz
);

alter table public.vendor_invoices add column if not exists payment_reference text;
alter table public.vendor_invoices add column if not exists payment_method text;
alter table public.vendor_invoices add column if not exists settled_at timestamptz;

create index if not exists idx_vendor_invoices_vendor_id on public.vendor_invoices (vendor_id);
create index if not exists idx_vendor_invoices_po_id on public.vendor_invoices (po_id);
create index if not exists idx_vendor_invoices_payment_status on public.vendor_invoices (payment_status);

alter table public.vendor_invoices enable row level security;

drop policy if exists vendor_invoices_anon_all on public.vendor_invoices;
create policy vendor_invoices_anon_all on public.vendor_invoices
  for all using (true) with check (true);
