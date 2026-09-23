-- =============================================================================
-- PLATFORM ROOT SUPER ADMIN — MASTER SETUP (Supabase SQL Editor)
-- Safe to re-run. Run this entire script once in Supabase → SQL → New query.
--
-- If column errors persist, your vault table may be an incompatible legacy shape.
-- Uncomment the next line ONLY if you are OK wiping existing vault rows:
-- DROP TABLE IF EXISTS public.super_admin_credentials_vault CASCADE;
-- =============================================================================
-- Login credentials (must match lib/auth/superAdminAuth.ts):
--   Email:    platform.root@regalhealth.io
--   Passcode: CURA#2026@ROOT_VAULT
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1) Credentials vault (delegated + vault-table login path)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.super_admin_credentials_vault (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portal_name VARCHAR(100) NOT NULL,
  route_url VARCHAR(150) NOT NULL,
  role_type VARCHAR(50) NOT NULL,
  identifier VARCHAR(150) NOT NULL,
  passcode VARCHAR(150) NOT NULL,
  facility_code VARCHAR(50) DEFAULT 'HOSP-01',
  environment VARCHAR(30) DEFAULT 'production',
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Backfill ALL columns when the table already existed from an older/minimal schema
ALTER TABLE public.super_admin_credentials_vault ADD COLUMN IF NOT EXISTS portal_name VARCHAR(100) DEFAULT 'Platform';
ALTER TABLE public.super_admin_credentials_vault ADD COLUMN IF NOT EXISTS route_url VARCHAR(150) DEFAULT '/super-vault-access/';
ALTER TABLE public.super_admin_credentials_vault ADD COLUMN IF NOT EXISTS role_type VARCHAR(50) DEFAULT 'SUPER ADMIN';
ALTER TABLE public.super_admin_credentials_vault ADD COLUMN IF NOT EXISTS identifier VARCHAR(150);
ALTER TABLE public.super_admin_credentials_vault ADD COLUMN IF NOT EXISTS passcode VARCHAR(150);
ALTER TABLE public.super_admin_credentials_vault ADD COLUMN IF NOT EXISTS facility_code VARCHAR(50) DEFAULT 'HOSP-01';
ALTER TABLE public.super_admin_credentials_vault ADD COLUMN IF NOT EXISTS environment VARCHAR(30) DEFAULT 'production';
ALTER TABLE public.super_admin_credentials_vault ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.super_admin_credentials_vault ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE public.super_admin_credentials_vault ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.super_admin_credentials_vault ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_super_vault_identifier
  ON public.super_admin_credentials_vault (lower(identifier));

ALTER TABLE public.super_admin_credentials_vault ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow_vault_operations" ON public.super_admin_credentials_vault;
DROP POLICY IF EXISTS super_admin_vault_anon_read ON public.super_admin_credentials_vault;
CREATE POLICY super_admin_vault_anon_read
  ON public.super_admin_credentials_vault
  FOR SELECT
  TO anon, authenticated
  USING (coalesce(is_active, true) = true);

DROP POLICY IF EXISTS super_admin_vault_service_all ON public.super_admin_credentials_vault;
CREATE POLICY super_admin_vault_service_all
  ON public.super_admin_credentials_vault
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

GRANT SELECT ON public.super_admin_credentials_vault TO anon, authenticated;
GRANT ALL ON public.super_admin_credentials_vault TO service_role;

DELETE FROM public.super_admin_credentials_vault
WHERE lower(identifier) = 'platform.root@regalhealth.io';

INSERT INTO public.super_admin_credentials_vault (
  portal_name,
  route_url,
  role_type,
  identifier,
  passcode,
  facility_code,
  environment,
  notes,
  is_active
) VALUES (
  'Platform Root Super Admin Gateway',
  '/super-vault-access/',
  'SUPER ADMIN',
  'platform.root@regalhealth.io',
  'CURA#2026@ROOT_VAULT',
  'HOSP-01',
  'production',
  'Canonical platform root operator — Super Admin Gateway + Vault Console',
  true
);

-- -----------------------------------------------------------------------------
-- 2) hospital_staff row (delegated login fallback via Supabase client)
-- -----------------------------------------------------------------------------
ALTER TABLE public.hospital_staff ADD COLUMN IF NOT EXISTS employee_id TEXT;
ALTER TABLE public.hospital_staff ADD COLUMN IF NOT EXISTS staff_id_code TEXT;
ALTER TABLE public.hospital_staff ADD COLUMN IF NOT EXISTS passcode_key TEXT;
ALTER TABLE public.hospital_staff ADD COLUMN IF NOT EXISTS hospital_id UUID DEFAULT '11111111-1111-1111-1111-111111111111'::uuid;
ALTER TABLE public.hospital_staff ADD COLUMN IF NOT EXISTS hospital_code TEXT DEFAULT 'HOSP-01';
ALTER TABLE public.hospital_staff ADD COLUMN IF NOT EXISTS full_name TEXT DEFAULT 'Unknown Staff';
ALTER TABLE public.hospital_staff ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.hospital_staff ADD COLUMN IF NOT EXISTS department TEXT DEFAULT 'Operations';
ALTER TABLE public.hospital_staff ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'Staff';
ALTER TABLE public.hospital_staff ADD COLUMN IF NOT EXISTS access_level TEXT DEFAULT 'standard';
ALTER TABLE public.hospital_staff ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

DELETE FROM public.hospital_staff
WHERE lower(email) = 'platform.root@regalhealth.io';

INSERT INTO public.hospital_staff (
  employee_id,
  staff_id_code,
  hospital_id,
  hospital_code,
  full_name,
  email,
  role,
  department,
  passcode_key,
  access_level,
  is_active
) VALUES (
  'PLATFORM-ROOT-001',
  'SUPER-ROOT',
  '11111111-1111-1111-1111-111111111111'::uuid,
  'HOSP-01',
  'Platform Root Super Admin',
  'platform.root@regalhealth.io',
  'Super Admin',
  'Platform Operations',
  'CURA#2026@ROOT_VAULT',
  'level_0_root',
  true
);

-- -----------------------------------------------------------------------------
-- 3) Login audit table (optional — root login works without this)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.super_admin_login_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  event_type TEXT NOT NULL DEFAULT 'LOGIN_SUCCESS',
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT super_admin_login_events_email_check
    CHECK (lower(email) = 'platform.root@regalhealth.io'),
  CONSTRAINT super_admin_login_events_type_check
    CHECK (event_type = 'LOGIN_SUCCESS')
);

CREATE INDEX IF NOT EXISTS idx_super_admin_login_events_created_at
  ON public.super_admin_login_events (created_at DESC);

ALTER TABLE public.super_admin_login_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS super_admin_login_events_insert ON public.super_admin_login_events;
CREATE POLICY super_admin_login_events_insert
  ON public.super_admin_login_events
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    lower(email) = 'platform.root@regalhealth.io'
    AND event_type = 'LOGIN_SUCCESS'
  );

REVOKE ALL ON TABLE public.super_admin_login_events FROM anon, authenticated;
GRANT INSERT ON TABLE public.super_admin_login_events TO anon, authenticated;

-- -----------------------------------------------------------------------------
-- 4) Realtime (optional)
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'super_admin_credentials_vault'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.super_admin_credentials_vault;
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';

-- Verify seed
SELECT 'vault' AS source, identifier, role_type, passcode
FROM public.super_admin_credentials_vault
WHERE lower(identifier) = 'platform.root@regalhealth.io'
UNION ALL
SELECT 'hospital_staff', email, role, passcode_key
FROM public.hospital_staff
WHERE lower(email) = 'platform.root@regalhealth.io';
