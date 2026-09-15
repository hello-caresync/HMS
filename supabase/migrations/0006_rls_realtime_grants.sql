BEGIN;

-- RLS, Realtime publication, and grants for canonical Phase 4 tables
-- Re-apply doctor-rls.sql after this if you need role-scoped policies.

DO $$
DECLARE
  t text;
BEGIN
  FOR t IN
    SELECT unnest(ARRAY[
      'hospitals',
      'appointments',
      'medical_records',
      'emergency_alerts',
      'opd_queue',
      'clinical_notes',
      'hospital_staff',
      'billing_invoices',
      'purchase_orders',
      'shipments',
      'invoices',
      'channel_messages',
      'system_notifications',
      'system_events'
    ])
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t);

    EXECUTE format('DROP POLICY IF EXISTS "open_select_%I" ON public.%I;', t, t);
    EXECUTE format('DROP POLICY IF EXISTS "open_insert_%I" ON public.%I;', t, t);
    EXECUTE format('DROP POLICY IF EXISTS "open_update_%I" ON public.%I;', t, t);
    EXECUTE format('DROP POLICY IF EXISTS "open_all_%I" ON public.%I;', t, t);
    EXECUTE format('DROP POLICY IF EXISTS "admin_manage_%I" ON public.%I;', t, t);
    EXECUTE format('DROP POLICY IF EXISTS "open_billing_invoices" ON public.%I;', t);
    EXECUTE format('DROP POLICY IF EXISTS "open_notifications_access" ON public.%I;', t);
    EXECUTE format('DROP POLICY IF EXISTS "emergency_alerts_anon_all_v0" ON public.%I;', t);
    EXECUTE format('DROP POLICY IF EXISTS emergency_alerts_anon_all ON public.%I;', t);
    EXECUTE format('DROP POLICY IF EXISTS "opd_queue_v0_all" ON public.%I;', t);
    EXECUTE format('DROP POLICY IF EXISTS "clinical_notes_v0_all" ON public.%I;', t);
    EXECUTE format('DROP POLICY IF EXISTS purchase_orders_anon_all ON public.%I;', t);
    EXECUTE format('DROP POLICY IF EXISTS shipments_anon_all ON public.%I;', t);
    EXECUTE format('DROP POLICY IF EXISTS invoices_anon_all ON public.%I;', t);

    EXECUTE format(
      'CREATE POLICY "open_all_%I" ON public.%I FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);',
      t, t
    );

    EXECUTE format('GRANT ALL ON public.%I TO anon, authenticated, service_role;', t);
  END LOOP;
END $$;

DO $$
DECLARE
  t text;
BEGIN
  FOR t IN
    SELECT unnest(ARRAY[
      'appointments',
      'medical_records',
      'emergency_alerts',
      'opd_queue',
      'clinical_notes',
      'hospital_staff',
      'billing_invoices',
      'purchase_orders',
      'shipments',
      'invoices',
      'channel_messages',
      'system_notifications',
      'system_events'
    ])
  LOOP
    IF NOT EXISTS (
      SELECT 1
      FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = t
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I;', t);
    END IF;
  END LOOP;
END $$;

-- App-used appointment columns missing from 0001 (idempotent extensions)
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS appointment_time VARCHAR(50);
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS slot_time VARCHAR(50);
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS time_slot VARCHAR(50);
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS scheduled_time TEXT;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS patient_uhid VARCHAR(100);
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS patient_age INTEGER;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS patient_gender VARCHAR(20);
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS patient_mrn TEXT;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS appointment_type VARCHAR(50) DEFAULT 'OPD Consultation';
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS visit_type VARCHAR(50);
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS queue_number INTEGER;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS reason TEXT;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS reason_for_visit TEXT;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS booking_source TEXT DEFAULT 'APP';
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS billing_status TEXT DEFAULT 'unbilled';
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS queue_status TEXT;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS ecosystem_status TEXT;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS check_in_status TEXT;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS checked_in_at TIMESTAMPTZ;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS queue_type TEXT;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS triage_priority TEXT;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS priority TEXT;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS estimated_duration_minutes INTEGER;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS predicted_wait_min INTEGER;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS ml_duration_min INTEGER;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS stage TEXT;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS rescheduled_date DATE;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS rescheduled_time TEXT;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS consultation_fee NUMERIC(10, 2);
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS estimated_fee NUMERIC(10, 2);
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS vitals JSONB;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS vitals_summary TEXT;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS intake_vitals JSONB;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS symptoms TEXT;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS allergies TEXT;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS chronic_conditions TEXT;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS doctor_uuid TEXT;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS token TEXT;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS token_no TEXT;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS provider TEXT;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS channels JSONB DEFAULT '{"sms":true,"email":false,"whatsapp":false}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_appointments_patient_uhid
  ON public.appointments (patient_uhid);

CREATE INDEX IF NOT EXISTS idx_appointments_queue_status
  ON public.appointments (queue_status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_appointments_ecosystem_status
  ON public.appointments (ecosystem_status, appointment_date DESC);

CREATE INDEX IF NOT EXISTS idx_appointments_billing_status
  ON public.appointments (billing_status);

NOTIFY pgrst, 'reload schema';

COMMIT;
