BEGIN;

-- Canonical staff & billing schema (Phase 4 consolidation)
-- Sources:
--   hospital_staff → migrations/20260907140000_hospital_staff_schema.sql
--   billing_invoices → migrations/20260907120000_billing_invoices_schema.sql
-- Safe on existing databases: CREATE TABLE IF NOT EXISTS + ADD COLUMN IF NOT EXISTS per column.

-- ============================================================================
-- hospital_staff
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.hospital_staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id TEXT UNIQUE,
  staff_id_code TEXT,
  passcode_key TEXT,
  hospital_id UUID NOT NULL DEFAULT '11111111-1111-1111-1111-111111111111'
    REFERENCES public.hospitals(id),
  hospital_code TEXT NOT NULL DEFAULT 'HOSP-01',
  full_name TEXT NOT NULL,
  email TEXT UNIQUE,
  phone TEXT,
  department TEXT NOT NULL DEFAULT 'Operations',
  role TEXT NOT NULL DEFAULT 'Staff',
  qualification TEXT,
  consultation_fee NUMERIC(10, 2) DEFAULT 500.00,
  access_level TEXT DEFAULT 'standard',
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_active_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.hospital_staff ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid();
ALTER TABLE public.hospital_staff ADD COLUMN IF NOT EXISTS employee_id TEXT;
ALTER TABLE public.hospital_staff ADD COLUMN IF NOT EXISTS staff_id_code TEXT;
ALTER TABLE public.hospital_staff ADD COLUMN IF NOT EXISTS passcode_key TEXT;
ALTER TABLE public.hospital_staff ADD COLUMN IF NOT EXISTS hospital_id UUID NOT NULL DEFAULT '11111111-1111-1111-1111-111111111111';
ALTER TABLE public.hospital_staff ADD COLUMN IF NOT EXISTS hospital_code TEXT NOT NULL DEFAULT 'HOSP-01';
ALTER TABLE public.hospital_staff ADD COLUMN IF NOT EXISTS full_name TEXT NOT NULL DEFAULT 'Unknown Staff';
ALTER TABLE public.hospital_staff ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.hospital_staff ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.hospital_staff ADD COLUMN IF NOT EXISTS department TEXT NOT NULL DEFAULT 'Operations';
ALTER TABLE public.hospital_staff ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'Staff';
ALTER TABLE public.hospital_staff ADD COLUMN IF NOT EXISTS qualification TEXT;
ALTER TABLE public.hospital_staff ADD COLUMN IF NOT EXISTS consultation_fee NUMERIC(10, 2) DEFAULT 500.00;
ALTER TABLE public.hospital_staff ADD COLUMN IF NOT EXISTS access_level TEXT DEFAULT 'standard';
ALTER TABLE public.hospital_staff ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.hospital_staff ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ;
ALTER TABLE public.hospital_staff ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE public.hospital_staff ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE UNIQUE INDEX IF NOT EXISTS idx_hospital_staff_employee_id
  ON public.hospital_staff (employee_id)
  WHERE employee_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_hospital_staff_hospital_code
  ON public.hospital_staff (hospital_code, department);

-- ============================================================================
-- billing_invoices
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.billing_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT,
  hospital_id UUID NOT NULL DEFAULT '11111111-1111-1111-1111-111111111111'
    REFERENCES public.hospitals(id),
  hospital_code TEXT NOT NULL DEFAULT 'HOSP-01',
  patient_uhid TEXT NOT NULL,
  patient_name TEXT,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  doctor_name TEXT,
  doctor_id TEXT,
  department TEXT,
  booking_source TEXT DEFAULT 'APP',
  consultation_fee NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  medicine_fee NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  gst_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  discount_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  total_payable NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  payment_method TEXT,
  payment_status TEXT NOT NULL DEFAULT 'unpaid',
  prescribed_items JSONB DEFAULT '[]'::jsonb,
  is_sent_to_app BOOLEAN DEFAULT false,
  paid_at TIMESTAMPTZ,
  uhid TEXT,
  medicines JSONB DEFAULT '[]'::jsonb,
  medicines_total NUMERIC(10, 2) DEFAULT 0.00,
  total_amount NUMERIC(10, 2) DEFAULT 0.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.billing_invoices ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid();
ALTER TABLE public.billing_invoices ADD COLUMN IF NOT EXISTS invoice_number TEXT;
ALTER TABLE public.billing_invoices ADD COLUMN IF NOT EXISTS hospital_id UUID NOT NULL DEFAULT '11111111-1111-1111-1111-111111111111';
ALTER TABLE public.billing_invoices ADD COLUMN IF NOT EXISTS hospital_code TEXT NOT NULL DEFAULT 'HOSP-01';
ALTER TABLE public.billing_invoices ADD COLUMN IF NOT EXISTS patient_uhid TEXT NOT NULL DEFAULT 'UNKNOWN';
ALTER TABLE public.billing_invoices ADD COLUMN IF NOT EXISTS patient_name TEXT;
ALTER TABLE public.billing_invoices ADD COLUMN IF NOT EXISTS appointment_id UUID;
ALTER TABLE public.billing_invoices ADD COLUMN IF NOT EXISTS doctor_name TEXT;
ALTER TABLE public.billing_invoices ADD COLUMN IF NOT EXISTS doctor_id TEXT;
ALTER TABLE public.billing_invoices ADD COLUMN IF NOT EXISTS department TEXT;
ALTER TABLE public.billing_invoices ADD COLUMN IF NOT EXISTS booking_source TEXT DEFAULT 'APP';
ALTER TABLE public.billing_invoices ADD COLUMN IF NOT EXISTS consultation_fee NUMERIC(10, 2) NOT NULL DEFAULT 0.00;
ALTER TABLE public.billing_invoices ADD COLUMN IF NOT EXISTS medicine_fee NUMERIC(10, 2) NOT NULL DEFAULT 0.00;
ALTER TABLE public.billing_invoices ADD COLUMN IF NOT EXISTS gst_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00;
ALTER TABLE public.billing_invoices ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00;
ALTER TABLE public.billing_invoices ADD COLUMN IF NOT EXISTS total_payable NUMERIC(10, 2) NOT NULL DEFAULT 0.00;
ALTER TABLE public.billing_invoices ADD COLUMN IF NOT EXISTS payment_method TEXT;
ALTER TABLE public.billing_invoices ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'unpaid';
ALTER TABLE public.billing_invoices ADD COLUMN IF NOT EXISTS prescribed_items JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.billing_invoices ADD COLUMN IF NOT EXISTS is_sent_to_app BOOLEAN DEFAULT false;
ALTER TABLE public.billing_invoices ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;
ALTER TABLE public.billing_invoices ADD COLUMN IF NOT EXISTS uhid TEXT;
ALTER TABLE public.billing_invoices ADD COLUMN IF NOT EXISTS medicines JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.billing_invoices ADD COLUMN IF NOT EXISTS medicines_total NUMERIC(10, 2) DEFAULT 0.00;
ALTER TABLE public.billing_invoices ADD COLUMN IF NOT EXISTS total_amount NUMERIC(10, 2) DEFAULT 0.00;
ALTER TABLE public.billing_invoices ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE public.billing_invoices ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_billing_uhid_status
  ON public.billing_invoices (patient_uhid, payment_status);

CREATE INDEX IF NOT EXISTS idx_billing_hosp_date
  ON public.billing_invoices (hospital_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_billing_appointment
  ON public.billing_invoices (appointment_id);

COMMIT;
