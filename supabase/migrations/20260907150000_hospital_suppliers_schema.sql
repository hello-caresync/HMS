-- Vendor & supplier credential directory (HOSP-01)
CREATE TABLE IF NOT EXISTS public.hospital_suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id TEXT NOT NULL DEFAULT 'HOSP-01',
  vendor_code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  contact_person TEXT,
  phone TEXT,
  email TEXT,
  category TEXT DEFAULT 'Pharmaceuticals',
  access_pin TEXT DEFAULT '1234',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.hospital_suppliers ADD COLUMN IF NOT EXISTS hospital_id TEXT DEFAULT 'HOSP-01';
ALTER TABLE public.hospital_suppliers ADD COLUMN IF NOT EXISTS vendor_code TEXT;
ALTER TABLE public.hospital_suppliers ADD COLUMN IF NOT EXISTS contact_person TEXT;
ALTER TABLE public.hospital_suppliers ADD COLUMN IF NOT EXISTS access_pin TEXT DEFAULT '1234';
ALTER TABLE public.hospital_suppliers ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE public.hospital_suppliers ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE public.hospital_suppliers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow_all_suppliers" ON public.hospital_suppliers;
CREATE POLICY "allow_all_suppliers" ON public.hospital_suppliers
  FOR ALL USING (true) WITH CHECK (true);

GRANT ALL ON public.hospital_suppliers TO anon, authenticated, service_role;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'hospital_suppliers'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.hospital_suppliers;
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
