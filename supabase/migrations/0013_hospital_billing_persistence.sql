-- Walk-in billing persistence: hospital_invoices + billing_invoices checkout queue
-- Safe to re-run (IF NOT EXISTS / ADD COLUMN IF NOT EXISTS).

CREATE TABLE IF NOT EXISTS public.hospital_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id TEXT NOT NULL,
  patient_uhid TEXT NOT NULL,
  patient_name TEXT NOT NULL,
  doctor_name TEXT NOT NULL,
  department TEXT NOT NULL,
  service_type TEXT DEFAULT 'OPD Consultation',
  amount NUMERIC NOT NULL,
  payment_status TEXT DEFAULT 'PENDING',
  appointment_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.hospital_invoices
  ADD COLUMN IF NOT EXISTS appointment_id UUID,
  ADD COLUMN IF NOT EXISTS token_number TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'PENDING';

CREATE INDEX IF NOT EXISTS idx_hospital_invoices_hosp_status
  ON public.hospital_invoices (hospital_id, payment_status, created_at DESC);

CREATE TABLE IF NOT EXISTS public.billing_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);

ALTER TABLE public.billing_invoices
  ADD COLUMN IF NOT EXISTS invoice_number TEXT,
  ADD COLUMN IF NOT EXISTS hospital_id TEXT NOT NULL DEFAULT 'HOSP-01',
  ADD COLUMN IF NOT EXISTS patient_uhid TEXT,
  ADD COLUMN IF NOT EXISTS patient_name TEXT,
  ADD COLUMN IF NOT EXISTS appointment_id UUID,
  ADD COLUMN IF NOT EXISTS doctor_id TEXT,
  ADD COLUMN IF NOT EXISTS doctor_name TEXT,
  ADD COLUMN IF NOT EXISTS department TEXT,
  ADD COLUMN IF NOT EXISTS booking_source TEXT DEFAULT 'APP',
  ADD COLUMN IF NOT EXISTS consultation_fee NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS medicine_fee NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS gst_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS total_payable NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS total_amount NUMERIC(10, 2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS uhid TEXT,
  ADD COLUMN IF NOT EXISTS medicines JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS medicines_total NUMERIC(10, 2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS payment_method TEXT,
  ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'unpaid',
  ADD COLUMN IF NOT EXISTS prescribed_items JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS is_sent_to_app BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_billing_invoices_hosp_date
  ON public.billing_invoices (hospital_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_billing_invoices_appointment
  ON public.billing_invoices (appointment_id)
  WHERE appointment_id IS NOT NULL;

ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS billing_status TEXT;
