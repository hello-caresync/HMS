BEGIN;

-- Canonical clinical schema (Phase 4 consolidation)
-- Sources:
--   medical_records → doctor-patient-realtime-schema.sql (FK → appointments.id)
--   emergency_alerts → emergency-alerts-schema.sql + emergency-alerts.sql columns
--   opd_queue, clinical_notes → bi-directional-opd-schema.sql
-- Safe on existing databases: CREATE TABLE IF NOT EXISTS + ADD COLUMN IF NOT EXISTS per column.

-- ============================================================================
-- medical_records
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.medical_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID,
  doctor_id UUID,
  consultation_id UUID,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  record_type TEXT NOT NULL DEFAULT 'consultation_summary',
  summary TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.medical_records ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid();
ALTER TABLE public.medical_records ADD COLUMN IF NOT EXISTS patient_id UUID;
ALTER TABLE public.medical_records ADD COLUMN IF NOT EXISTS doctor_id UUID;
ALTER TABLE public.medical_records ADD COLUMN IF NOT EXISTS consultation_id UUID;
ALTER TABLE public.medical_records ADD COLUMN IF NOT EXISTS appointment_id UUID;
ALTER TABLE public.medical_records ADD COLUMN IF NOT EXISTS record_type TEXT NOT NULL DEFAULT 'consultation_summary';
ALTER TABLE public.medical_records ADD COLUMN IF NOT EXISTS summary TEXT NOT NULL DEFAULT '';
ALTER TABLE public.medical_records ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.medical_records ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS medical_records_patient_idx
  ON public.medical_records (patient_id, created_at DESC);

CREATE INDEX IF NOT EXISTS medical_records_appointment_idx
  ON public.medical_records (appointment_id, created_at DESC);

-- ============================================================================
-- emergency_alerts
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.emergency_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id TEXT NOT NULL,
  patient_name TEXT NOT NULL,
  patient_phone TEXT,
  hospital_id UUID NOT NULL REFERENCES public.hospitals(id),
  hospital_code TEXT NOT NULL DEFAULT 'HOSP-01',
  hospital_name TEXT NOT NULL,
  place_description TEXT,
  emergency_notes TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  location_accuracy DOUBLE PRECISION,
  blood_group TEXT,
  severity TEXT NOT NULL DEFAULT 'code_red',
  arrival TEXT NOT NULL DEFAULT 'Ambulance',
  status TEXT NOT NULL DEFAULT 'Pending'
    CHECK (status IN ('Pending', 'Dispatched', 'Resolved', 'active')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  dispatched_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ
);

