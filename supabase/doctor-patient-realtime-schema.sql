-- CuraSync Doctor ↔ Patient realtime schema extensions
-- Run after doctor-command-center-schema.sql in Supabase SQL Editor.

-- ─── Doctor appointments view ───────────────────────────────────────────────
CREATE OR REPLACE VIEW public.doctor_appointments_view AS
SELECT
  a.appointment_id,
  a.patient_id,
  a.doctor_id,
  a.department,
  a.reason_for_visit,
  a.appointment_date,
  a.appointment_time,
  a.status,
  a.created_at,
  pp.full_name AS patient_name,
  pp.phone AS patient_phone,
  pp.gender AS patient_gender,
  pp.dob AS patient_dob,
  pp.blood_group AS patient_blood_group,
  d.full_name AS doctor_name,
  d.email AS doctor_email,
  ot.id AS token_id,
  ot.token_number,
  ot.sequence_number,
  ot.status AS token_status,
  ot.estimated_wait_minutes
FROM public.appointments a
LEFT JOIN public.patient_profiles pp ON pp.id = a.patient_id
LEFT JOIN public.doctors d ON d.doctor_id = a.doctor_id
LEFT JOIN public.opd_tokens ot ON ot.appointment_id = a.appointment_id;

-- ─── Vitals (per consultation) ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.vitals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultation_id UUID REFERENCES public.consultations(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES public.patient_profiles(id),
  temperature NUMERIC(4,1),
  blood_pressure TEXT,
  pulse INT,
  spo2 INT,
  weight NUMERIC(5,2),
  recorded_at TIMESTAMPTZ DEFAULT now()
);

-- ─── Medical records inbox (Patient App) ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.medical_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES public.patient_profiles(id),
  doctor_id UUID REFERENCES public.doctors(doctor_id),
  consultation_id UUID REFERENCES public.consultations(id),
  appointment_id UUID REFERENCES public.appointments(appointment_id),
  record_type TEXT NOT NULL DEFAULT 'consultation_summary',
  summary TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS medical_records_patient_idx ON public.medical_records (patient_id, created_at DESC);

-- Shared helper: issue OPD token for an appointment row
CREATE OR REPLACE FUNCTION public.issue_opd_token_for_appointment(p_appt public.appointments)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_seq INT;
  v_token TEXT;
BEGIN
  IF EXISTS (SELECT 1 FROM public.opd_tokens WHERE appointment_id = p_appt.appointment_id) THEN
    RETURN;
  END IF;

  SELECT COALESCE(MAX(ot.sequence_number), 0) + 1
  INTO v_seq
  FROM public.opd_tokens ot
  INNER JOIN public.appointments a ON a.appointment_id = ot.appointment_id
  WHERE ot.doctor_id = p_appt.doctor_id
    AND a.appointment_date = p_appt.appointment_date;

  IF v_seq IS NULL OR v_seq < 1 THEN
    v_seq := 1;
  END IF;

  v_token := '#' || v_seq::TEXT;

  INSERT INTO public.opd_tokens (
    appointment_id, doctor_id, patient_id,
    token_number, sequence_number, status, estimated_wait_minutes
  ) VALUES (
    p_appt.appointment_id, p_appt.doctor_id, p_appt.patient_id,
    v_token, v_seq, 'ISSUED', GREATEST(5, (v_seq - 1) * 12)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.create_opd_token_on_appointment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF lower(NEW.status) NOT IN ('waiting', 'scheduled', 'requested', 'confirmed') THEN
    RETURN NEW;
  END IF;

  PERFORM public.issue_opd_token_for_appointment(NEW);
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.ensure_opd_token_on_confirm()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF lower(NEW.status) = 'confirmed'
     AND lower(COALESCE(OLD.status, '')) <> 'confirmed' THEN
    PERFORM public.issue_opd_token_for_appointment(NEW);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_appointment_confirm_token ON public.appointments;
CREATE TRIGGER trg_appointment_confirm_token
  AFTER UPDATE OF status ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_opd_token_on_confirm();

-- ─── Row Level Security (Phase 8) ────────────────────────────────────────────
-- Resolves authenticated doctor UUID from JWT email for doctor_id-scoped access.

CREATE OR REPLACE FUNCTION public.current_doctor_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT doctor_id FROM public.doctors WHERE email = auth.jwt() ->> 'email' LIMIT 1;
$$;

ALTER TABLE public.patient_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vitals ENABLE ROW LEVEL SECURITY;

-- Patients: own profile
DROP POLICY IF EXISTS patient_profiles_self ON public.patient_profiles;
CREATE POLICY patient_profiles_self ON public.patient_profiles
  FOR ALL
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Doctors: read patients with active appointments
DROP POLICY IF EXISTS patient_profiles_doctor_read ON public.patient_profiles;
CREATE POLICY patient_profiles_doctor_read ON public.patient_profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.appointments a
      INNER JOIN public.doctors d ON d.doctor_id = a.doctor_id
      WHERE a.patient_id = patient_profiles.id
        AND d.email = auth.jwt() ->> 'email'
    )
  );

