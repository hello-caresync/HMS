-- Remove hardcoded Super Admin tenant protection (HOSP-01 / Regal / seed UUIDs).
-- Safe to re-run.

BEGIN;

CREATE OR REPLACE FUNCTION public.is_protected_hospital_tenant(p_hospital_id TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
  SELECT FALSE;
$$;

COMMIT;
