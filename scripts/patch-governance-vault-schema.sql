-- Governance vault: ensure credential, staff, and doctor tables exist with open RLS for admin UI.
-- Safe to run multiple times in Supabase SQL Editor.

CREATE TABLE IF NOT EXISTS public.hospital_user_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id TEXT NOT NULL DEFAULT 'HOSP-01',
  hospital_name TEXT NOT NULL DEFAULT 'Regal Hospital',
  employee_id TEXT,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'staff',
  department TEXT NOT NULL DEFAULT 'Operations',
  passcode TEXT,
  passcode_hash TEXT,
  phone TEXT,
  portal_access TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.hospital_user_credentials ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "open_all_hospital_user_credentials" ON public.hospital_user_credentials;
CREATE POLICY "open_all_hospital_user_credentials" ON public.hospital_user_credentials
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
GRANT ALL ON public.hospital_user_credentials TO anon, authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.hospital_staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id TEXT NOT NULL DEFAULT 'HOSP-01',
  full_name TEXT NOT NULL,
  email TEXT,
  role TEXT NOT NULL DEFAULT 'Staff',
  department TEXT NOT NULL DEFAULT 'Operations',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.hospital_staff ADD COLUMN IF NOT EXISTS employee_id TEXT;
ALTER TABLE public.hospital_staff ADD COLUMN IF NOT EXISTS staff_id_code TEXT;
ALTER TABLE public.hospital_staff ADD COLUMN IF NOT EXISTS passcode_key TEXT;
ALTER TABLE public.hospital_staff ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.hospital_staff ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

ALTER TABLE public.hospital_staff ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admin_manage_staff" ON public.hospital_staff;
CREATE POLICY "admin_manage_staff" ON public.hospital_staff
  FOR ALL USING (true) WITH CHECK (true);
GRANT ALL ON public.hospital_staff TO anon, authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.doctors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS hospital_id TEXT DEFAULT 'HOSP-01';
ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS doctor_code TEXT;
ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS registration_number TEXT;
ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_admin_manage_doctors" ON public.doctors;
CREATE POLICY "allow_admin_manage_doctors" ON public.doctors
  FOR ALL USING (true) WITH CHECK (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.doctors TO anon, authenticated, service_role;

NOTIFY pgrst, 'reload schema';
