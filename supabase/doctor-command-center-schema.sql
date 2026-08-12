-- CuraSync Doctor Command Center — canonical shared-backend schema
-- Run in Supabase SQL Editor. Safe to re-run (IF NOT EXISTS / OR REPLACE).

-- ─── Doctors ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.doctors (
  doctor_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_code VARCHAR UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT,
  specialization TEXT,
  department TEXT,
  registration_number TEXT UNIQUE,
  availability_hours TEXT,
  working_days TEXT,
  is_notifications_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS doctor_code VARCHAR;
CREATE UNIQUE INDEX IF NOT EXISTS doctors_doctor_code_key ON public.doctors (doctor_code) WHERE doctor_code IS NOT NULL;
UPDATE public.doctors SET doctor_code = registration_number WHERE doctor_code IS NULL AND registration_number IS NOT NULL;

-- ─── Patient profiles (shared with Patient App) ────────────────────────────
CREATE TABLE IF NOT EXISTS public.patient_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  dob DATE,
  gender TEXT,
  blood_group TEXT,
  allergies TEXT,
  chronic_conditions TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── Appointments ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.appointments (
  appointment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES public.patient_profiles(id),
  doctor_id UUID REFERENCES public.doctors(doctor_id),
  department TEXT,
  reason_for_visit TEXT,
  appointment_date DATE,
  appointment_time TIME,
  status TEXT DEFAULT 'SCHEDULED',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── OPD Tokens ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.opd_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID REFERENCES public.appointments(appointment_id),
  doctor_id UUID REFERENCES public.doctors(doctor_id),
  patient_id UUID REFERENCES public.patient_profiles(id),
  token_number TEXT NOT NULL,
  sequence_number INT NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'ISSUED'
    CHECK (status IN ('ISSUED','CALLED','IN_CONSULTATION','COMPLETED','SKIPPED','CANCELLED')),
  estimated_wait_minutes INT,
  called_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── Consultations ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.consultations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID REFERENCES public.appointments(appointment_id),
  patient_id UUID REFERENCES public.patient_profiles(id),
  doctor_id UUID REFERENCES public.doctors(doctor_id),
  chief_complaint TEXT,
  symptoms TEXT[] DEFAULT '{}',
  clinical_examination TEXT,
  doctor_notes TEXT,
  follow_up_date DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── Diagnoses ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.diagnoses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultation_id UUID REFERENCES public.consultations(id),
  patient_id UUID REFERENCES public.patient_profiles(id),
  primary_diagnosis TEXT,
  secondary_diagnosis TEXT,
  icd10_code TEXT,
  severity TEXT CHECK (severity IN ('Mild','Moderate','Severe','Critical')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── Prescriptions ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.prescriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultation_id UUID REFERENCES public.consultations(id),
  patient_id UUID REFERENCES public.patient_profiles(id),
  doctor_id UUID REFERENCES public.doctors(doctor_id),
  signed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.prescription_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prescription_id UUID REFERENCES public.prescriptions(id) ON DELETE CASCADE,
  medicine_name TEXT NOT NULL,
  dosage TEXT,
  frequency TEXT,
  duration TEXT,
  instructions TEXT
);

-- ─── Lab orders ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.lab_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultation_id UUID REFERENCES public.consultations(id),
  patient_id UUID REFERENCES public.patient_profiles(id),
  doctor_id UUID REFERENCES public.doctors(doctor_id),
  test_names TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'ORDERED'
    CHECK (status IN ('ORDERED','PROCESSING','REPORT_READY','CANCELLED')),
  report_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── Emergency alerts ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.emergency_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES public.patient_profiles(id),
  doctor_id UUID REFERENCES public.doctors(doctor_id),
  location TEXT,
  severity TEXT DEFAULT 'HIGH',
  status TEXT DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── Live queue view ─────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW public.view_live_doctor_queue AS
SELECT
  ot.id,
  ot.id AS token_id,
  ot.appointment_id,
  ot.doctor_id,
  ot.patient_id,
  ot.token_number,
  ot.sequence_number,
  ot.status,
  ot.estimated_wait_minutes,
  ot.called_at,
  ot.completed_at,
  a.department,
  a.reason_for_visit,
  a.reason_for_visit AS chief_complaint,
  a.appointment_date,
  a.appointment_time,
  a.status AS appointment_status,
  pp.full_name AS patient_name,
  pp.gender,
  pp.blood_group,
  pp.allergies,
  pp.chronic_conditions,
  pp.dob,
  pp.phone
FROM public.opd_tokens ot
LEFT JOIN public.appointments a ON a.appointment_id = ot.appointment_id
LEFT JOIN public.patient_profiles pp ON pp.id = ot.patient_id;

-- ─── RPC: call_next_patient ──────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.call_next_patient(p_doctor_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_token public.opd_tokens%ROWTYPE;
BEGIN
  SELECT * INTO v_token
  FROM public.opd_tokens
  WHERE doctor_id = p_doctor_id AND status = 'ISSUED'
  ORDER BY sequence_number ASC
  LIMIT 1
  FOR UPDATE SKIP LOCKED;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  UPDATE public.opd_tokens
  SET status = 'CALLED', called_at = now()
  WHERE id = v_token.id;

  RETURN (
    SELECT to_jsonb(v.*)
    FROM public.view_live_doctor_queue v
    WHERE v.id = v_token.id
  );
END;
$$;

-- ─── RPC: complete_consultation_encounter ────────────────────────────────────
CREATE OR REPLACE FUNCTION public.complete_consultation_encounter(
  p_consultation_id UUID,
  p_chief_complaint TEXT,
  p_symptoms TEXT[],
  p_clinical_examination TEXT,
  p_doctor_notes TEXT,
  p_primary_diagnosis TEXT,
  p_icd10_code TEXT,
  p_diagnosis_severity TEXT,
  p_prescriptions JSONB,
  p_follow_up_date DATE DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_consult public.consultations%ROWTYPE;
  v_rx_id UUID;
  v_item JSONB;
  v_token_id UUID;
BEGIN
  SELECT * INTO v_consult FROM public.consultations WHERE id = p_consultation_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Consultation not found';
  END IF;

  UPDATE public.consultations SET
    chief_complaint = p_chief_complaint,
    symptoms = p_symptoms,
    clinical_examination = p_clinical_examination,
    doctor_notes = p_doctor_notes,
    follow_up_date = p_follow_up_date
  WHERE id = p_consultation_id;

  INSERT INTO public.diagnoses (
    consultation_id, patient_id, primary_diagnosis, icd10_code, severity
  ) VALUES (
    p_consultation_id, v_consult.patient_id, p_primary_diagnosis, p_icd10_code, p_diagnosis_severity
  );

  INSERT INTO public.prescriptions (consultation_id, patient_id, doctor_id, signed_at)
  VALUES (p_consultation_id, v_consult.patient_id, v_consult.doctor_id, now())
  RETURNING id INTO v_rx_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_prescriptions)
  LOOP
    INSERT INTO public.prescription_items (
      prescription_id, medicine_name, dosage, frequency, duration, instructions
    ) VALUES (
      v_rx_id,
      v_item->>'medicine_name',
      v_item->>'dosage',
      v_item->>'frequency',
      v_item->>'duration',
      v_item->>'instructions'
    );
  END LOOP;

  UPDATE public.opd_tokens
  SET status = 'COMPLETED', completed_at = now()
  WHERE appointment_id = v_consult.appointment_id AND doctor_id = v_consult.doctor_id
  RETURNING id INTO v_token_id;

  UPDATE public.appointments
  SET status = 'COMPLETED'
  WHERE appointment_id = v_consult.appointment_id;
END;
$$;

-- ─── Auto-create OPD token when Patient App inserts appointment ─────────────
CREATE OR REPLACE FUNCTION public.create_opd_token_on_appointment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_seq INT;
  v_token TEXT;
BEGIN
  IF NEW.status NOT IN ('WAITING', 'SCHEDULED') THEN
    RETURN NEW;
  END IF;

  IF EXISTS (SELECT 1 FROM public.opd_tokens WHERE appointment_id = NEW.appointment_id) THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(MAX(ot.sequence_number), 0) + 1
  INTO v_seq
  FROM public.opd_tokens ot
  INNER JOIN public.appointments a ON a.appointment_id = ot.appointment_id
  WHERE ot.doctor_id = NEW.doctor_id
    AND a.appointment_date = NEW.appointment_date;

  IF v_seq IS NULL OR v_seq < 1 THEN
    v_seq := 1;
  END IF;

  v_token := '#' || v_seq::TEXT;

  INSERT INTO public.opd_tokens (
    appointment_id,
    doctor_id,
    patient_id,
    token_number,
    sequence_number,
    status,
    estimated_wait_minutes
  ) VALUES (
    NEW.appointment_id,
    NEW.doctor_id,
    NEW.patient_id,
    v_token,
    v_seq,
    'ISSUED',
    15
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_appointment_opd_token ON public.appointments;
CREATE TRIGGER trg_appointment_opd_token
  AFTER INSERT ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.create_opd_token_on_appointment();

-- ─── Realtime publication ────────────────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE public.opd_tokens;
ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.emergency_alerts;
