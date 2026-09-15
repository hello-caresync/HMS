CREATE TABLE IF NOT EXISTS public.emergency_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id TEXT NOT NULL DEFAULT 'HOSP-01',
  patient_info TEXT NOT NULL,
  patient_name TEXT,
  severity TEXT NOT NULL DEFAULT 'code_red',
  arrival TEXT NOT NULL DEFAULT 'Ambulance',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_emergency_alerts_hospital_status
  ON public.emergency_alerts (hospital_id, status, created_at DESC);

ALTER TABLE public.emergency_alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS emergency_alerts_anon_all ON public.emergency_alerts;
CREATE POLICY emergency_alerts_anon_all
ON public.emergency_alerts
FOR ALL
TO public, anon, authenticated, service_role
USING (true)
WITH CHECK (true);

GRANT ALL ON public.emergency_alerts TO anon, authenticated, service_role;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'emergency_alerts'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.emergency_alerts;
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
