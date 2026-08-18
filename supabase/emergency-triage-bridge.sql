-- Emergency Triage Desk — live trauma intake (Regal RH-BLR-01)
-- Safe to re-run in Supabase SQL Editor.

CREATE TABLE IF NOT EXISTS public.emergency_triage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID DEFAULT '11111111-1111-1111-1111-111111111111',
  facility_code VARCHAR(50) DEFAULT 'RH-BLR-01',
  hospital_code VARCHAR(50) DEFAULT 'RH-BLR-01',
  patient_name VARCHAR(150) NOT NULL,
  patient_uhid VARCHAR(100),
  priority_tier VARCHAR(30) NOT NULL DEFAULT 'P1 Critical',
  chief_complaint TEXT NOT NULL,
  assigned_doctor_id VARCHAR(100) DEFAULT 'RH-D02',
  assigned_doctor_name VARCHAR(150) DEFAULT 'Dr. Chandrakanth S. Kesari',
  bp VARCHAR(30) DEFAULT '120/80',
  spo2 INT DEFAULT 98,
  pulse INT DEFAULT 80,
  temp NUMERIC(4, 1) DEFAULT 37.0,
  gcs INT DEFAULT 15,
  status VARCHAR(50) DEFAULT 'active',
  doctor_bypass_triggered BOOLEAN DEFAULT true,
  arrival_time VARCHAR(30),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

DELETE FROM public.emergency_triage
WHERE patient_name IN ('Unknown Male (Trauma)', 'Kavya Menon', 'Arjun Das', 'unknown');

CREATE INDEX IF NOT EXISTS idx_emergency_triage_facility
  ON public.emergency_triage (facility_code, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_emergency_triage_status
  ON public.emergency_triage (status, priority_tier);

ALTER TABLE public.emergency_triage ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "open_emergency_triage" ON public.emergency_triage;
DROP POLICY IF EXISTS "open_emergency_triage_access" ON public.emergency_triage;
CREATE POLICY "open_emergency_triage" ON public.emergency_triage
  FOR ALL TO anon, authenticated
  USING (true)
  WITH CHECK (true);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'emergency_triage'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.emergency_triage;
  END IF;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

NOTIFY pgrst, 'reload schema';
