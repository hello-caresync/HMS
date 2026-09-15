-- Nexora Doctor App supporting tables.
-- Run once in Supabase SQL Editor after the core patient/hospital schema.

ALTER TABLE IF EXISTS patient_appointments
  ADD COLUMN IF NOT EXISTS current_serving_token INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_emergency BOOLEAN NOT NULL DEFAULT FALSE;

CREATE UNIQUE INDEX IF NOT EXISTS uq_patient_appointments_doctor_date_token
  ON patient_appointments (doctor_name, appointment_date, token_number);

ALTER TABLE IF EXISTS patient_messages
  ADD COLUMN IF NOT EXISTS doctor_employee_id TEXT,
  ADD COLUMN IF NOT EXISTS priority TEXT NOT NULL DEFAULT 'normal',
  ADD COLUMN IF NOT EXISTS sender_type TEXT NOT NULL DEFAULT 'doctor',
  ADD COLUMN IF NOT EXISTS is_read BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS attachment_name TEXT,
  ADD COLUMN IF NOT EXISTS attachment_size BIGINT,
  ADD COLUMN IF NOT EXISTS attachment_type TEXT,
  ADD COLUMN IF NOT EXISTS attachment_path TEXT,
  ADD COLUMN IF NOT EXISTS attachment_url TEXT;

ALTER TABLE IF EXISTS hospital_members
  ADD COLUMN IF NOT EXISTS signature_type TEXT,
  ADD COLUMN IF NOT EXISTS signature_text TEXT,
  ADD COLUMN IF NOT EXISTS signature_file_path TEXT,
  ADD COLUMN IF NOT EXISTS signature_file_url TEXT;

CREATE TABLE IF NOT EXISTS doctor_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_employee_id TEXT NOT NULL,
  doctor_name TEXT NOT NULL,
  schedule_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  daily_patient_limit INTEGER NOT NULL DEFAULT 30,
  is_on_leave BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT doctor_schedule_valid_range CHECK (end_time > start_time),
  CONSTRAINT doctor_schedule_unique_slot
    UNIQUE (doctor_employee_id, schedule_date, start_time, end_time)
);

ALTER TABLE IF EXISTS doctor_schedules
  ADD COLUMN IF NOT EXISTS daily_patient_limit INTEGER NOT NULL DEFAULT 30,
  ADD COLUMN IF NOT EXISTS is_on_leave BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_doctor_schedules_employee_date
  ON doctor_schedules (doctor_employee_id, schedule_date);

CREATE TABLE IF NOT EXISTS medical_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id TEXT NOT NULL,
  patient_name TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_url TEXT,
  uploaded_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_medical_records_patient
  ON medical_records (patient_id, created_at DESC);

CREATE TABLE IF NOT EXISTS opd_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_number INTEGER NOT NULL,
  patient_name TEXT NOT NULL,
  patient_age INTEGER,
  patient_gender TEXT,
  doctor_name TEXT,
  doctor_employee_id TEXT,
  department TEXT,
  priority TEXT NOT NULL DEFAULT 'ROUTINE',
  status TEXT NOT NULL DEFAULT 'WAITING',
  vitals_bp TEXT,
  vitals_hr TEXT,
  vitals_spo2 TEXT,
  allergies TEXT,
  appointment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT opd_queue_priority_check
    CHECK (priority IN ('EMERGENCY', 'URGENT', 'ROUTINE')),
  CONSTRAINT opd_queue_status_check
    CHECK (status IN ('WAITING', 'CALLED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'))
);

CREATE INDEX IF NOT EXISTS idx_opd_queue_doctor_date
  ON opd_queue (doctor_name, appointment_date, token_number);

CREATE TABLE IF NOT EXISTS clinical_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_id UUID REFERENCES opd_queue(id) ON DELETE SET NULL,
  patient_name TEXT NOT NULL,
  doctor_name TEXT NOT NULL,
  doctor_employee_id TEXT,
  prescription TEXT,
  clinical_notes TEXT,
  vitals_snapshot JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_clinical_notes_patient
  ON clinical_notes (patient_name, created_at DESC);

ALTER TABLE doctor_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE opd_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "doctor_schedules_v0_all" ON doctor_schedules;
CREATE POLICY "doctor_schedules_v0_all"
  ON doctor_schedules FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "medical_records_v0_all" ON medical_records;
CREATE POLICY "medical_records_v0_all"
  ON medical_records FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "opd_queue_v0_all" ON opd_queue;
CREATE POLICY "opd_queue_v0_all"
  ON opd_queue FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "clinical_notes_v0_all" ON clinical_notes;
CREATE POLICY "clinical_notes_v0_all"
  ON clinical_notes FOR ALL USING (true) WITH CHECK (true);

INSERT INTO storage.buckets (id, name, public)
VALUES ('medical-records', 'medical-records', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES
  ('prescription-attachments', 'prescription-attachments', false),
  ('doctor-signatures', 'doctor-signatures', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "medical_records_storage_v0_all" ON storage.objects;
CREATE POLICY "medical_records_storage_v0_all"
  ON storage.objects FOR ALL
  USING (bucket_id = 'medical-records')
  WITH CHECK (bucket_id = 'medical-records');

DROP POLICY IF EXISTS "doctor_clinical_storage_v0_all" ON storage.objects;
CREATE POLICY "doctor_clinical_storage_v0_all"
  ON storage.objects FOR ALL
  USING (bucket_id IN ('prescription-attachments', 'doctor-signatures'))
  WITH CHECK (bucket_id IN ('prescription-attachments', 'doctor-signatures'));

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE doctor_schedules;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE patient_appointments;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE patient_messages;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE opd_queue;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE clinical_notes;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
