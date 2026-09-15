-- 1. Create invoices / billing table
CREATE TABLE IF NOT EXISTS public.billing_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE,
  hospital_id TEXT NOT NULL DEFAULT 'HOSP-01',
  uhid TEXT NOT NULL,
  patient_name TEXT NOT NULL,
  doctor_id TEXT,
  doctor_name TEXT,
  consultation_fee NUMERIC(10, 2) NOT NULL DEFAULT 500.00,
  medicines JSONB DEFAULT '[]'::jsonb,
  medicines_total NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  total_amount NUMERIC(10, 2) NOT NULL DEFAULT 500.00,
  payment_status TEXT NOT NULL DEFAULT 'pending_payment',
  payment_method TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  paid_at TIMESTAMPTZ
);

-- 2. Add billing helper columns to appointments
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS billing_status TEXT DEFAULT 'unbilled';

-- 3. Open RLS Policies
ALTER TABLE public.billing_invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow_all_billing_ops" ON public.billing_invoices;
CREATE POLICY "allow_all_billing_ops"
ON public.billing_invoices
FOR ALL
TO public, anon, authenticated, service_role
USING (true)
WITH CHECK (true);

GRANT ALL ON public.billing_invoices TO anon, authenticated, service_role;

-- 4. Enable Realtime on billing_invoices
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'billing_invoices'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.billing_invoices;
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
