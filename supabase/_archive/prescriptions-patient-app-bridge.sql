CREATE TABLE IF NOT EXISTS public.medical_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id TEXT,
  doctor_id TEXT,
  appointment_id TEXT,
  record_type TEXT DEFAULT 'consultation_summary',
  summary TEXT,
  doctor_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Digital prescription columns shared with the Patient App. Safe to re-run.

ALTER TABLE public.prescriptions ADD COLUMN IF NOT EXISTS appointment_id TEXT;
ALTER TABLE public.prescriptions ADD COLUMN IF NOT EXISTS patient_name TEXT;
ALTER TABLE public.prescriptions ADD COLUMN IF NOT EXISTS uhid TEXT;
ALTER TABLE public.prescriptions ADD COLUMN IF NOT EXISTS doctor_name TEXT;
ALTER TABLE public.prescriptions ADD COLUMN IF NOT EXISTS department TEXT;
ALTER TABLE public.prescriptions ADD COLUMN IF NOT EXISTS diagnosis TEXT;
ALTER TABLE public.prescriptions ADD COLUMN IF NOT EXISTS clinical_notes TEXT;
ALTER TABLE public.prescriptions ADD COLUMN IF NOT EXISTS examination_findings TEXT;
ALTER TABLE public.prescriptions ADD COLUMN IF NOT EXISTS medicines JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.prescriptions ADD COLUMN IF NOT EXISTS medications JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.prescriptions ADD COLUMN IF NOT EXISTS instructions TEXT;
ALTER TABLE public.prescriptions ADD COLUMN IF NOT EXISTS dietary_instructions TEXT;
ALTER TABLE public.prescriptions ADD COLUMN IF NOT EXISTS doctor_instructions TEXT;
ALTER TABLE public.prescriptions ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE public.prescriptions ADD COLUMN IF NOT EXISTS hospital_name TEXT;
ALTER TABLE public.prescriptions ADD COLUMN IF NOT EXISTS vitals JSONB;

ALTER TABLE public.consultations ADD COLUMN IF NOT EXISTS patient_name TEXT;
ALTER TABLE public.consultations ADD COLUMN IF NOT EXISTS doctor_name TEXT;
ALTER TABLE public.consultations ADD COLUMN IF NOT EXISTS diagnosis TEXT;
ALTER TABLE public.consultations ADD COLUMN IF NOT EXISTS clinical_notes TEXT;
ALTER TABLE public.consultations ADD COLUMN IF NOT EXISTS status TEXT;

ALTER TABLE public.medical_records ADD COLUMN IF NOT EXISTS doctor_name TEXT;
ALTER TABLE public.medical_records ADD COLUMN IF NOT EXISTS appointment_id TEXT;
ALTER TABLE public.medical_records ADD COLUMN IF NOT EXISTS summary TEXT;
ALTER TABLE public.medical_records ADD COLUMN IF NOT EXISTS record_type TEXT;

CREATE INDEX IF NOT EXISTS idx_prescriptions_patient_id ON public.prescriptions (patient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_prescriptions_patient_name ON public.prescriptions (patient_name, created_at DESC);

DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.prescriptions;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.consultations;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.medical_records;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;
