-- Post-consultation billing bridge for Regal Hospital (RH-BLR-01)
-- Run in Supabase SQL Editor. Safe to re-run.

alter table public.billing_invoices
  add column if not exists appointment_id text,
  add column if not exists patient_uhid text,
  add column if not exists doctor_id text,
  add column if not exists doctor_name text,
  add column if not exists hospital_id uuid,
  add column if not exists facility_code text default 'RH-BLR-01',
  add column if not exists bill_type text default 'opd_consultation',
  add column if not exists payment_mode text,
  add column if not exists payment_reference text,
  add column if not exists lines jsonb default '[]'::jsonb;

create index if not exists idx_billing_appointment on public.billing_invoices (appointment_id);
create index if not exists idx_billing_patient on public.billing_invoices (patient_id);
create index if not exists idx_billing_facility on public.billing_invoices (facility_code, created_at desc);

-- Enable Realtime: Dashboard → Database → Publications → supabase_realtime → billing_invoices
