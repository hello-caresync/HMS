BEGIN;

-- Lab orders: doctor orders → hospital fulfills → patient sees results
CREATE TABLE IF NOT EXISTS public.lab_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID,
  hospital_code TEXT DEFAULT 'HOSP-01',
  facility_code TEXT DEFAULT 'RH-BLR-01',
  appointment_id UUID,
  patient_id TEXT NOT NULL DEFAULT 'UNKNOWN',
  patient_name TEXT,
  patient_uhid TEXT,
  doctor_id TEXT,
  doctor_name TEXT,
  test_name TEXT NOT NULL DEFAULT 'Lab test',
  test_code TEXT,
  priority TEXT DEFAULT 'routine',
  status TEXT NOT NULL DEFAULT 'ordered',
  ordered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  collected_at TIMESTAMPTZ,
  resulted_at TIMESTAMPTZ,
  result_summary TEXT,
  result_values JSONB DEFAULT '{}'::jsonb,
  billing_invoice_id UUID,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.lab_orders ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid();
ALTER TABLE public.lab_orders ADD COLUMN IF NOT EXISTS hospital_id UUID;
ALTER TABLE public.lab_orders ADD COLUMN IF NOT EXISTS hospital_code TEXT DEFAULT 'HOSP-01';
ALTER TABLE public.lab_orders ADD COLUMN IF NOT EXISTS facility_code TEXT DEFAULT 'RH-BLR-01';
ALTER TABLE public.lab_orders ADD COLUMN IF NOT EXISTS appointment_id UUID;
ALTER TABLE public.lab_orders ADD COLUMN IF NOT EXISTS patient_id TEXT NOT NULL DEFAULT 'UNKNOWN';
ALTER TABLE public.lab_orders ADD COLUMN IF NOT EXISTS patient_name TEXT;
ALTER TABLE public.lab_orders ADD COLUMN IF NOT EXISTS patient_uhid TEXT;
ALTER TABLE public.lab_orders ADD COLUMN IF NOT EXISTS doctor_id TEXT;
ALTER TABLE public.lab_orders ADD COLUMN IF NOT EXISTS doctor_name TEXT;
ALTER TABLE public.lab_orders ADD COLUMN IF NOT EXISTS test_name TEXT NOT NULL DEFAULT 'Lab test';
ALTER TABLE public.lab_orders ADD COLUMN IF NOT EXISTS test_code TEXT;
ALTER TABLE public.lab_orders ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'routine';
ALTER TABLE public.lab_orders ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'ordered';
ALTER TABLE public.lab_orders ADD COLUMN IF NOT EXISTS ordered_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE public.lab_orders ADD COLUMN IF NOT EXISTS collected_at TIMESTAMPTZ;
ALTER TABLE public.lab_orders ADD COLUMN IF NOT EXISTS resulted_at TIMESTAMPTZ;
ALTER TABLE public.lab_orders ADD COLUMN IF NOT EXISTS result_summary TEXT;
ALTER TABLE public.lab_orders ADD COLUMN IF NOT EXISTS result_values JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.lab_orders ADD COLUMN IF NOT EXISTS billing_invoice_id UUID;
ALTER TABLE public.lab_orders ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.lab_orders ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE public.lab_orders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