ALTER TABLE public.emergency_alerts ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid();
ALTER TABLE public.emergency_alerts ADD COLUMN IF NOT EXISTS patient_id TEXT NOT NULL DEFAULT 'UNKNOWN';
ALTER TABLE public.emergency_alerts ADD COLUMN IF NOT EXISTS patient_name TEXT NOT NULL DEFAULT 'Unknown Patient';
ALTER TABLE public.emergency_alerts ADD COLUMN IF NOT EXISTS patient_phone TEXT;
ALTER TABLE public.emergency_alerts ADD COLUMN IF NOT EXISTS hospital_id UUID NOT NULL DEFAULT '11111111-1111-1111-1111-111111111111';
ALTER TABLE public.emergency_alerts ADD COLUMN IF NOT EXISTS hospital_code TEXT NOT NULL DEFAULT 'HOSP-01';
ALTER TABLE public.emergency_alerts ADD COLUMN IF NOT EXISTS hospital_name TEXT NOT NULL DEFAULT 'Regal Hospital';
ALTER TABLE public.emergency_alerts ADD COLUMN IF NOT EXISTS place_description TEXT;
ALTER TABLE public.emergency_alerts ADD COLUMN IF NOT EXISTS emergency_notes TEXT;
ALTER TABLE public.emergency_alerts ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;
ALTER TABLE public.emergency_alerts ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;
ALTER TABLE public.emergency_alerts ADD COLUMN IF NOT EXISTS location_accuracy DOUBLE PRECISION;
ALTER TABLE public.emergency_alerts ADD COLUMN IF NOT EXISTS blood_group TEXT;
ALTER TABLE public.emergency_alerts ADD COLUMN IF NOT EXISTS severity TEXT NOT NULL DEFAULT 'code_red';
ALTER TABLE public.emergency_alerts ADD COLUMN IF NOT EXISTS arrival TEXT NOT NULL DEFAULT 'Ambulance';
ALTER TABLE public.emergency_alerts ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'Pending';
ALTER TABLE public.emergency_alerts ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE public.emergency_alerts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE public.emergency_alerts ADD COLUMN IF NOT EXISTS dispatched_at TIMESTAMPTZ;
ALTER TABLE public.emergency_alerts ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_emergency_alerts_patient_status
  ON public.emergency_alerts (patient_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_emergency_alerts_hospital_status
  ON public.emergency_alerts (hospital_id, status, created_at DESC);

-- ============================================================================
-- opd_queue (token_number stays TEXT)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.opd_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL DEFAULT '11111111-1111-1111-1111-111111111111'
    REFERENCES public.hospitals(id),
  hospital_code TEXT NOT NULL DEFAULT 'HOSP-01',
  token_number TEXT NOT NULL,
  patient_id UUID NOT NULL,
  patient_name TEXT NOT NULL,
  doctor_id TEXT NOT NULL,
  doctor_name TEXT NOT NULL,
  age INTEGER NOT NULL DEFAULT 0,
  gender TEXT NOT NULL DEFAULT 'Unknown',
  blood_group TEXT,
  diagnosis TEXT,
  vitals JSONB DEFAULT '{"bp": "120/80", "hr": "72 bpm", "spo2": "98%"}'::jsonb,
  allergies TEXT[] DEFAULT '{}',
  priority TEXT DEFAULT 'ROUTINE',
  status TEXT DEFAULT 'SCHEDULED',
  appointment_date DATE DEFAULT CURRENT_DATE,
  slot_time TEXT,
  department TEXT,
  hospital_name TEXT DEFAULT 'Regal Hospital',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.opd_queue ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid();
ALTER TABLE public.opd_queue ADD COLUMN IF NOT EXISTS hospital_id UUID NOT NULL DEFAULT '11111111-1111-1111-1111-111111111111';
ALTER TABLE public.opd_queue ADD COLUMN IF NOT EXISTS hospital_code TEXT NOT NULL DEFAULT 'HOSP-01';
ALTER TABLE public.opd_queue ADD COLUMN IF NOT EXISTS token_number TEXT NOT NULL DEFAULT 'LEGACY';
ALTER TABLE public.opd_queue ADD COLUMN IF NOT EXISTS patient_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000';
ALTER TABLE public.opd_queue ADD COLUMN IF NOT EXISTS patient_name TEXT NOT NULL DEFAULT 'Unknown Patient';
ALTER TABLE public.opd_queue ADD COLUMN IF NOT EXISTS doctor_id TEXT NOT NULL DEFAULT 'UNKNOWN';
ALTER TABLE public.opd_queue ADD COLUMN IF NOT EXISTS doctor_name TEXT NOT NULL DEFAULT 'Unknown Doctor';
ALTER TABLE public.opd_queue ADD COLUMN IF NOT EXISTS age INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.opd_queue ADD COLUMN IF NOT EXISTS gender TEXT NOT NULL DEFAULT 'Unknown';
ALTER TABLE public.opd_queue ADD COLUMN IF NOT EXISTS blood_group TEXT;
ALTER TABLE public.opd_queue ADD COLUMN IF NOT EXISTS diagnosis TEXT;
ALTER TABLE public.opd_queue ADD COLUMN IF NOT EXISTS vitals JSONB DEFAULT '{"bp": "120/80", "hr": "72 bpm", "spo2": "98%"}'::jsonb;
ALTER TABLE public.opd_queue ADD COLUMN IF NOT EXISTS allergies TEXT[] DEFAULT '{}';
ALTER TABLE public.opd_queue ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'ROUTINE';
ALTER TABLE public.opd_queue ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'SCHEDULED';
ALTER TABLE public.opd_queue ADD COLUMN IF NOT EXISTS appointment_date DATE DEFAULT CURRENT_DATE;
ALTER TABLE public.opd_queue ADD COLUMN IF NOT EXISTS slot_time TEXT;
ALTER TABLE public.opd_queue ADD COLUMN IF NOT EXISTS department TEXT;
ALTER TABLE public.opd_queue ADD COLUMN IF NOT EXISTS hospital_name TEXT DEFAULT 'Regal Hospital';
ALTER TABLE public.opd_queue ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now());
ALTER TABLE public.opd_queue ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now());

CREATE INDEX IF NOT EXISTS idx_opd_queue_doctor_status
  ON public.opd_queue (doctor_id, status, created_at);

CREATE INDEX IF NOT EXISTS idx_opd_queue_patient
  ON public.opd_queue (patient_id, created_at DESC);

-- ============================================================================
-- clinical_notes
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.clinical_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL,
  doctor_id TEXT NOT NULL,
  doctor_name TEXT NOT NULL,
  diagnosis_disease TEXT,
  prescription TEXT NOT NULL DEFAULT '',
  clinical_advice TEXT,
  queue_id UUID REFERENCES public.opd_queue(id) ON DELETE SET NULL,
  department TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.clinical_notes ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid();
ALTER TABLE public.clinical_notes ADD COLUMN IF NOT EXISTS patient_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000';
ALTER TABLE public.clinical_notes ADD COLUMN IF NOT EXISTS doctor_id TEXT NOT NULL DEFAULT 'UNKNOWN';
ALTER TABLE public.clinical_notes ADD COLUMN IF NOT EXISTS doctor_name TEXT NOT NULL DEFAULT 'Unknown Doctor';
ALTER TABLE public.clinical_notes ADD COLUMN IF NOT EXISTS diagnosis_disease TEXT;
ALTER TABLE public.clinical_notes ADD COLUMN IF NOT EXISTS prescription TEXT NOT NULL DEFAULT '';
ALTER TABLE public.clinical_notes ADD COLUMN IF NOT EXISTS clinical_advice TEXT;
ALTER TABLE public.clinical_notes ADD COLUMN IF NOT EXISTS queue_id UUID;
ALTER TABLE public.clinical_notes ADD COLUMN IF NOT EXISTS department TEXT;
ALTER TABLE public.clinical_notes ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now());

CREATE INDEX IF NOT EXISTS idx_clinical_notes_patient_rt
  ON public.clinical_notes (patient_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_clinical_notes_doctor
  ON public.clinical_notes (doctor_id, created_at DESC);

COMMIT;
