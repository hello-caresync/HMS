-- CuraSync bi-directional Doctor Workspace ↔ Patient App schema
-- Run in Supabase SQL Editor (safe to re-run).

-- 1. OPD Queue (filtered by doctor_id = RH-Dxx)
CREATE TABLE IF NOT EXISTS public.opd_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token_number text NOT NULL,
  patient_id uuid NOT NULL,
  patient_name text NOT NULL,
  doctor_id text NOT NULL,
  doctor_name text NOT NULL,
  age integer NOT NULL DEFAULT 0,
  gender text NOT NULL DEFAULT 'Unknown',
  blood_group text,
  diagnosis text,
  vitals jsonb DEFAULT '{"bp": "120/80", "hr": "72 bpm", "spo2": "98%"}'::jsonb,
  allergies text[] DEFAULT '{}',
  priority text DEFAULT 'ROUTINE',
  status text DEFAULT 'SCHEDULED',
  appointment_date date DEFAULT CURRENT_DATE,
  slot_time text,
  department text,
  hospital_name text DEFAULT 'Regal Hospital',
  created_at timestamptz DEFAULT timezone('utc'::text, now()),
  updated_at timestamptz DEFAULT timezone('utc'::text, now())
);

-- Harden / migrate older opd_queue shapes
ALTER TABLE public.opd_queue ADD COLUMN IF NOT EXISTS token_number text;
ALTER TABLE public.opd_queue ADD COLUMN IF NOT EXISTS patient_id uuid;
ALTER TABLE public.opd_queue ADD COLUMN IF NOT EXISTS patient_name text;
ALTER TABLE public.opd_queue ADD COLUMN IF NOT EXISTS doctor_id text;
ALTER TABLE public.opd_queue ADD COLUMN IF NOT EXISTS doctor_name text;
ALTER TABLE public.opd_queue ADD COLUMN IF NOT EXISTS age integer DEFAULT 0;
ALTER TABLE public.opd_queue ADD COLUMN IF NOT EXISTS gender text DEFAULT 'Unknown';
ALTER TABLE public.opd_queue ADD COLUMN IF NOT EXISTS blood_group text;
ALTER TABLE public.opd_queue ADD COLUMN IF NOT EXISTS diagnosis text;
ALTER TABLE public.opd_queue ADD COLUMN IF NOT EXISTS vitals jsonb DEFAULT '{"bp": "120/80", "hr": "72 bpm", "spo2": "98%"}'::jsonb;
ALTER TABLE public.opd_queue ADD COLUMN IF NOT EXISTS allergies text[] DEFAULT '{}';
ALTER TABLE public.opd_queue ADD COLUMN IF NOT EXISTS priority text DEFAULT 'ROUTINE';
ALTER TABLE public.opd_queue ADD COLUMN IF NOT EXISTS status text DEFAULT 'SCHEDULED';
ALTER TABLE public.opd_queue ADD COLUMN IF NOT EXISTS appointment_date date DEFAULT CURRENT_DATE;
ALTER TABLE public.opd_queue ADD COLUMN IF NOT EXISTS slot_time text;
ALTER TABLE public.opd_queue ADD COLUMN IF NOT EXISTS department text;
ALTER TABLE public.opd_queue ADD COLUMN IF NOT EXISTS hospital_name text DEFAULT 'Regal Hospital';
ALTER TABLE public.opd_queue ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT timezone('utc'::text, now());
ALTER TABLE public.opd_queue ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT timezone('utc'::text, now());

-- Backfill doctor_id from legacy doctor_employee_id when present
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'opd_queue' AND column_name = 'doctor_employee_id'
  ) THEN
    EXECUTE 'UPDATE public.opd_queue SET doctor_id = doctor_employee_id WHERE doctor_id IS NULL AND doctor_employee_id IS NOT NULL';
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_opd_queue_doctor_status
  ON public.opd_queue (doctor_id, status, created_at);

CREATE INDEX IF NOT EXISTS idx_opd_queue_patient
  ON public.opd_queue (patient_id, created_at DESC);

-- 2. Clinical notes & e-prescriptions
CREATE TABLE IF NOT EXISTS public.clinical_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL,
  doctor_id text NOT NULL,
  doctor_name text NOT NULL,
  diagnosis_disease text,
  prescription text NOT NULL DEFAULT '',
  clinical_advice text,
  queue_id uuid,
  department text,
  created_at timestamptz DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.clinical_notes ADD COLUMN IF NOT EXISTS patient_id uuid;
ALTER TABLE public.clinical_notes ADD COLUMN IF NOT EXISTS doctor_id text;
ALTER TABLE public.clinical_notes ADD COLUMN IF NOT EXISTS doctor_name text;
ALTER TABLE public.clinical_notes ADD COLUMN IF NOT EXISTS diagnosis_disease text;
ALTER TABLE public.clinical_notes ADD COLUMN IF NOT EXISTS prescription text DEFAULT '';
ALTER TABLE public.clinical_notes ADD COLUMN IF NOT EXISTS clinical_advice text;
ALTER TABLE public.clinical_notes ADD COLUMN IF NOT EXISTS queue_id uuid;
ALTER TABLE public.clinical_notes ADD COLUMN IF NOT EXISTS department text;
ALTER TABLE public.clinical_notes ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT timezone('utc'::text, now());

CREATE INDEX IF NOT EXISTS idx_clinical_notes_patient_rt
  ON public.clinical_notes (patient_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_clinical_notes_doctor
  ON public.clinical_notes (doctor_id, created_at DESC);

-- 3. Patient messages (doctor advice / alerts)
ALTER TABLE IF EXISTS public.patient_messages
  ADD COLUMN IF NOT EXISTS patient_id uuid,
  ADD COLUMN IF NOT EXISTS doctor_id text,
  ADD COLUMN IF NOT EXISTS doctor_employee_id text,
  ADD COLUMN IF NOT EXISTS priority text DEFAULT 'normal',
  ADD COLUMN IF NOT EXISTS sender_type text DEFAULT 'doctor',
  ADD COLUMN IF NOT EXISTS is_read boolean DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_patient_messages_patient
  ON public.patient_messages (patient_id, created_at DESC);

-- 4. Booking table: ensure doctor_id exists for dual-write
ALTER TABLE IF EXISTS public.patient_appointments
  ADD COLUMN IF NOT EXISTS doctor_id text,
  ADD COLUMN IF NOT EXISTS queue_status text DEFAULT 'SCHEDULED';

-- 5. Realtime publication
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.opd_queue;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.clinical_notes;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.patient_messages;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;

-- 6. Dev-friendly RLS (tighten in production)
ALTER TABLE public.opd_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinical_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "opd_queue_v0_all" ON public.opd_queue;
CREATE POLICY "opd_queue_v0_all"
  ON public.opd_queue FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "clinical_notes_v0_all" ON public.clinical_notes;
CREATE POLICY "clinical_notes_v0_all"
  ON public.clinical_notes FOR ALL USING (true) WITH CHECK (true);
