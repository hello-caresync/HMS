-- Hospital staff identity & access governance schema (HOSP-01)
-- Run in Supabase SQL Editor or via migration tooling.

CREATE TABLE IF NOT EXISTS public.hospital_staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id TEXT UNIQUE,
  hospital_id TEXT NOT NULL DEFAULT 'HOSP-01',
  full_name TEXT NOT NULL,
  email TEXT UNIQUE,
  phone TEXT,
  department TEXT NOT NULL DEFAULT 'Operations',
  role TEXT NOT NULL DEFAULT 'Staff',
  consultation_fee NUMERIC(10, 2) DEFAULT 500.00,
  access_level TEXT DEFAULT 'standard',
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_active_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.hospital_staff ADD COLUMN IF NOT EXISTS employee_id TEXT;
ALTER TABLE public.hospital_staff ADD COLUMN IF NOT EXISTS staff_id_code TEXT;
ALTER TABLE public.hospital_staff ADD COLUMN IF NOT EXISTS passcode_key TEXT;
ALTER TABLE public.hospital_staff ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.hospital_staff ADD COLUMN IF NOT EXISTS access_level TEXT DEFAULT 'standard';
ALTER TABLE public.hospital_staff ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ;
ALTER TABLE public.hospital_staff ADD COLUMN IF NOT EXISTS qualification TEXT;
ALTER TABLE public.hospital_staff ADD COLUMN IF NOT EXISTS consultation_fee NUMERIC(10, 2) DEFAULT 500.00;
ALTER TABLE public.hospital_staff ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE public.hospital_staff ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

UPDATE public.hospital_staff
SET employee_id = COALESCE(employee_id, staff_id_code)
WHERE employee_id IS NULL AND staff_id_code IS NOT NULL;

UPDATE public.hospital_staff
SET staff_id_code = COALESCE(staff_id_code, employee_id)
WHERE staff_id_code IS NULL AND employee_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_hospital_staff_employee_id
  ON public.hospital_staff (employee_id)
  WHERE employee_id IS NOT NULL;

ALTER TABLE public.hospital_staff ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_manage_staff" ON public.hospital_staff;
DROP POLICY IF EXISTS "allow_read_staff" ON public.hospital_staff;
DROP POLICY IF EXISTS "allow_all_staff_admin" ON public.hospital_staff;

CREATE POLICY "admin_manage_staff" ON public.hospital_staff
  FOR ALL USING (true) WITH CHECK (true);

GRANT ALL ON public.hospital_staff TO anon, authenticated, service_role;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'hospital_staff'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.hospital_staff;
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
