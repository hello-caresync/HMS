-- Hospital ↔ Doctor OPD bridge (Regal RH-BLR-01)
-- Aligns walk-in writes from Hospital Operations with Doctor Command Center reads.
-- Safe to re-run.

-- ─── Appointments: dual hospital + doctor columns ───────────────────────────
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS appointment_id UUID;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS id UUID;

ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS hospital_id UUID,
  ADD COLUMN IF NOT EXISTS token_number TEXT,
  ADD COLUMN IF NOT EXISTS uhid TEXT,
  ADD COLUMN IF NOT EXISTS patient_name TEXT,
  ADD COLUMN IF NOT EXISTS age TEXT,
  ADD COLUMN IF NOT EXISTS gender TEXT,
  ADD COLUMN IF NOT EXISTS doctor_name TEXT,
  ADD COLUMN IF NOT EXISTS doctor_code TEXT,
  ADD COLUMN IF NOT EXISTS doctor_employee_id TEXT,
  ADD COLUMN IF NOT EXISTS chief_complaint TEXT,
  ADD COLUMN IF NOT EXISTS reason_for_visit TEXT,
  ADD COLUMN IF NOT EXISTS fee NUMERIC(12, 2),
  ADD COLUMN IF NOT EXISTS source TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

UPDATE public.appointments SET appointment_id = id WHERE appointment_id IS NULL AND id IS NOT NULL;
UPDATE public.appointments SET id = appointment_id WHERE id IS NULL AND appointment_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_appointments_hospital_date
  ON public.appointments (hospital_id, appointment_date DESC);

CREATE INDEX IF NOT EXISTS idx_appointments_doctor_code
  ON public.appointments (doctor_code, appointment_date DESC);

-- ─── Patients: walk-in registry extensions ──────────────────────────────────
ALTER TABLE public.patients
  ADD COLUMN IF NOT EXISTS name TEXT,
  ADD COLUMN IF NOT EXISTS chief_complaint TEXT,
  ADD COLUMN IF NOT EXISTS doctor_id TEXT,
  ADD COLUMN IF NOT EXISTS doctor_name TEXT,
  ADD COLUMN IF NOT EXISTS ehr_status TEXT,
  ADD COLUMN IF NOT EXISTS admission_status TEXT,
  ADD COLUMN IF NOT EXISTS last_visit DATE;

-- ─── OPD token on hospital check-in ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.ensure_opd_token_on_confirm()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF lower(NEW.status) IN ('confirmed', 'checked_in', 'waiting', 'scheduled')
     AND lower(COALESCE(OLD.status, '')) NOT IN ('confirmed', 'checked_in', 'waiting', 'scheduled', 'in_progress') THEN
    PERFORM public.issue_opd_token_for_appointment(NEW);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_appointment_confirm_token ON public.appointments;
CREATE TRIGGER trg_appointment_confirm_token
  AFTER INSERT OR UPDATE OF status ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_opd_token_on_confirm();

-- ─── Realtime publication ───────────────────────────────────────────────────
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.opd_tokens;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;