UPDATE public.lab_orders
SET created_at = COALESCE(ordered_at, now())
WHERE created_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_lab_orders_patient
  ON public.lab_orders (patient_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_lab_orders_appointment
  ON public.lab_orders (appointment_id, created_at DESC);

-- Radiology orders (same pipeline pattern)
CREATE TABLE IF NOT EXISTS public.radiology_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID,
  hospital_code TEXT DEFAULT 'HOSP-01',
  facility_code TEXT DEFAULT 'RH-BLR-01',
  appointment_id UUID,
  patient_id TEXT NOT NULL DEFAULT 'UNKNOWN',
  patient_name TEXT,
  patient_uhid TEXT,
  doctor_id TEXT,
  doctor_name TEXT,
  study_name TEXT NOT NULL DEFAULT 'Imaging study',
  modality TEXT DEFAULT 'X-RAY',
  body_part TEXT,
  priority TEXT DEFAULT 'routine',
  status TEXT NOT NULL DEFAULT 'ordered',
  ordered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  scheduled_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  report_summary TEXT,
  report_url TEXT,
  billing_invoice_id UUID,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.radiology_orders ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid();
ALTER TABLE public.radiology_orders ADD COLUMN IF NOT EXISTS hospital_id UUID;
ALTER TABLE public.radiology_orders ADD COLUMN IF NOT EXISTS hospital_code TEXT DEFAULT 'HOSP-01';
ALTER TABLE public.radiology_orders ADD COLUMN IF NOT EXISTS facility_code TEXT DEFAULT 'RH-BLR-01';
ALTER TABLE public.radiology_orders ADD COLUMN IF NOT EXISTS appointment_id UUID;
ALTER TABLE public.radiology_orders ADD COLUMN IF NOT EXISTS patient_id TEXT NOT NULL DEFAULT 'UNKNOWN';
ALTER TABLE public.radiology_orders ADD COLUMN IF NOT EXISTS patient_name TEXT;
ALTER TABLE public.radiology_orders ADD COLUMN IF NOT EXISTS patient_uhid TEXT;
ALTER TABLE public.radiology_orders ADD COLUMN IF NOT EXISTS doctor_id TEXT;
ALTER TABLE public.radiology_orders ADD COLUMN IF NOT EXISTS doctor_name TEXT;
ALTER TABLE public.radiology_orders ADD COLUMN IF NOT EXISTS study_name TEXT NOT NULL DEFAULT 'Imaging study';
ALTER TABLE public.radiology_orders ADD COLUMN IF NOT EXISTS modality TEXT DEFAULT 'X-RAY';
ALTER TABLE public.radiology_orders ADD COLUMN IF NOT EXISTS body_part TEXT;
ALTER TABLE public.radiology_orders ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'routine';
ALTER TABLE public.radiology_orders ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'ordered';
ALTER TABLE public.radiology_orders ADD COLUMN IF NOT EXISTS ordered_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE public.radiology_orders ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ;
ALTER TABLE public.radiology_orders ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
ALTER TABLE public.radiology_orders ADD COLUMN IF NOT EXISTS report_summary TEXT;
ALTER TABLE public.radiology_orders ADD COLUMN IF NOT EXISTS report_url TEXT;
ALTER TABLE public.radiology_orders ADD COLUMN IF NOT EXISTS billing_invoice_id UUID;
ALTER TABLE public.radiology_orders ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.radiology_orders ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE public.radiology_orders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

UPDATE public.radiology_orders
SET created_at = COALESCE(ordered_at, now())
WHERE created_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_radiology_orders_patient
  ON public.radiology_orders (patient_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_radiology_orders_appointment
  ON public.radiology_orders (appointment_id, created_at DESC);

-- Doctor availability: recurring weekly schedule
CREATE TABLE IF NOT EXISTS public.doctor_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID,
  hospital_code TEXT DEFAULT 'HOSP-01',
  doctor_id TEXT NOT NULL DEFAULT 'UNKNOWN',
  doctor_name TEXT,
  department TEXT,
  day_of_week SMALLINT NOT NULL DEFAULT 1 CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL DEFAULT '09:00:00',
  end_time TIME NOT NULL DEFAULT '17:00:00',
  slot_duration_minutes INTEGER NOT NULL DEFAULT 30,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.doctor_schedules ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid();
ALTER TABLE public.doctor_schedules ADD COLUMN IF NOT EXISTS hospital_id UUID;
ALTER TABLE public.doctor_schedules ADD COLUMN IF NOT EXISTS hospital_code TEXT DEFAULT 'HOSP-01';
ALTER TABLE public.doctor_schedules ADD COLUMN IF NOT EXISTS doctor_id TEXT NOT NULL DEFAULT 'UNKNOWN';
ALTER TABLE public.doctor_schedules ADD COLUMN IF NOT EXISTS doctor_name TEXT;
ALTER TABLE public.doctor_schedules ADD COLUMN IF NOT EXISTS department TEXT;
ALTER TABLE public.doctor_schedules ADD COLUMN IF NOT EXISTS day_of_week SMALLINT NOT NULL DEFAULT 1;
ALTER TABLE public.doctor_schedules ADD COLUMN IF NOT EXISTS start_time TIME NOT NULL DEFAULT '09:00:00';
ALTER TABLE public.doctor_schedules ADD COLUMN IF NOT EXISTS end_time TIME NOT NULL DEFAULT '17:00:00';
ALTER TABLE public.doctor_schedules ADD COLUMN IF NOT EXISTS slot_duration_minutes INTEGER NOT NULL DEFAULT 30;
ALTER TABLE public.doctor_schedules ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.doctor_schedules ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE public.doctor_schedules ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_doctor_schedules_doctor_day
  ON public.doctor_schedules (doctor_id, day_of_week, is_active);

-- Legacy seed data may contain duplicate (doctor_id, day_of_week) rows — keep newest, then enforce uniqueness
DELETE FROM public.doctor_schedules
WHERE ctid IN (
  SELECT ctid
  FROM (
    SELECT
      ctid,
      ROW_NUMBER() OVER (
        PARTITION BY doctor_id, day_of_week
        ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST
      ) AS row_rank
    FROM public.doctor_schedules
  ) ranked
  WHERE row_rank > 1
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_doctor_schedules_doctor_day_unique
  ON public.doctor_schedules (doctor_id, day_of_week);

-- Bookable time slots (materialized from schedule or manually set)
CREATE TABLE IF NOT EXISTS public.doctor_time_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID,
  hospital_code TEXT DEFAULT 'HOSP-01',
  doctor_id TEXT NOT NULL DEFAULT 'UNKNOWN',
  doctor_name TEXT,
  department TEXT,
  slot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  slot_time TEXT NOT NULL DEFAULT '10:00 AM',
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'open',
  appointment_id UUID,
  patient_id TEXT,
  patient_name TEXT,
  consultation_fee NUMERIC(10, 2) DEFAULT 800,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.doctor_time_slots ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid();
ALTER TABLE public.doctor_time_slots ADD COLUMN IF NOT EXISTS hospital_id UUID;
ALTER TABLE public.doctor_time_slots ADD COLUMN IF NOT EXISTS hospital_code TEXT DEFAULT 'HOSP-01';
ALTER TABLE public.doctor_time_slots ADD COLUMN IF NOT EXISTS doctor_id TEXT NOT NULL DEFAULT 'UNKNOWN';
ALTER TABLE public.doctor_time_slots ADD COLUMN IF NOT EXISTS doctor_name TEXT;
ALTER TABLE public.doctor_time_slots ADD COLUMN IF NOT EXISTS department TEXT;
ALTER TABLE public.doctor_time_slots ADD COLUMN IF NOT EXISTS slot_date DATE NOT NULL DEFAULT CURRENT_DATE;
ALTER TABLE public.doctor_time_slots ADD COLUMN IF NOT EXISTS slot_time TEXT NOT NULL DEFAULT '10:00 AM';
ALTER TABLE public.doctor_time_slots ADD COLUMN IF NOT EXISTS starts_at TIMESTAMPTZ;
ALTER TABLE public.doctor_time_slots ADD COLUMN IF NOT EXISTS ends_at TIMESTAMPTZ;
ALTER TABLE public.doctor_time_slots ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'open';
ALTER TABLE public.doctor_time_slots ADD COLUMN IF NOT EXISTS appointment_id UUID;
ALTER TABLE public.doctor_time_slots ADD COLUMN IF NOT EXISTS patient_id TEXT;
ALTER TABLE public.doctor_time_slots ADD COLUMN IF NOT EXISTS patient_name TEXT;
ALTER TABLE public.doctor_time_slots ADD COLUMN IF NOT EXISTS consultation_fee NUMERIC(10, 2) DEFAULT 800;
ALTER TABLE public.doctor_time_slots ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE public.doctor_time_slots ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_doctor_time_slots_open
  ON public.doctor_time_slots (doctor_id, slot_date, status);

-- Legacy rows may duplicate (doctor_id, slot_date, slot_time) — keep booked slot, else newest
DELETE FROM public.doctor_time_slots
WHERE ctid IN (
  SELECT ctid
  FROM (
    SELECT
      ctid,
      ROW_NUMBER() OVER (
        PARTITION BY doctor_id, slot_date, slot_time
        ORDER BY
          CASE WHEN lower(coalesce(status, '')) = 'booked' THEN 0 ELSE 1 END,
          updated_at DESC NULLS LAST,
          created_at DESC NULLS LAST
      ) AS row_rank
    FROM public.doctor_time_slots
  ) ranked
  WHERE row_rank > 1
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'doctor_time_slots_doctor_id_slot_date_slot_time_key'
  ) THEN
    ALTER TABLE public.doctor_time_slots
      ADD CONSTRAINT doctor_time_slots_doctor_id_slot_date_slot_time_key
      UNIQUE (doctor_id, slot_date, slot_time);
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Separate billing rows for lab/radiology linked to same appointment
ALTER TABLE public.billing_invoices ADD COLUMN IF NOT EXISTS service_type TEXT DEFAULT 'consultation';
ALTER TABLE public.billing_invoices ADD COLUMN IF NOT EXISTS service_reference_id UUID;
ALTER TABLE public.billing_invoices ADD COLUMN IF NOT EXISTS patient_id TEXT;

-- RLS + grants for new tables
DO $$
DECLARE
  t text;
BEGIN
  FOR t IN
    SELECT unnest(ARRAY['lab_orders', 'radiology_orders', 'doctor_schedules', 'doctor_time_slots'])
  LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = t
    ) THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t);
      EXECUTE format('DROP POLICY IF EXISTS "open_all_%I" ON public.%I;', t, t);
      EXECUTE format(
        'CREATE POLICY "open_all_%I" ON public.%I FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);',
        t, t
      );
      EXECUTE format('GRANT ALL ON public.%I TO anon, authenticated, service_role;', t);
    END IF;
  END LOOP;
END $$;

-- Realtime publication for tables the app subscribes to
DO $$
DECLARE
  t text;
BEGIN
  FOR t IN
    SELECT unnest(ARRAY[
      'lab_orders',
      'radiology_orders',
      'doctor_schedules',
      'doctor_time_slots',
      'billing_invoices',
      'system_notifications',
      'channel_messages',
      'emergency_alerts',
      'purchase_orders'
    ])
  LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = t
    ) AND NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = t
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I;', t);
    END IF;
  END LOOP;
END $$;

COMMIT;
