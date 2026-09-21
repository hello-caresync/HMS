-- Recovery patch for 0012_patient_hospital_history.sql
-- Run in Supabase SQL Editor when you see: column "hospital_id" does not exist
-- Safe to re-run.

-- ============================================================================
-- 1) UHID sequence (unchanged from 0012)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.hospital_patient_counters (
  hospital_id TEXT PRIMARY KEY,
  last_seq_number INTEGER NOT NULL DEFAULT 0
);

CREATE OR REPLACE FUNCTION public.generate_hospital_uhid(p_hospital_id TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_next_num INTEGER;
  v_prefix TEXT;
BEGIN
  INSERT INTO public.hospital_patient_counters (hospital_id, last_seq_number)
  VALUES (p_hospital_id, 1)
  ON CONFLICT (hospital_id)
  DO UPDATE SET last_seq_number = public.hospital_patient_counters.last_seq_number + 1
  RETURNING last_seq_number INTO v_next_num;

  v_prefix := REPLACE(COALESCE(p_hospital_id, 'HOSP-01'), ' ', '');
  RETURN v_prefix || '-P-' || LPAD(v_next_num::TEXT, 4, '0');
END;
$$;

-- ============================================================================
-- 2) patients — legacy-safe column adds (table may pre-date hospital_id)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL DEFAULT 'Unknown',
  uhid TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS uhid TEXT;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS hospital_id TEXT DEFAULT 'HOSP-01';
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS age INTEGER;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS patient_age INTEGER;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS gender TEXT;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS blood_group TEXT;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS postal_code TEXT;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS emergency_contact_relation TEXT;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS family_members JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS department TEXT DEFAULT 'General Medicine';
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Active';
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS patient_id TEXT;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS module_id TEXT;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

UPDATE public.patients SET hospital_id = 'HOSP-01' WHERE hospital_id IS NULL OR hospital_id = '';
UPDATE public.patients SET family_members = '[]'::jsonb WHERE family_members IS NULL;
UPDATE public.patients SET status = 'Active' WHERE status IS NULL OR status = '';

CREATE UNIQUE INDEX IF NOT EXISTS patients_uhid_unique ON public.patients (uhid)
  WHERE uhid IS NOT NULL AND uhid <> '';

CREATE UNIQUE INDEX IF NOT EXISTS patients_hospital_phone_unique ON public.patients (hospital_id, phone)
  WHERE phone IS NOT NULL AND phone <> '';

-- ============================================================================
-- 3) consultations — shell table + column adds (fixes missing hospital_id)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.consultations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.consultations ADD COLUMN IF NOT EXISTS hospital_id TEXT DEFAULT 'HOSP-01';
ALTER TABLE public.consultations ADD COLUMN IF NOT EXISTS patient_id UUID;
ALTER TABLE public.consultations ADD COLUMN IF NOT EXISTS appointment_id TEXT;
ALTER TABLE public.consultations ADD COLUMN IF NOT EXISTS uhid TEXT;
ALTER TABLE public.consultations ADD COLUMN IF NOT EXISTS patient_name TEXT;
ALTER TABLE public.consultations ADD COLUMN IF NOT EXISTS doctor_id TEXT;
ALTER TABLE public.consultations ADD COLUMN IF NOT EXISTS doctor_name TEXT;
ALTER TABLE public.consultations ADD COLUMN IF NOT EXISTS department TEXT DEFAULT 'General Medicine';
ALTER TABLE public.consultations ADD COLUMN IF NOT EXISTS symptoms TEXT;
ALTER TABLE public.consultations ADD COLUMN IF NOT EXISTS diagnosis TEXT;
ALTER TABLE public.consultations ADD COLUMN IF NOT EXISTS vitals JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.consultations ADD COLUMN IF NOT EXISTS medicines JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.consultations ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'CONFIRMED';
ALTER TABLE public.consultations ADD COLUMN IF NOT EXISTS consultation_date DATE DEFAULT CURRENT_DATE;

UPDATE public.consultations SET hospital_id = 'HOSP-01' WHERE hospital_id IS NULL OR hospital_id = '';
UPDATE public.consultations SET vitals = '{}'::jsonb WHERE vitals IS NULL;
UPDATE public.consultations SET medicines = '[]'::jsonb WHERE medicines IS NULL;
UPDATE public.consultations SET status = 'CONFIRMED' WHERE status IS NULL OR status = '';
UPDATE public.consultations SET consultation_date = CURRENT_DATE WHERE consultation_date IS NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'consultations_patient_id_fkey'
      AND conrelid = 'public.consultations'::regclass
  ) THEN
    ALTER TABLE public.consultations
      ADD CONSTRAINT consultations_patient_id_fkey
      FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE SET NULL;
  END IF;
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'Skipped consultations_patient_id_fkey: %', SQLERRM;
END $$;

CREATE INDEX IF NOT EXISTS idx_consultations_hospital_patient
  ON public.consultations (hospital_id, uhid, consultation_date DESC);

CREATE INDEX IF NOT EXISTS idx_consultations_doctor
  ON public.consultations (hospital_id, doctor_id, consultation_date DESC);

CREATE INDEX IF NOT EXISTS idx_consultations_appointment
  ON public.consultations (appointment_id);

ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS consultations_anon_all ON public.consultations;
CREATE POLICY consultations_anon_all ON public.consultations
  FOR ALL USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.consultations TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.hospital_patient_counters TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.generate_hospital_uhid(TEXT) TO anon, authenticated;
