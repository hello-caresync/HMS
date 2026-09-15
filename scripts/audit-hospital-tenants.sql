-- Run in Supabase SQL Editor (read-only audit — no mutations)
-- Run ONE section at a time. Section 3 output appears in Messages/Notices tab.

-- ============================================================================
-- 1) All hospital rows + staff counts (hospital_id match only)
-- ============================================================================
SELECT
  h.id,
  h.hospital_code,
  h.name,
  h.facility_code,
  h.city,
  h.status,
  h.created_at,
  (
    SELECT count(*)
    FROM public.hospital_staff s
    WHERE s.hospital_id::text = h.id::text
  ) AS staff_count_by_id,
  (
    SELECT count(*)
    FROM public.hospital_staff s
    WHERE s.hospital_id::text = h.id::text
      AND s.role ILIKE '%doctor%'
  ) AS doctor_count_by_id
FROM public.hospitals h
ORDER BY h.created_at;

-- ============================================================================
-- 2) Column types: hospital_id and hospital_code across public tables
-- ============================================================================
SELECT
  c.table_name,
  c.column_name,
  c.data_type,
  c.udt_name
FROM information_schema.columns c
WHERE c.table_schema = 'public'
  AND c.column_name IN ('hospital_id', 'hospital_code')
ORDER BY c.table_name, c.column_name;

-- ============================================================================
-- 3) Dynamic reference counts (text-safe hospital_id matching)
--    Also matches hospital_id = hospital_code for TEXT-id tables (e.g. HOSP-01)
-- ============================================================================
DO $$
DECLARE
  h RECORD;
  t TEXT;
  c BIGINT;
  c_by_code BIGINT;
  col_type TEXT;
  tables TEXT[] := ARRAY[
    'appointments','patient_appointments','hospital_appointments','hospital_admins',
    'hospital_staff','hospital_staff_credentials','hospital_members','doctor_profiles','doctors',
    'billing_invoices','bills','hospital_invoices','purchase_orders','hospital_supply_orders',
    'procurement_purchase_orders','shipments','invoices','channel_messages','system_notifications',
    'system_events','emergency_alerts','emergency_triage','emergency_triages','opd_queue',
    'hospital_opd_queue','patients','hospital_patients','hospital_vendors','hospital_suppliers',
    'prescriptions','hospital_prescriptions','pharmacy_prescriptions','medical_records',
    'clinical_medical_records','clinical_notes','hospital_beds','inventory_items',
    'hospital_pharmacy_inventory','hospital_medicines','hospital_inventory_transactions',
    'consultations','departments'
  ];
  seed_id TEXT := '11111111-1111-1111-1111-111111111111';
BEGIN
  FOR h IN SELECT id, hospital_code, name FROM public.hospitals ORDER BY hospital_code LOOP
    RAISE NOTICE '%', format(
      '=== Hospital %s | %s | id=%s ===',
      COALESCE(h.hospital_code::text, '(null)'),
      COALESCE(h.name::text, '(null)'),
      h.id::text
    );

    FOREACH t IN ARRAY tables LOOP
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = t
      ) THEN
        CONTINUE;
      END IF;

      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = t AND column_name = 'hospital_id'
      ) THEN
        CONTINUE;
      END IF;

      SELECT c.data_type INTO col_type
      FROM information_schema.columns c
      WHERE c.table_schema = 'public' AND c.table_name = t AND c.column_name = 'hospital_id';

      EXECUTE format(
        'SELECT count(*) FROM public.%I WHERE hospital_id::text = $1',
        t
      ) INTO c USING h.id::text;

      -- Some legacy tables store hospital_code (HOSP-01) in hospital_id TEXT column
      EXECUTE format(
        'SELECT count(*) FROM public.%I WHERE hospital_id::text = $1',
        t
      ) INTO c_by_code USING COALESCE(h.hospital_code, '');

      IF c_by_code > c THEN
        c := c_by_code;
      END IF;

      IF c > 0 THEN
        RAISE NOTICE '%', format(
          '  %s (hospital_id type: %s): %s rows',
          t,
          COALESCE(col_type, 'unknown'),
          c::text
        );
      END IF;
    END LOOP;
  END LOOP;

  RAISE NOTICE '%', format('=== Seed UUID %s (orphan references) ===', seed_id);
  FOREACH t IN ARRAY tables LOOP
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = t AND column_name = 'hospital_id'
    ) THEN
      CONTINUE;
    END IF;

    EXECUTE format(
      'SELECT count(*) FROM public.%I WHERE hospital_id::text = $1',
      t
    ) INTO c USING seed_id;

    IF c > 0 THEN
      RAISE NOTICE '%', format('  %s: %s rows', t, c::text);
    END IF;
  END LOOP;
END $$;

-- ============================================================================
-- 4) hospital_code breakdown — only tables that HAVE a hospital_code column
-- ============================================================================
DO $$
DECLARE
  t TEXT;
  r RECORD;
  tables TEXT[] := ARRAY[
    'appointments','hospital_staff','billing_invoices','purchase_orders',
    'channel_messages','system_notifications','emergency_alerts','opd_queue'
  ];
BEGIN
  RAISE NOTICE '%', '=== Rows grouped by hospital_code column ===';
  FOREACH t IN ARRAY tables LOOP
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = t AND column_name = 'hospital_code'
    ) THEN
      RAISE NOTICE '%', format('  %s: (no hospital_code column — skipped)', t);
      CONTINUE;
    END IF;

    FOR r IN EXECUTE format(
      'SELECT hospital_code::text AS hospital_code, count(*)::bigint AS n FROM public.%I GROUP BY hospital_code ORDER BY hospital_code',
      t
    ) LOOP
      RAISE NOTICE '%', format(
        '  %s | code=%s | rows=%s',
        t,
        COALESCE(r.hospital_code, '(null)'),
        r.n::text
      );
    END LOOP;
  END LOOP;
END $$;
