-- Patient App → Hospital Reception unified appointments bridge (Regal RH-BLR-01)
-- Run in Supabase SQL Editor. Safe to re-run.

-- ─── 1. Align appointments table with cross-app columns ─────────────────────
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS facility_code VARCHAR(50) DEFAULT 'RH-BLR-01',
  ADD COLUMN IF NOT EXISTS hospital_code VARCHAR(50) DEFAULT 'RH-BLR-01',
  ADD COLUMN IF NOT EXISTS patient_uhid VARCHAR(100),
  ADD COLUMN IF NOT EXISTS appointment_time VARCHAR(50),
  ADD COLUMN IF NOT EXISTS slot_time VARCHAR(50),
  ADD COLUMN IF NOT EXISTS appointment_type VARCHAR(50) DEFAULT 'OPD Consultation',
  ADD COLUMN IF NOT EXISTS queue_number INT,
  ADD COLUMN IF NOT EXISTS reason_for_visit TEXT,
  ADD COLUMN IF NOT EXISTS patient_age INT,
  ADD COLUMN IF NOT EXISTS patient_gender VARCHAR(20),
  ADD COLUMN IF NOT EXISTS doctor_employee_id VARCHAR(100);

-- Backfill facility / uhid from legacy columns
UPDATE public.appointments
SET
  facility_code = COALESCE(facility_code, hospital_code, 'RH-BLR-01'),
  hospital_code = COALESCE(hospital_code, facility_code, 'RH-BLR-01'),
  patient_uhid = COALESCE(patient_uhid, uhid),
  appointment_time = COALESCE(appointment_time, scheduled_time::text),
  slot_time = COALESCE(slot_time, appointment_time),
  doctor_employee_id = COALESCE(doctor_employee_id, doctor_code, doctor_id::text)
WHERE facility_code IS NULL
   OR hospital_code IS NULL
   OR patient_uhid IS NULL
   OR appointment_time IS NULL;

-- ─── 2. Indexes for hospital reception + doctor portals ─────────────────────
CREATE INDEX IF NOT EXISTS idx_appointments_facility
  ON public.appointments (facility_code, appointment_date DESC);

CREATE INDEX IF NOT EXISTS idx_appointments_patient_uhid
  ON public.appointments (patient_uhid);

CREATE INDEX IF NOT EXISTS idx_appointments_created
  ON public.appointments (created_at DESC);

-- ─── 3. Row Level Security — open cross-role reads for patient + hospital ───
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "open_appointments_access" ON public.appointments;
CREATE POLICY "open_appointments_access" ON public.appointments
  FOR ALL TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- patient_appointments (patient app writes) — mirror policies if table exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'patient_appointments'
  ) THEN
    EXECUTE 'ALTER TABLE public.patient_appointments ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "open_patient_appointments_access" ON public.patient_appointments';
    EXECUTE '
      CREATE POLICY "open_patient_appointments_access" ON public.patient_appointments
        FOR ALL TO anon, authenticated USING (true) WITH CHECK (true)
    ';
  END IF;
END $$;

-- ─── 4. Supabase Realtime publication ───────────────────────────────────────
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'patient_appointments'
  ) THEN
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.patient_appointments;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
