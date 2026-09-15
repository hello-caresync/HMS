BEGIN;

-- Canonical hospital portal credentials (admin, doctor, nurse, staff)
-- Migration-ready — apply in Supabase when approved.

CREATE TABLE IF NOT EXISTS public.hospital_user_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id TEXT NOT NULL DEFAULT 'HOSP-01',
  hospital_name TEXT NOT NULL DEFAULT 'Regal Hospital',
  employee_id TEXT,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'staff'
    CHECK (role IN ('admin', 'doctor', 'staff', 'nurse')),
  department TEXT NOT NULL DEFAULT 'Operations',
  passcode TEXT,
  passcode_hash TEXT,
  phone TEXT,
  portal_access TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.hospital_user_credentials ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid();
ALTER TABLE public.hospital_user_credentials ADD COLUMN IF NOT EXISTS hospital_id TEXT NOT NULL DEFAULT 'HOSP-01';
ALTER TABLE public.hospital_user_credentials ADD COLUMN IF NOT EXISTS hospital_name TEXT NOT NULL DEFAULT 'Regal Hospital';
ALTER TABLE public.hospital_user_credentials ADD COLUMN IF NOT EXISTS employee_id TEXT;
ALTER TABLE public.hospital_user_credentials ADD COLUMN IF NOT EXISTS email TEXT NOT NULL DEFAULT '';
ALTER TABLE public.hospital_user_credentials ADD COLUMN IF NOT EXISTS full_name TEXT NOT NULL DEFAULT '';
ALTER TABLE public.hospital_user_credentials ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'staff';
ALTER TABLE public.hospital_user_credentials ADD COLUMN IF NOT EXISTS department TEXT NOT NULL DEFAULT 'Operations';
ALTER TABLE public.hospital_user_credentials ADD COLUMN IF NOT EXISTS passcode TEXT;
ALTER TABLE public.hospital_user_credentials ADD COLUMN IF NOT EXISTS passcode_hash TEXT;
ALTER TABLE public.hospital_user_credentials ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.hospital_user_credentials ADD COLUMN IF NOT EXISTS portal_access TEXT;
ALTER TABLE public.hospital_user_credentials ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.hospital_user_credentials ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE public.hospital_user_credentials ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE UNIQUE INDEX IF NOT EXISTS idx_hospital_user_credentials_email
  ON public.hospital_user_credentials (email);

CREATE INDEX IF NOT EXISTS idx_hospital_user_credentials_email_lower
  ON public.hospital_user_credentials (lower(email));

CREATE UNIQUE INDEX IF NOT EXISTS idx_hospital_user_credentials_employee_id
  ON public.hospital_user_credentials (employee_id)
  WHERE employee_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_hospital_user_credentials_hospital
  ON public.hospital_user_credentials (hospital_id, role, is_active);

-- Backfill from legacy hospital_staff_credentials (Super Admin onboard table)
INSERT INTO public.hospital_user_credentials (
  id, hospital_id, hospital_name, employee_id, email, full_name, role, department,
  passcode, phone, portal_access, is_active, created_at, updated_at
)
SELECT
  gen_random_uuid(),
  coalesce(nullif(hsc.hospital_id, ''), 'HOSP-01'),
  coalesce(nullif(hsc.hospital_name, ''), 'Regal Hospital'),
  coalesce(nullif(hsc.id, ''), upper(hsc.email)),
  lower(trim(hsc.email)),
  hsc.full_name,
  CASE
    WHEN lower(hsc.staff_type) LIKE '%admin%' THEN 'admin'
    WHEN lower(hsc.staff_type) LIKE '%doctor%' THEN 'doctor'
    WHEN lower(hsc.staff_type) LIKE '%nurse%' THEN 'nurse'
    ELSE 'staff'
  END,
  coalesce(nullif(hsc.department, ''), 'Operations'),
  hsc.temporary_passcode,
  hsc.phone,
  hsc.portal_access,
  coalesce(lower(hsc.status) = 'active', true),
  coalesce(hsc.created_at, now()),
  now()
FROM public.hospital_staff_credentials hsc
WHERE hsc.email IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.hospital_user_credentials u
    WHERE lower(u.email) = lower(trim(hsc.email))
  );

-- Backfill from hospital_staff roster rows that have passcodes
INSERT INTO public.hospital_user_credentials (
  hospital_id, hospital_name, employee_id, email, full_name, role, department,
  passcode, portal_access, is_active, created_at, updated_at
)
SELECT
  coalesce(nullif(hs.hospital_id::text, ''), 'HOSP-01'),
  'Regal Hospital',
  nullif(hs.staff_id_code, ''),
  lower(trim(hs.email)),
  hs.full_name,
  CASE
    WHEN lower(hs.role) LIKE '%admin%' THEN 'admin'
    WHEN lower(hs.role) LIKE '%doctor%' THEN 'doctor'
    WHEN lower(hs.role) LIKE '%nurse%' THEN 'nurse'
    ELSE 'staff'
  END,
  coalesce(nullif(hs.department, ''), 'Operations'),
  coalesce(hs.passcode_key, hs.passcode),
  CASE WHEN lower(hs.role) LIKE '%doctor%' THEN '/doctor/dashboard' ELSE '/dashboard' END,
  coalesce(hs.is_active, true),
  coalesce(hs.created_at, now()),
  now()
FROM public.hospital_staff hs
WHERE hs.email IS NOT NULL
  AND coalesce(hs.passcode_key, hs.passcode, '') <> ''
  AND NOT EXISTS (
    SELECT 1 FROM public.hospital_user_credentials u
    WHERE lower(u.email) = lower(trim(hs.email))
  );

ALTER TABLE public.hospital_user_credentials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "open_all_hospital_user_credentials" ON public.hospital_user_credentials;
CREATE POLICY "open_all_hospital_user_credentials" ON public.hospital_user_credentials
  FOR ALL TO anon, authenticated
  USING (true)
  WITH CHECK (true);

GRANT ALL ON public.hospital_user_credentials TO anon, authenticated, service_role;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'hospital_user_credentials'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.hospital_user_credentials;
  END IF;
END $$;

COMMIT;
