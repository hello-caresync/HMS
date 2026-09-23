-- Platform root super-admin seed (mirrors PLATFORM_ROOT_SUPER_ADMIN_MASTER.sql)

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
  FOR SELECT TO anon, authenticated
  USING (coalesce(is_active, true) = true);

DROP POLICY IF EXISTS super_admin_vault_service_all ON public.super_admin_credentials_vault;
CREATE POLICY super_admin_vault_service_all
  ON public.super_admin_credentials_vault
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

GRANT SELECT ON public.super_admin_credentials_vault TO anon, authenticated;
GRANT ALL ON public.super_admin_credentials_vault TO service_role;

DELETE FROM public.super_admin_credentials_vault
WHERE lower(identifier) = 'platform.root@regalhealth.io';

INSERT INTO public.super_admin_credentials_vault (
  portal_name, route_url, role_type, identifier, passcode,
  facility_code, environment, notes, is_active
) VALUES (
  'Platform Root Super Admin Gateway',
  '/super-vault-access/',
  'SUPER ADMIN',
  'platform.root@regalhealth.io',
  'CURA#2026@ROOT_VAULT',
  'HOSP-01',
  'production',
  'Canonical platform root operator',
  true
);

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
  employee_id, staff_id_code, hospital_id, hospital_code,
  full_name, email, role, department, passcode_key, access_level, is_active
) VALUES (
  'PLATFORM-ROOT-001', 'SUPER-ROOT',
  '11111111-1111-1111-1111-111111111111'::uuid,
  'HOSP-01', 'Platform Root Super Admin',
  'platform.root@regalhealth.io', 'Super Admin', 'Platform Operations',
  'CURA#2026@ROOT_VAULT', 'level_0_root', true
);
