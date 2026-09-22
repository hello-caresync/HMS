BEGIN;

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
  environment,
  notes,
  is_active
)
SELECT
  'Super Admin Platform Root',
  '/super-vault-access',
  'SUPER ADMIN',
  'superadmin@regalhospital.com',
  'REGAL#2026@SUPER_ROOT',
  'HOSP-01',
  'production',
  'Canonical Level-0 root operator credential.',
  true
WHERE NOT EXISTS (
  SELECT 1
  FROM public.super_admin_credentials_vault
  WHERE lower(identifier) = 'superadmin@regalhospital.com'
);

UPDATE public.super_admin_credentials_vault
SET
  portal_name = 'Super Admin Platform Root',
  route_url = '/super-vault-access',
  role_type = 'SUPER ADMIN',
  passcode = 'REGAL#2026@SUPER_ROOT',
  facility_code = 'HOSP-01',
  environment = 'production',
  notes = 'Canonical Level-0 root operator credential.',
  is_active = true,
  updated_at = NOW()
WHERE lower(identifier) = 'superadmin@regalhospital.com';

COMMIT;