-- Appointments: patient owns inserts/reads
DROP POLICY IF EXISTS appointments_patient ON public.appointments;
CREATE POLICY appointments_patient ON public.appointments
  FOR ALL
  USING (auth.uid() = patient_id)
  WITH CHECK (auth.uid() = patient_id);

-- Appointments: doctor read/update where doctor_id matches authenticated profile
DROP POLICY IF EXISTS appointments_doctor ON public.appointments;
CREATE POLICY appointments_doctor ON public.appointments
  FOR ALL
  USING (doctor_id = public.current_doctor_id())
  WITH CHECK (doctor_id = public.current_doctor_id());

-- Consultations
DROP POLICY IF EXISTS consultations_parties ON public.consultations;
CREATE POLICY consultations_parties ON public.consultations
  FOR ALL
  USING (
    auth.uid() = patient_id
    OR doctor_id = public.current_doctor_id()
  );

-- Prescriptions
DROP POLICY IF EXISTS prescriptions_parties ON public.prescriptions;
CREATE POLICY prescriptions_parties ON public.prescriptions
  FOR ALL
  USING (
    auth.uid() = patient_id
    OR doctor_id = public.current_doctor_id()
  );

-- Medical records inbox
DROP POLICY IF EXISTS medical_records_patient ON public.medical_records;
CREATE POLICY medical_records_patient ON public.medical_records
  FOR SELECT
  USING (auth.uid() = patient_id);

DROP POLICY IF EXISTS medical_records_doctor ON public.medical_records;
CREATE POLICY medical_records_doctor ON public.medical_records
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.doctors d
      WHERE d.doctor_id = medical_records.doctor_id
        AND d.email = auth.jwt() ->> 'email'
    )
  );

-- Vitals
DROP POLICY IF EXISTS vitals_parties ON public.vitals;
CREATE POLICY vitals_parties ON public.vitals
  FOR ALL
  USING (
    auth.uid() = patient_id
    OR EXISTS (
      SELECT 1 FROM public.consultations c
      INNER JOIN public.doctors d ON d.doctor_id = c.doctor_id
      WHERE c.id = vitals.consultation_id
        AND d.email = auth.jwt() ->> 'email'
    )
  );

-- Dev fallback: allow anon when JWT email missing (local demo without Supabase Auth)
DROP POLICY IF EXISTS appointments_anon_dev ON public.appointments;
CREATE POLICY appointments_anon_dev ON public.appointments
  FOR ALL
  USING (auth.jwt() ->> 'email' IS NULL)
  WITH CHECK (auth.jwt() ->> 'email' IS NULL);

DROP POLICY IF EXISTS patient_profiles_anon_dev ON public.patient_profiles;
CREATE POLICY patient_profiles_anon_dev ON public.patient_profiles
  FOR ALL
  USING (auth.jwt() ->> 'email' IS NULL)
  WITH CHECK (auth.jwt() ->> 'email' IS NULL);

ALTER PUBLICATION supabase_realtime ADD TABLE public.medical_records;
