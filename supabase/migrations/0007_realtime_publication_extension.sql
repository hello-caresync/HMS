BEGIN;

-- emergency_triage (internal ER workflow linked to emergency_alerts)
CREATE TABLE IF NOT EXISTS public.emergency_triage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID REFERENCES public.hospitals(id) ON DELETE SET NULL,
  facility_code TEXT DEFAULT 'RH-BLR-01',
  hospital_code TEXT DEFAULT 'HOSP-01',
  emergency_alert_id UUID REFERENCES public.emergency_alerts(id) ON DELETE SET NULL,
  patient_name TEXT NOT NULL DEFAULT 'Unknown',
  patient_uhid TEXT,
  chief_complaint TEXT,
  priority_tier TEXT DEFAULT 'P3 Non-Urgent',
  assigned_doctor_id TEXT,
  assigned_doctor_name TEXT,
  bp TEXT,
  spo2 NUMERIC,
  pulse NUMERIC,
  temp NUMERIC,
  gcs NUMERIC,
  status TEXT NOT NULL DEFAULT 'active',
  doctor_bypass_triggered BOOLEAN DEFAULT false,
  arrival_time TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.emergency_triage ADD COLUMN IF NOT EXISTS emergency_alert_id UUID;
ALTER TABLE public.emergency_triage ADD COLUMN IF NOT EXISTS hospital_id UUID;
ALTER TABLE public.emergency_triage ADD COLUMN IF NOT EXISTS facility_code TEXT DEFAULT 'RH-BLR-01';
ALTER TABLE public.emergency_triage ADD COLUMN IF NOT EXISTS hospital_code TEXT DEFAULT 'HOSP-01';
ALTER TABLE public.emergency_triage ADD COLUMN IF NOT EXISTS patient_name TEXT NOT NULL DEFAULT 'Unknown';
ALTER TABLE public.emergency_triage ADD COLUMN IF NOT EXISTS patient_uhid TEXT;
ALTER TABLE public.emergency_triage ADD COLUMN IF NOT EXISTS chief_complaint TEXT;
ALTER TABLE public.emergency_triage ADD COLUMN IF NOT EXISTS priority_tier TEXT DEFAULT 'P3 Non-Urgent';
ALTER TABLE public.emergency_triage ADD COLUMN IF NOT EXISTS assigned_doctor_id TEXT;
ALTER TABLE public.emergency_triage ADD COLUMN IF NOT EXISTS assigned_doctor_name TEXT;
ALTER TABLE public.emergency_triage ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';
ALTER TABLE public.emergency_triage ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE public.emergency_triage ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_emergency_triage_alert
  ON public.emergency_triage (emergency_alert_id);

CREATE INDEX IF NOT EXISTS idx_emergency_triage_hospital_status
  ON public.emergency_triage (hospital_id, status, created_at DESC);

-- purchase_orders columns used by hospital supply desk (idempotent)
ALTER TABLE public.purchase_orders ADD COLUMN IF NOT EXISTS vendor_email TEXT;
ALTER TABLE public.purchase_orders ADD COLUMN IF NOT EXISTS vendor_name TEXT;
ALTER TABLE public.purchase_orders ADD COLUMN IF NOT EXISTS vendor_code TEXT;
ALTER TABLE public.purchase_orders ADD COLUMN IF NOT EXISTS vendor_category TEXT;
ALTER TABLE public.purchase_orders ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE public.purchase_orders ADD COLUMN IF NOT EXISTS item_description TEXT;
ALTER TABLE public.purchase_orders ADD COLUMN IF NOT EXISTS item_name TEXT;
ALTER TABLE public.purchase_orders ADD COLUMN IF NOT EXISTS item_details TEXT;
ALTER TABLE public.purchase_orders ADD COLUMN IF NOT EXISTS sku TEXT;
ALTER TABLE public.purchase_orders ADD COLUMN IF NOT EXISTS sku_description TEXT;
ALTER TABLE public.purchase_orders ADD COLUMN IF NOT EXISTS quantity INTEGER;
ALTER TABLE public.purchase_orders ADD COLUMN IF NOT EXISTS unit_price NUMERIC(12, 2);
ALTER TABLE public.purchase_orders ADD COLUMN IF NOT EXISTS delivery_timeline TEXT;
ALTER TABLE public.purchase_orders ADD COLUMN IF NOT EXISTS delivery_window TEXT;
ALTER TABLE public.purchase_orders ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;

-- Extend Realtime publication for every table the app subscribes to
DO $$
DECLARE
  t text;
BEGIN
  FOR t IN
    SELECT unnest(ARRAY[
      'patient_appointments',
      'opd_tokens',
      'patients',
      'prescriptions',
      'emergency_triage',
      'emergency_triages',
      'bills',
      'hospital_beds',
      'hospital_invoices',
      'hospital_opd_queue',
      'hospital_pharmacy_inventory',
      'hospital_vendors',
      'hospital_supply_orders',
      'doctor_schedules',
      'doctor_time_slots',
      'hospital_staff_credentials',
      'hospital_tenants',
      'hospitals',
      'consultations',
      'clinical_medical_records',
      'hospital_appointments',
      'hospital_clinical_records',
      'hospital_medicines',
      'hospital_prescriptions',
      'pharmacy_inventory',
      'pharmacy_prescriptions',
      'inventory_items',
      'ipd_admissions',
      'ecosystem_appointments',
      'ecosystem_activity',
      'notifications',
      'doctors',
      'hospital_emergencies',
      'goods_receipt_notes'
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

-- RLS + grants for emergency_triage
ALTER TABLE public.emergency_triage ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "open_all_emergency_triage" ON public.emergency_triage;
CREATE POLICY "open_all_emergency_triage"
  ON public.emergency_triage FOR ALL TO anon, authenticated
  USING (true) WITH CHECK (true);
GRANT ALL ON public.emergency_triage TO anon, authenticated, service_role;

-- Ensure emergency_triage is published
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
END $$;

NOTIFY pgrst, 'reload schema';

COMMIT;
