-- Super Admin Credentials Vault — isolated platform secret ledger
-- Safe to re-run in Supabase SQL Editor.

CREATE TABLE IF NOT EXISTS public.super_admin_credentials_vault (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portal_name VARCHAR(100) NOT NULL,
  route_url VARCHAR(150) NOT NULL,
  role_type VARCHAR(50) NOT NULL,
  identifier VARCHAR(150) NOT NULL,
  passcode VARCHAR(150) NOT NULL,
  facility_code VARCHAR(50) DEFAULT 'RH-BLR-01',
  environment VARCHAR(30) DEFAULT 'production',
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_super_vault_portal ON public.super_admin_credentials_vault (portal_name);
CREATE INDEX IF NOT EXISTS idx_super_vault_role ON public.super_admin_credentials_vault (role_type);
CREATE INDEX IF NOT EXISTS idx_super_vault_active ON public.super_admin_credentials_vault (is_active);

INSERT INTO public.super_admin_credentials_vault
  (portal_name, route_url, role_type, identifier, passcode, facility_code, notes)
SELECT * FROM (VALUES
  (
    'Hospital Admin & Reception',
    '/hospital',
    'ADMIN / STAFF',
    'hospital@curasync.com',
    'Admin@123',
    'RH-BLR-01',
    'Primary hospital operations, triage and reception desk.'
  ),
  (
    'Doctor OPD Command Workspace',
    '/doctor',
    'DOCTOR',
    'doctor@curasync.com',
    'Doctor@123',
    'RH-BLR-01',
    'Clinical consultations, emergency bedside bypass and Rx generation.'
  ),
  (
    'Hospital Facility Onboarding',
    '/admin/onboarding',
    'SUPER ADMIN',
    'admin@regalhospital.com',
    'Admin@123',
    'RH-BLR-01',
    'Hospital registration & facility code provisioner.'
  ),
  (
    'Vendor Procurement Desk',
    '/vendor',
    'VENDOR',
    'VENDOR-APEX-01',
    'vendor123',
    'RH-BLR-01',
    'Medical supplies and pharmacy inventory dispatch.'
  )
) AS seed(portal_name, route_url, role_type, identifier, passcode, facility_code, notes)
WHERE NOT EXISTS (
  SELECT 1 FROM public.super_admin_credentials_vault LIMIT 1
);

ALTER TABLE public.super_admin_credentials_vault ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow_vault_operations" ON public.super_admin_credentials_vault;
CREATE POLICY "allow_vault_operations" ON public.super_admin_credentials_vault
  FOR ALL TO anon, authenticated
  USING (true)
  WITH CHECK (true);

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
