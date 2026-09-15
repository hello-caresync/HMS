-- Apply before using unified hospital auth (migration 0010 standalone copy).
-- Safe: CREATE TABLE IF NOT EXISTS + ADD COLUMN IF NOT EXISTS only.

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

CREATE UNIQUE INDEX IF NOT EXISTS idx_hospital_user_credentials_email
  ON public.hospital_user_credentials (email);

ALTER TABLE public.hospital_user_credentials ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "open_all_hospital_user_credentials" ON public.hospital_user_credentials;
CREATE POLICY "open_all_hospital_user_credentials" ON public.hospital_user_credentials
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
GRANT ALL ON public.hospital_user_credentials TO anon, authenticated, service_role;
NOTIFY pgrst, 'reload schema';
