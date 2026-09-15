-- Doctors & Staff directory (HOSP-01)
-- Apply in Supabase SQL Editor. Adds required columns, RLS, realtime,
-- and clears placeholder HOSP-01 rows so the live directory starts empty.

CREATE TABLE IF NOT EXISTS public.hospital_staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id TEXT NOT NULL DEFAULT 'HOSP-01',
  staff_id_code TEXT,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE,
  passcode_key TEXT,
  role TEXT NOT NULL DEFAULT 'doctor',
  department TEXT,
  qualification TEXT,
  consultation_fee NUMERIC(10, 2) NOT NULL DEFAULT 500.00,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.hospital_staff ADD COLUMN IF NOT EXISTS staff_id_code TEXT;
ALTER TABLE public.hospital_staff ADD COLUMN IF NOT EXISTS passcode_key TEXT;
ALTER TABLE public.hospital_staff ADD COLUMN IF NOT EXISTS qualification TEXT;
ALTER TABLE public.hospital_staff ADD COLUMN IF NOT EXISTS consultation_fee NUMERIC(10, 2) DEFAULT 500.00;
ALTER TABLE public.hospital_staff ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE public.hospital_staff ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE public.hospital_staff ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow_read_staff" ON public.hospital_staff;
CREATE POLICY "allow_read_staff" ON public.hospital_staff FOR SELECT USING (true);

DROP POLICY IF EXISTS "allow_all_staff_admin" ON public.hospital_staff;
CREATE POLICY "allow_all_staff_admin" ON public.hospital_staff FOR ALL USING (true) WITH CHECK (true);

GRANT ALL ON public.hospital_staff TO anon, authenticated, service_role;

DELETE FROM public.hospital_staff WHERE hospital_id = 'HOSP-01';

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'hospital_staff'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.hospital_staff;
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
