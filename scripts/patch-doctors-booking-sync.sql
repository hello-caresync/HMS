-- Patient booking sync: patch EXISTING public.doctors (legacy schema-safe).
-- Run in Supabase SQL Editor. Safe to re-run.
-- Fixes: ERROR 42703 column "hospital_id" does not exist

-- 1) Create table only when missing entirely
CREATE TABLE IF NOT EXISTS public.doctors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2) Add booking / provisioning columns (legacy doctors table may lack these)
ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS hospital_id TEXT DEFAULT 'HOSP-01';
ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS hospital_code TEXT DEFAULT 'HOSP-01';
ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS hospital_name TEXT DEFAULT 'Regal Hospital';
ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS doctor_id TEXT;
ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS doctor_code TEXT;
ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS registration_number TEXT;
ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS doctor_name TEXT;
ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS department TEXT DEFAULT 'General Medicine';
ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS specialization TEXT;
ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS qualification TEXT DEFAULT 'MBBS, MD';
ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS consultation_fee NUMERIC(10,2) DEFAULT 500.00;
ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS fee NUMERIC(10,2) DEFAULT 500.00;
ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS experience TEXT;
ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS rating TEXT;
ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS available_days TEXT[] DEFAULT ARRAY['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS available_time_slots TEXT[] DEFAULT ARRAY['09:00 AM - 01:00 PM', '04:00 PM - 07:00 PM'];
ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT true;
ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS medical_license TEXT;
ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS specialty TEXT;
ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 3) Backfill legacy rows (::text casts — legacy doctor_id may be UUID)
UPDATE public.doctors
SET
  hospital_id = COALESCE(NULLIF(TRIM(hospital_id::text), ''), 'HOSP-01'),
  hospital_code = COALESCE(NULLIF(TRIM(hospital_code::text), ''), 'HOSP-01'),
  hospital_name = COALESCE(NULLIF(TRIM(hospital_name::text), ''), 'Regal Hospital'),
  full_name = COALESCE(
    NULLIF(TRIM(full_name::text), ''),
    NULLIF(TRIM(doctor_name::text), ''),
    NULLIF(TRIM(name::text), '')
  ),
  doctor_name = COALESCE(
    NULLIF(TRIM(doctor_name::text), ''),
    NULLIF(TRIM(full_name::text), ''),
    NULLIF(TRIM(name::text), '')
  ),
  name = COALESCE(
    NULLIF(TRIM(name::text), ''),
    NULLIF(TRIM(full_name::text), ''),
    NULLIF(TRIM(doctor_name::text), '')
  ),
  department = COALESCE(NULLIF(TRIM(department::text), ''), 'General Medicine'),
  is_available = COALESCE(is_available, true),
  is_active = COALESCE(is_active, true),
  status = COALESCE(NULLIF(TRIM(status::text), ''), 'active'),
  consultation_fee = COALESCE(consultation_fee, fee, 500.00),
  fee = COALESCE(fee, consultation_fee, 500.00)
WHERE true;

-- Mirror staff codes into TEXT alias columns (do not overwrite UUID doctor_id PK/FK)
UPDATE public.doctors
SET
  doctor_code = COALESCE(
    NULLIF(TRIM(doctor_code::text), ''),
    NULLIF(TRIM(registration_number::text), ''),
    NULLIF(TRIM(doctor_id::text), '')
  ),
  registration_number = COALESCE(
    NULLIF(TRIM(registration_number::text), ''),
    NULLIF(TRIM(doctor_code::text), ''),
    NULLIF(TRIM(doctor_id::text), '')
  )
WHERE true;

-- 4) Indexes (after columns exist)
CREATE INDEX IF NOT EXISTS idx_doctors_hospital_id ON public.doctors (hospital_id);
CREATE INDEX IF NOT EXISTS idx_doctors_email ON public.doctors (lower(email));
CREATE INDEX IF NOT EXISTS idx_doctors_doctor_code ON public.doctors (doctor_code);
CREATE UNIQUE INDEX IF NOT EXISTS idx_doctors_email_unique ON public.doctors (lower(email)) WHERE email IS NOT NULL;

