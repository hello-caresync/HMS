-- Doctor profile save · legacy + new column aliases (Supabase SQL editor)
-- Idempotent: safe to run repeatedly. Keeps `doctors` compatible with both the
-- command-center schema (specialization / registration_number) and the profile
-- editor payload (specialty / medical_license / employee_id).

ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS employee_id TEXT;
ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS department TEXT;
ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS specialization TEXT;
ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS specialty TEXT;
ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS registration_number TEXT;
ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS medical_license TEXT;
ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS qualification TEXT;
ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS room_number TEXT;
ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS consultation_fee NUMERIC DEFAULT 0;
ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Backfill each alias from whichever side already holds the value.
UPDATE public.doctors SET specialty = specialization WHERE specialty IS NULL;
UPDATE public.doctors SET specialization = specialty WHERE specialization IS NULL;
UPDATE public.doctors SET medical_license = registration_number WHERE medical_license IS NULL;
UPDATE public.doctors SET registration_number = medical_license WHERE registration_number IS NULL;
UPDATE public.doctors SET employee_id = registration_number WHERE employee_id IS NULL;

-- `onConflict: 'employee_id'` needs a unique index to resolve the upsert target.
CREATE UNIQUE INDEX IF NOT EXISTS doctors_employee_id_key
  ON public.doctors (employee_id) WHERE employee_id IS NOT NULL;
