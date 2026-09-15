-- Align appointments + OPD queue with Hospital OS tenant codes (HOSP-01)
-- and clinician codes (RH-D##). Safe to re-run.

-- hospital_id must accept HOSP-01 (staff/patient sessions), not only UUIDs.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'appointments'
      AND column_name = 'hospital_id'
      AND data_type = 'uuid'
  ) THEN
    ALTER TABLE public.appointments
      ALTER COLUMN hospital_id TYPE TEXT USING hospital_id::text;
  END IF;
END $$;

ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS hospital_id TEXT;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS hospital_code TEXT;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS facility_code TEXT;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS doctor_id TEXT;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS doctor_code TEXT;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS doctor_employee_id TEXT;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS doctor_name TEXT;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS department TEXT;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS uhid TEXT;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS patient_name TEXT;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS appointment_date DATE;

UPDATE public.appointments
SET hospital_id = 'HOSP-01'
WHERE hospital_id IS NULL
   OR hospital_id IN (
     '11111111-1111-1111-1111-111111111111',
     'RH-BLR-01'
   );

UPDATE public.appointments
SET hospital_code = COALESCE(NULLIF(hospital_code, ''), 'HOSP-01'),
    facility_code = COALESCE(NULLIF(facility_code, ''), 'RH-BLR-01')
WHERE hospital_id = 'HOSP-01';

ALTER TABLE public.hospital_opd_queue ADD COLUMN IF NOT EXISTS doctor_id TEXT;
ALTER TABLE public.patient_appointments ADD COLUMN IF NOT EXISTS hospital_id TEXT;
ALTER TABLE public.patient_appointments ADD COLUMN IF NOT EXISTS doctor_id TEXT;
ALTER TABLE public.patient_appointments ADD COLUMN IF NOT EXISTS doctor_code TEXT;
ALTER TABLE public.patient_appointments ADD COLUMN IF NOT EXISTS doctor_employee_id TEXT;
ALTER TABLE public.patient_appointments ADD COLUMN IF NOT EXISTS doctor_name TEXT;
ALTER TABLE public.patient_appointments ADD COLUMN IF NOT EXISTS department TEXT;

UPDATE public.patient_appointments
SET hospital_id = COALESCE(NULLIF(hospital_id, ''), 'HOSP-01')
WHERE hospital_id IS NULL OR hospital_id = '';

CREATE INDEX IF NOT EXISTS idx_appointments_hospital_id
  ON public.appointments (hospital_id, appointment_date DESC);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_code
  ON public.appointments (doctor_code, appointment_date DESC);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_id
  ON public.appointments (doctor_id, appointment_date DESC);
