-- Super Admin Credentials Vault — isolated platform secret ledger
-- Safe to re-run in Supabase SQL Editor.

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

CREATE INDEX IF NOT EXISTS idx_super_vault_portal ON public.super_admin_credentials_vault (portal_name);
CREATE INDEX IF NOT EXISTS idx_super_vault_role ON public.super_admin_credentials_vault (role_type);
CREATE INDEX IF NOT EXISTS idx_super_vault_active ON public.super_admin_credentials_vault (is_active);
CREATE UNIQUE INDEX IF NOT EXISTS idx_super_vault_identifier
  ON public.super_admin_credentials_vault (lower(identifier));

-- Deactivate legacy demo / portal seed credentials.
UPDATE public.super_admin_credentials_vault
SET is_active = false,
    updated_at = NOW()
WHERE lower(identifier) <> 'superadmin@regalhospital.com';

INSERT INTO public.super_admin_credentials_vault (
  portal_name,
  route_url,
  role_type,
  identifier,
  passcode,
  facility_code,
  notes,
  is_active
)
VALUES (
  'Super Admin Platform Root',
  '/super-vault-access',
  'SUPER ADMIN',
  'superadmin@regalhospital.com',
  'REGAL#2026@SUPER_ROOT',
  'HOSP-01',
  'Canonical Level-0 root operator credential.',
  true
)
ON CONFLICT (lower(identifier)) DO UPDATE SET
  portal_name = EXCLUDED.portal_name,
  route_url = EXCLUDED.route_url,
  role_type = EXCLUDED.role_type,
  passcode = EXCLUDED.passcode,
  facility_code = EXCLUDED.facility_code,
  notes = EXCLUDED.notes,
  is_active = true,
  updated_at = NOW();

ALTER TABLE public.super_admin_credentials_vault ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow_vault_operations" ON public.super_admin_credentials_vault;
CREATE POLICY "allow_vault_operations" ON public.super_admin_credentials_vault
  FOR ALL USING (true) WITH CHECK (true);
