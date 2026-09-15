-- 0011: Sync provisioned doctors to public.doctors for patient appointment booking.
-- Legacy-safe: adds missing columns before indexes/policies.

CREATE TABLE IF NOT EXISTS public.doctors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS hospital_id TEXT DEFAULT 'HOSP-01';
ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS hospital_code TEXT DEFAULT 'HOSP-01';
ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS hospital_name TEXT DEFAULT 'Regal Hospital';
ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS doctor_id TEXT;
ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS doctor_code TEXT;
ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS registration_number TEXT;
ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS doctor_name TEXT;
ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS department TEXT DEFAULT 'General Medicine';
ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS specialization TEXT;
ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS qualification TEXT DEFAULT 'MBBS, MD';
ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS consultation_fee NUMERIC(10,2) DEFAULT 500.00;
ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS fee NUMERIC(10,2) DEFAULT 500.00;
ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS experience TEXT;
ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS rating TEXT;
ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS available_days TEXT[] DEFAULT ARRAY['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS available_time_slots TEXT[] DEFAULT ARRAY['09:00 AM - 01:00 PM', '04:00 PM - 07:00 PM'];
ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT true;
ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

UPDATE public.doctors
SET hospital_id = COALESCE(NULLIF(TRIM(hospital_id::text), ''), 'HOSP-01')
WHERE hospital_id IS NULL OR TRIM(hospital_id::text) = '';

CREATE INDEX IF NOT EXISTS idx_doctors_hospital_id ON public.doctors (hospital_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_doctors_email_unique ON public.doctors (lower(email)) WHERE email IS NOT NULL;

ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow_patients_view_doctors" ON public.doctors;
CREATE POLICY "allow_patients_view_doctors" ON public.doctors
  FOR SELECT USING (
    COALESCE(is_available, true) = true
    AND COALESCE(status, 'active') ILIKE 'active'
  );

DROP POLICY IF EXISTS "allow_admin_manage_doctors" ON public.doctors;
CREATE POLICY "allow_admin_manage_doctors" ON public.doctors
  FOR ALL USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.doctors TO anon, authenticated, service_role;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.doctors;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_object THEN NULL;
END $$;
