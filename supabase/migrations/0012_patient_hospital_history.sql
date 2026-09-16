-- Hospital-scoped sequential UHID + unified consultations ledger
-- Safe to re-run (IF NOT EXISTS / OR REPLACE).

-- 1. Per-hospital atomic sequence counter
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

-- 2. Extend patients registry (table may already exist from legacy scripts)
CREATE TABLE IF NOT EXISTS public.patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  uhid TEXT NOT NULL,
  phone TEXT,
  hospital_id TEXT NOT NULL DEFAULT 'HOSP-01',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

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
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS family_members JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS department TEXT DEFAULT 'General Medicine';
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'Active';
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS patient_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS patients_uhid_unique ON public.patients (uhid);
CREATE UNIQUE INDEX IF NOT EXISTS patients_hospital_phone_unique ON public.patients (hospital_id, phone)
  WHERE phone IS NOT NULL AND phone <> '';

-- 3. Consultations ledger (hospital + doctor + patient linked)
CREATE TABLE IF NOT EXISTS public.consultations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id TEXT NOT NULL,
  patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL,
  appointment_id TEXT,
  uhid TEXT NOT NULL,
  patient_name TEXT NOT NULL,
  doctor_id TEXT NOT NULL,
  doctor_name TEXT NOT NULL,
  department TEXT NOT NULL,
  symptoms TEXT,
  diagnosis TEXT,
  vitals JSONB NOT NULL DEFAULT '{}'::jsonb,
  medicines JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'CONFIRMED',
  consultation_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

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