-- 5) RLS + grants
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow_patients_view_doctors" ON public.doctors;
CREATE POLICY "allow_patients_view_doctors" ON public.doctors
  FOR SELECT USING (
    COALESCE(is_available, true) = true
    AND COALESCE(status, 'active') ILIKE 'active'
  );

DROP POLICY IF EXISTS "allow_admin_manage_doctors" ON public.doctors;
CREATE POLICY "allow_admin_manage_doctors" ON public.doctors
  FOR ALL USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.doctors TO anon, authenticated, service_role;

-- 6) Realtime (safe if already published)
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.doctors;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_object THEN NULL;
END $$;

NOTIFY pgrst, 'reload schema';

-- 7) Remove phantom seed clinician inserted by earlier patch versions (safe to re-run)
DELETE FROM public.doctors
WHERE lower(email) = 'ramesh.kumar@regalhospital.com'
   OR doctor_code = 'RH-D-GM01'
   OR registration_number = 'RH-D-GM01'
   OR full_name ILIKE 'Dr. Ramesh Kumar';

-- 8) Link Dr. Suriraju to General Medicine booking pool (safe to re-run)
UPDATE public.doctors
SET
  department = 'General Medicine',
  specialization = COALESCE(NULLIF(TRIM(specialization::text), ''), 'General Medicine'),
  specialty = COALESCE(NULLIF(TRIM(specialty::text), ''), 'General Medicine'),
  consultation_fee = COALESCE(consultation_fee, fee, 1200),
  fee = COALESCE(fee, consultation_fee, 1200),
  is_active = COALESCE(is_active, true),
  is_available = COALESCE(is_available, true),
  status = COALESCE(NULLIF(TRIM(status::text), ''), 'active'),
  hospital_id = COALESCE(NULLIF(TRIM(hospital_id::text), ''), 'HOSP-01'),
  hospital_code = COALESCE(NULLIF(TRIM(hospital_code::text), ''), 'HOSP-01'),
  updated_at = NOW()
WHERE full_name ILIKE '%Suriraju%'
   OR doctor_name ILIKE '%Suriraju%'
   OR name ILIKE '%Suriraju%';

-- 9) Align walk-in / booking rows to clinician UUID + staff code for doctor queue scoping
-- Legacy-safe: uses doctor_id / doctor_code only (no doc.id — many deployments lack that column).
UPDATE public.appointments AS appt
SET
  doctor_code = COALESCE(
    NULLIF(TRIM(appt.doctor_code::text), ''),
    NULLIF(TRIM(doc.doctor_code::text), ''),
    NULLIF(TRIM(doc.registration_number::text), ''),
    CASE
      WHEN doc.doctor_id::text !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        THEN NULLIF(TRIM(doc.doctor_id::text), '')
    END
  ),
  doctor_employee_id = COALESCE(
    NULLIF(TRIM(appt.doctor_employee_id::text), ''),
    NULLIF(TRIM(doc.doctor_code::text), ''),
    NULLIF(TRIM(doc.registration_number::text), ''),
    CASE
      WHEN doc.doctor_id::text !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        THEN NULLIF(TRIM(doc.doctor_id::text), '')
    END
  ),
  doctor_id = COALESCE(
    CASE
      WHEN appt.doctor_id::text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        THEN appt.doctor_id::text
    END,
    CASE
      WHEN doc.doctor_id::text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        THEN doc.doctor_id::text
    END,
    NULLIF(TRIM(doc.doctor_code::text), ''),
    NULLIF(TRIM(doc.registration_number::text), ''),
    CASE
      WHEN doc.doctor_id::text !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        THEN NULLIF(TRIM(doc.doctor_id::text), '')
    END
  ),
  doctor_name = COALESCE(
    NULLIF(TRIM(appt.doctor_name::text), ''),
    doc.full_name,
    doc.doctor_name,
    doc.name
  ),
  status = COALESCE(NULLIF(TRIM(appt.status::text), ''), 'WAITING'),
  queue_status = COALESCE(NULLIF(TRIM(appt.queue_status::text), ''), 'WAITING'),
  updated_at = NOW()
