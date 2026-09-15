-- Governance vault: allow credential / doctor / vendor deletion.
-- Run in Supabase SQL Editor. Safe to re-run.

ALTER TABLE public.hospital_user_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow_delete_credentials" ON public.hospital_user_credentials;
CREATE POLICY "allow_delete_credentials" ON public.hospital_user_credentials
  FOR DELETE USING (true);

DROP POLICY IF EXISTS "allow_admin_manage_doctors" ON public.doctors;
CREATE POLICY "allow_admin_manage_doctors" ON public.doctors
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_delete_doctors" ON public.doctors;
CREATE POLICY "allow_delete_doctors" ON public.doctors
  FOR DELETE USING (true);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'vendors'
  ) THEN
    EXECUTE 'ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "allow_delete_vendors" ON public.vendors';
    EXECUTE 'CREATE POLICY "allow_delete_vendors" ON public.vendors FOR DELETE USING (true)';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'hospital_vendors'
  ) THEN
    EXECUTE 'ALTER TABLE public.hospital_vendors ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "allow_delete_hospital_vendors" ON public.hospital_vendors';
    EXECUTE 'CREATE POLICY "allow_delete_hospital_vendors" ON public.hospital_vendors FOR DELETE USING (true)';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'hospital_staff'
  ) THEN
    EXECUTE 'ALTER TABLE public.hospital_staff ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "allow_delete_hospital_staff" ON public.hospital_staff';
    EXECUTE 'CREATE POLICY "allow_delete_hospital_staff" ON public.hospital_staff FOR DELETE USING (true)';
  END IF;
END $$;

GRANT DELETE ON public.hospital_user_credentials TO anon, authenticated, service_role;
GRANT DELETE ON public.doctors TO anon, authenticated, service_role;

NOTIFY pgrst, 'reload schema';
