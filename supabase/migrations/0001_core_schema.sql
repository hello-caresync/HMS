BEGIN;

-- Canonical core schema (Phase 4 consolidation)
-- Sources: regal-enterprise-platform.sql + appointments-pipeline-align.sql
-- Safe on existing databases: CREATE TABLE IF NOT EXISTS + ADD COLUMN IF NOT EXISTS per column.

-- ============================================================================
-- Reference: hospitals (tenant root for hospital_id UUID FKs)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.hospitals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  facility_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.hospitals ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid();
ALTER TABLE public.hospitals ADD COLUMN IF NOT EXISTS hospital_code TEXT NOT NULL DEFAULT 'HOSP-01';
ALTER TABLE public.hospitals ADD COLUMN IF NOT EXISTS name TEXT NOT NULL DEFAULT 'Regal Hospital';
ALTER TABLE public.hospitals ADD COLUMN IF NOT EXISTS facility_code TEXT;
ALTER TABLE public.hospitals ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Legacy hospitals columns (pre-Phase-4 schemas — e.g. city/status NOT NULL on live DBs)
ALTER TABLE public.hospitals ADD COLUMN IF NOT EXISTS city TEXT NOT NULL DEFAULT 'Bengaluru';
ALTER TABLE public.hospitals ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'Active';
ALTER TABLE public.hospitals ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE public.hospitals ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.hospitals ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE public.hospitals ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'India';
ALTER TABLE public.hospitals ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.hospitals ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.hospitals ADD COLUMN IF NOT EXISTS email TEXT;

-- Backfill canonical seed row without wiping existing data
UPDATE public.hospitals
SET
  hospital_code = COALESCE(hospital_code, 'HOSP-01'),
  name = COALESCE(name, 'Regal Hospital'),
  facility_code = COALESCE(facility_code, 'RH-BLR-01'),
  city = COALESCE(city, 'Bengaluru'),
  status = COALESCE(status, 'Active'),
  is_active = COALESCE(is_active, true),
  updated_at = COALESCE(updated_at, now())
WHERE id = '11111111-1111-1111-1111-111111111111';

INSERT INTO public.hospitals (id, name, hospital_code, facility_code, city, status, is_active)
SELECT
  '11111111-1111-1111-1111-111111111111'::uuid,
  'Regal Hospital',
  'HOSP-01',
  'RH-BLR-01',
  'Bengaluru',
  'Active',
  true
WHERE NOT EXISTS (
  SELECT 1 FROM public.hospitals WHERE id = '11111111-1111-1111-1111-111111111111'
);

-- ============================================================================
-- appointments
-- PK: id (canonical). Legacy appointment_id alias removed.
-- hospital_id: UUID FK; human-readable tenant code in hospital_code.
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL DEFAULT '11111111-1111-1111-1111-111111111111'
    REFERENCES public.hospitals(id),
  hospital_code TEXT NOT NULL DEFAULT 'HOSP-01',
  facility_code VARCHAR(50) DEFAULT 'RH-BLR-01',
  token_number VARCHAR(20) NOT NULL,
  uhid VARCHAR(50) NOT NULL,
  patient_id UUID,
  patient_name VARCHAR(150) NOT NULL,
  patient_phone VARCHAR(20),
  phone TEXT,
  age VARCHAR(10),
  gender VARCHAR(20),
  doctor_id TEXT NOT NULL,
  doctor_code VARCHAR(50),
  doctor_employee_id TEXT,
  doctor_name VARCHAR(150) NOT NULL,
  department VARCHAR(100) NOT NULL,
  appointment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status VARCHAR(50) NOT NULL DEFAULT 'checked_in',
  chief_complaint TEXT,
  fee NUMERIC NOT NULL DEFAULT 800,
  source VARCHAR(50) DEFAULT 'hospital_walkin',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid();
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS hospital_id UUID NOT NULL DEFAULT '11111111-1111-1111-1111-111111111111';
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS hospital_code TEXT NOT NULL DEFAULT 'HOSP-01';
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS facility_code VARCHAR(50) DEFAULT 'RH-BLR-01';
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS token_number VARCHAR(20) NOT NULL DEFAULT 'LEGACY';
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS uhid VARCHAR(50) NOT NULL DEFAULT 'UNKNOWN';
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS patient_id UUID;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS patient_name VARCHAR(150) NOT NULL DEFAULT 'Unknown Patient';
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS patient_phone VARCHAR(20);
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS age VARCHAR(10);
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS gender VARCHAR(20);
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS doctor_id TEXT NOT NULL DEFAULT 'UNKNOWN';
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS doctor_code VARCHAR(50);
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS doctor_employee_id TEXT;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS doctor_name VARCHAR(150) NOT NULL DEFAULT 'Unknown Doctor';
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS department VARCHAR(100) NOT NULL DEFAULT 'General';
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS appointment_date DATE NOT NULL DEFAULT CURRENT_DATE;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS status VARCHAR(50) NOT NULL DEFAULT 'checked_in';
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS chief_complaint TEXT;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS fee NUMERIC NOT NULL DEFAULT 800;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'hospital_walkin';
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_appointments_hospital_date
  ON public.appointments (hospital_id, appointment_date DESC);

CREATE INDEX IF NOT EXISTS idx_appointments_doctor
  ON public.appointments (doctor_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_appointments_doctor_code
  ON public.appointments (doctor_code, appointment_date DESC);

CREATE INDEX IF NOT EXISTS idx_appointments_doctor_id
  ON public.appointments (doctor_id, appointment_date DESC);

CREATE INDEX IF NOT EXISTS idx_appointments_hospital_code
  ON public.appointments (hospital_code, appointment_date DESC);

COMMIT;