FROM public.doctors AS doc
WHERE (
    doc.full_name ILIKE '%Suriraju%'
    OR doc.doctor_name ILIKE '%Suriraju%'
    OR doc.name ILIKE '%Suriraju%'
  )
  AND (
    appt.doctor_name ILIKE '%Suriraju%'
    OR appt.doctor_id::text = doc.doctor_id::text
    OR appt.doctor_code = doc.doctor_code
    OR appt.doctor_code = doc.registration_number
    OR appt.doctor_employee_id = doc.doctor_code
    OR appt.doctor_employee_id = doc.registration_number
    OR appt.doctor_employee_id = doc.doctor_id::text
    OR appt.doctor_name ILIKE '%' || COALESCE(doc.full_name, doc.doctor_name, doc.name, '') || '%'
  );

-- 9b) Direct Suriraju backfill — no doctors-table join (run if 9 fails or returns 0 rows)
UPDATE public.appointments
SET
  doctor_id = '02ba876f-2788-4690-bd87-4d4315cbdee2',
  doctor_code = 'SURI-RH-26-12',
  doctor_employee_id = 'SURI-RH-26-12',
  doctor_name = COALESCE(NULLIF(TRIM(doctor_name::text), ''), 'Dr. Suriraju'),
  status = COALESCE(NULLIF(TRIM(status::text), ''), 'WAITING'),
  queue_status = COALESCE(NULLIF(TRIM(queue_status::text), ''), 'WAITING'),
  updated_at = NOW()
WHERE doctor_name ILIKE '%Suriraju%'
   OR doctor_id::text IN ('SURI-RH-26-12', '02ba876f-2788-4690-bd87-4d4315cbdee2')
   OR doctor_code = 'SURI-RH-26-12'
   OR doctor_employee_id = 'SURI-RH-26-12';

-- 10) Backfill missing hospital node tags on legacy appointment rows (safe to re-run)
UPDATE public.appointments
SET
  hospital_id = COALESCE(NULLIF(TRIM(hospital_id::text), ''), 'HOSP-01'),
  hospital_code = COALESCE(NULLIF(TRIM(hospital_code::text), ''), 'HOSP-01'),
  hospital_name = COALESCE(NULLIF(TRIM(hospital_name::text), ''), 'Regal Hospital'),
  updated_at = NOW()
WHERE hospital_id IS NULL
   OR TRIM(hospital_id::text) = ''
   OR hospital_code IS NULL
   OR TRIM(hospital_code::text) = '';

UPDATE public.doctors
SET
  hospital_id = COALESCE(NULLIF(TRIM(hospital_id::text), ''), 'HOSP-01'),
  hospital_code = COALESCE(NULLIF(TRIM(hospital_code::text), ''), 'HOSP-01'),
  hospital_name = COALESCE(NULLIF(TRIM(hospital_name::text), ''), 'Regal Hospital'),
  updated_at = NOW()
WHERE hospital_id IS NULL
   OR TRIM(hospital_id::text) = ''
   OR hospital_code IS NULL
   OR TRIM(hospital_code::text) = '';

-- 11) Remove legacy seed tenant rows from Super Admin directory (safe to re-run)
DELETE FROM public.hospitals
WHERE id IN (
  '11111111-1111-1111-1111-111111111111',
  'a0000000-0000-0000-0000-000000000001',
  'a1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
)
OR hospital_id IN (
  '11111111-1111-1111-1111-111111111111',
  'a0000000-0000-0000-0000-000000000001',
  'a1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
);

DELETE FROM public.hospital_tenants
WHERE hospital_id IN (
  '11111111-1111-1111-1111-111111111111',
  'a0000000-0000-0000-0000-000000000001',
  'a1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
)
OR id IN (
  '11111111-1111-1111-1111-111111111111',
  'a0000000-0000-0000-0000-000000000001',
  'a1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
);

-- Quick verify (optional — run separately if editor blocks multi-statement output)
-- SELECT doctor_code, full_name, email, department, consultation_fee, fee, is_active, status FROM public.doctors WHERE department ILIKE '%General Medicine%';
-- SELECT token_number, patient_name, doctor_id, doctor_code, doctor_name, status, appointment_date FROM public.appointments WHERE doctor_name ILIKE '%Suriraju%' ORDER BY created_at DESC LIMIT 10;
-- SELECT id, name, hospital_id FROM public.hospitals ORDER BY created_at DESC NULLS LAST;
