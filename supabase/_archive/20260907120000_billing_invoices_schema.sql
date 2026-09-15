-- Safe idempotent migration for public.billing_invoices
-- Run in Supabase SQL Editor or via supabase db push. Safe to re-run.

CREATE TABLE IF NOT EXISTS public.billing_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);

ALTER TABLE public.billing_invoices
  ADD COLUMN IF NOT EXISTS invoice_number TEXT,
  ADD COLUMN IF NOT EXISTS hospital_id TEXT NOT NULL DEFAULT 'HOSP-01',
  ADD COLUMN IF NOT EXISTS patient_uhid TEXT,
  ADD COLUMN IF NOT EXISTS patient_name TEXT,
  ADD COLUMN IF NOT EXISTS appointment_id UUID,
  ADD COLUMN IF NOT EXISTS doctor_name TEXT,
  ADD COLUMN IF NOT EXISTS department TEXT,
  ADD COLUMN IF NOT EXISTS booking_source TEXT DEFAULT 'APP',
  ADD COLUMN IF NOT EXISTS consultation_fee NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS medicine_fee NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS gst_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS total_payable NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS payment_method TEXT,
  ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'unpaid',
  ADD COLUMN IF NOT EXISTS prescribed_items JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS is_sent_to_app BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Legacy columns retained for backward compatibility with existing app code
ALTER TABLE public.billing_invoices
  ADD COLUMN IF NOT EXISTS uhid TEXT,
  ADD COLUMN IF NOT EXISTS doctor_id TEXT,
  ADD COLUMN IF NOT EXISTS medicines JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS medicines_total NUMERIC(10, 2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS total_amount NUMERIC(10, 2) DEFAULT 0.00;

UPDATE public.billing_invoices
SET patient_uhid = COALESCE(patient_uhid, uhid, 'UHID-' || UPPER(SUBSTRING(id::text, 1, 8)))
WHERE patient_uhid IS NULL;

UPDATE public.billing_invoices
SET uhid = COALESCE(uhid, patient_uhid)
WHERE uhid IS NULL AND patient_uhid IS NOT NULL;

UPDATE public.billing_invoices
SET total_payable = COALESCE(NULLIF(total_payable, 0), total_amount, consultation_fee, 0)
WHERE total_payable IS NULL OR total_payable = 0;

ALTER TABLE public.billing_invoices
  ALTER COLUMN patient_uhid SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_billing_uhid_status
  ON public.billing_invoices (patient_uhid, payment_status);

CREATE INDEX IF NOT EXISTS idx_billing_hosp_date
  ON public.billing_invoices (hospital_id, created_at DESC);

ALTER TABLE public.billing_invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "open_billing_invoices" ON public.billing_invoices;
CREATE POLICY "open_billing_invoices" ON public.billing_invoices
  FOR ALL USING (true) WITH CHECK (true);

GRANT ALL ON public.billing_invoices TO anon, authenticated, service_role;

NOTIFY pgrst, 'reload schema';
