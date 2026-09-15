-- Consolidate duplicate hospital tenant rows into one canonical HOSP-01 UUID.
-- Safe to run once on live DB after reviewing scripts/audit-hospital-tenants.sql output.
--
-- Resolves:
--   • Seed UUID 11111111-1111-1111-1111-111111111111 (0001 insert)
--   • Onboarding-created HOSP-01 UUID (keep — highest hospital_staff count)
--   • Duplicate HOSP-02 row
--   • Legacy roster UUID a1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11
--   • Text hospital_id values (HOSP-01, HOSP-02, ROOT-HQ, default, RH-BLR-01)
--
-- Skips views (e.g. doctor_appointments_view) — only base tables are updated.
-- Run entire file in Supabase SQL Editor (single transaction).

BEGIN;

-- ---------------------------------------------------------------------------
-- 0) Resolve canonical hospital UUID (HOSP-01 row with most staff)
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  v_canonical UUID;
BEGIN
  SELECT h.id INTO v_canonical
  FROM public.hospitals h
  LEFT JOIN LATERAL (
    SELECT count(*) AS staff_n
    FROM public.hospital_staff s
    WHERE s.hospital_id::text = h.id::text
  ) sc ON true
  WHERE h.hospital_code = 'HOSP-01'
  ORDER BY sc.staff_n DESC NULLS LAST, h.created_at DESC
  LIMIT 1;

  IF v_canonical IS NULL THEN
    RAISE EXCEPTION '0008 ABORT: No hospitals row with hospital_code HOSP-01 found';
  END IF;

  PERFORM set_config('caresync.canonical_hospital_id', v_canonical::text, true);
  RAISE NOTICE '0008 canonical hospital_id (KEEP): %', v_canonical;
END $$;

-- ---------------------------------------------------------------------------
-- 1) Pre-flight: list hospital_id values that are NOT UUID and NOT mappable codes
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  v_canonical UUID := current_setting('caresync.canonical_hospital_id')::uuid;
  t RECORD;
  bad RECORD;
  bad_count INT := 0;
  mappable TEXT[] := ARRAY[
    'HOSP-01', 'HOSP-02', 'hosp-01', 'hosp-02',
    'ROOT-HQ', 'ROOT_HQ', 'default', 'RH-BLR-01',
    '11111111-1111-1111-1111-111111111111',
    'a1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
  ];
BEGIN
  RAISE NOTICE '0008 pre-flight: scanning non-UUID hospital_id values...';

  FOR t IN
    SELECT c.table_name, c.udt_name AS col_type
    FROM information_schema.columns c
    JOIN information_schema.tables tb
      ON tb.table_schema = c.table_schema
     AND tb.table_name = c.table_name
    WHERE c.table_schema = 'public'
      AND c.column_name = 'hospital_id'
      AND tb.table_type = 'BASE TABLE'
    ORDER BY c.table_name
  LOOP
    FOR bad IN EXECUTE format(
      $q$
      SELECT DISTINCT hospital_id::text AS val, count(*) AS n
      FROM public.%I
      WHERE hospital_id IS NOT NULL
        AND hospital_id::text !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      GROUP BY 1
      ORDER BY 1
      $q$,
      t.table_name
    ) LOOP
      IF bad.val = ANY (mappable) OR bad.val = v_canonical::text THEN
        RAISE NOTICE '  mappable | %.% | value=% | rows=%',
          t.table_name, t.col_type, bad.val, bad.n;
      ELSE
        bad_count := bad_count + 1;
        RAISE WARNING '  UNMAPPABLE | %.% | value=% | rows=% — fix manually before re-run',
          t.table_name, t.col_type, bad.val, bad.n;
      END IF;
    END LOOP;
  END LOOP;

  IF bad_count > 0 THEN
    RAISE EXCEPTION
      '0008 ABORT: % unmappable hospital_id value(s) found (see WARNING lines above). Resolve manually, then re-run.',
      bad_count;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 2) Re-point hospital_id on every BASE TABLE (dynamic discovery)
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  v_canonical UUID := current_setting('caresync.canonical_hospital_id')::uuid;
  v_old UUID;
  t TEXT;
  col_udt TEXT;
  updated BIGINT;
  code_values TEXT[] := ARRAY[
    'HOSP-01', 'HOSP-02', 'hosp-01', 'hosp-02',
    'ROOT-HQ', 'ROOT_HQ', 'default', 'RH-BLR-01'
  ];
  legacy_uuids TEXT[] := ARRAY[
    '11111111-1111-1111-1111-111111111111',
    'a1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
  ];
  code_val TEXT;
  legacy_val TEXT;
BEGIN
  -- 2a) Map tenant codes stored in hospital_id (text columns) → canonical UUID
  FOR t IN
    SELECT c.table_name
    FROM information_schema.columns c
    JOIN information_schema.tables tb
      ON tb.table_schema = c.table_schema AND tb.table_name = c.table_name
    WHERE c.table_schema = 'public'
      AND c.column_name = 'hospital_id'
      AND tb.table_type = 'BASE TABLE'
      AND c.udt_name IN ('text', 'varchar', 'character varying')
    ORDER BY c.table_name
  LOOP
    FOREACH code_val IN ARRAY code_values LOOP
      EXECUTE format(
        'UPDATE public.%I SET hospital_id = $1 WHERE hospital_id::text = $2',
        t
      ) USING v_canonical::text, code_val;
      GET DIAGNOSTICS updated = ROW_COUNT;
      IF updated > 0 THEN
        RAISE NOTICE '  code→uuid | % | % rows (% → canonical)', t, updated, code_val;
      END IF;
    END LOOP;
  END LOOP;

  -- 2b) Re-point duplicate hospital UUIDs → canonical (all column types)
  FOR v_old IN
    SELECT id FROM public.hospitals WHERE id <> v_canonical
  LOOP
    FOR t IN
      SELECT c.table_name, c.udt_name
      FROM information_schema.columns c
      JOIN information_schema.tables tb
        ON tb.table_schema = c.table_schema AND tb.table_name = c.table_name
      WHERE c.table_schema = 'public'
        AND c.column_name = 'hospital_id'
        AND tb.table_type = 'BASE TABLE'
      ORDER BY c.table_name
    LOOP
      col_udt := t.udt_name;
      IF col_udt = 'uuid' THEN
        EXECUTE format(
          'UPDATE public.%I SET hospital_id = $1::uuid WHERE hospital_id::text = $2',
          t.table_name
        ) USING v_canonical, v_old::text;
      ELSE
        EXECUTE format(
          'UPDATE public.%I SET hospital_id = $1 WHERE hospital_id::text = $2',
          t.table_name
        ) USING v_canonical::text, v_old::text;
      END IF;
      GET DIAGNOSTICS updated = ROW_COUNT;
      IF updated > 0 THEN
        RAISE NOTICE '  dup→canonical | % | % rows (from %)', t.table_name, updated, v_old;
      END IF;
    END LOOP;
  END LOOP;

  -- 2c) Re-point legacy seed + roster UUIDs → canonical
  FOREACH legacy_val IN ARRAY legacy_uuids LOOP
    IF legacy_val = v_canonical::text THEN
      CONTINUE;
    END IF;
    FOR t IN
      SELECT c.table_name, c.udt_name
      FROM information_schema.columns c
      JOIN information_schema.tables tb
        ON tb.table_schema = c.table_schema AND tb.table_name = c.table_name
      WHERE c.table_schema = 'public'
        AND c.column_name = 'hospital_id'
        AND tb.table_type = 'BASE TABLE'
      ORDER BY c.table_name
    LOOP
      IF t.udt_name = 'uuid' THEN
        EXECUTE format(
          'UPDATE public.%I SET hospital_id = $1::uuid WHERE hospital_id::text = $2',
          t.table_name
        ) USING v_canonical, legacy_val;
      ELSE
        EXECUTE format(
          'UPDATE public.%I SET hospital_id = $1 WHERE hospital_id::text = $2',
          t.table_name
        ) USING v_canonical::text, legacy_val;
      END IF;
      GET DIAGNOSTICS updated = ROW_COUNT;
      IF updated > 0 THEN
        RAISE NOTICE '  legacy→canonical | % | % rows (from %)', t.table_name, updated, legacy_val;
      END IF;
    END LOOP;
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- 3) ALTER text/varchar hospital_id columns → UUID (with cast safety check)
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  v_canonical UUID := current_setting('caresync.canonical_hospital_id')::uuid;
  t RECORD;
  bad BIGINT;
BEGIN
  FOR t IN
    SELECT c.table_name, c.udt_name, c.is_nullable
    FROM information_schema.columns c
    JOIN information_schema.tables tb
      ON tb.table_schema = c.table_schema AND tb.table_name = c.table_name
    WHERE c.table_schema = 'public'
      AND c.column_name = 'hospital_id'
      AND tb.table_type = 'BASE TABLE'
      AND c.udt_name IN ('text', 'varchar', 'character varying')
    ORDER BY c.table_name
  LOOP
    EXECUTE format(
      $q$SELECT count(*) FROM public.%I
        WHERE hospital_id IS NOT NULL
          AND hospital_id::text !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'$q$,
      t.table_name
    ) INTO bad;

    IF bad > 0 THEN
      RAISE EXCEPTION
        '0008 ABORT ALTER %: % rows still have non-UUID hospital_id after remap',
        t.table_name, bad;
    END IF;

    IF t.is_nullable = 'YES' THEN
      EXECUTE format(
        'ALTER TABLE public.%I ALTER COLUMN hospital_id TYPE uuid USING hospital_id::uuid',
        t.table_name
      );
    ELSE
      EXECUTE format(
        'ALTER TABLE public.%I ALTER COLUMN hospital_id TYPE uuid USING hospital_id::uuid',
        t.table_name
      );
    END IF;

    RAISE NOTICE '0008 altered %.hospital_id → uuid (was %)', t.table_name, t.udt_name;
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- 4) Normalize hospital_code columns (where present)
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  t TEXT;
  updated BIGINT;
BEGIN
  FOR t IN
    SELECT c.table_name
    FROM information_schema.columns c
    JOIN information_schema.tables tb
      ON tb.table_schema = c.table_schema AND tb.table_name = c.table_name
    WHERE c.table_schema = 'public'
      AND c.column_name = 'hospital_code'
      AND tb.table_type = 'BASE TABLE'
    ORDER BY c.table_name
  LOOP
    EXECUTE format(
      $q$UPDATE public.%I SET hospital_code = 'HOSP-01'
        WHERE hospital_code IS NULL
           OR hospital_code IN ('HOSP-02', 'hosp-02', 'default', 'ROOT-HQ', 'ROOT_HQ', 'RH-BLR-01')$q$,
      t
    );
    GET DIAGNOSTICS updated = ROW_COUNT;
    IF updated > 0 THEN
      RAISE NOTICE '0008 normalized hospital_code on % (% rows)', t, updated;
    END IF;
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- 5) Normalize canonical hospitals row metadata
-- ---------------------------------------------------------------------------
UPDATE public.hospitals
SET
  name = 'Regal Hospital',
  hospital_code = 'HOSP-01',
  facility_code = COALESCE(facility_code, 'RH-BLR-01'),
  updated_at = COALESCE(updated_at, now())
WHERE id = current_setting('caresync.canonical_hospital_id')::uuid;

-- ---------------------------------------------------------------------------
-- 6) Safety check — zero references to duplicate hospital rows
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  v_canonical UUID := current_setting('caresync.canonical_hospital_id')::uuid;
  v_old UUID;
  t TEXT;
  c BIGINT;
BEGIN
  FOR v_old IN SELECT id FROM public.hospitals WHERE id <> v_canonical LOOP
    FOR t IN
      SELECT c.table_name
      FROM information_schema.columns c
      JOIN information_schema.tables tb
        ON tb.table_schema = c.table_schema AND tb.table_name = c.table_name
      WHERE c.table_schema = 'public'
        AND c.column_name = 'hospital_id'
        AND tb.table_type = 'BASE TABLE'
    LOOP
      EXECUTE format('SELECT count(*) FROM public.%I WHERE hospital_id::text = $1', t)
        INTO c USING v_old::text;
      IF c > 0 THEN
        RAISE EXCEPTION '0008 ABORT DELETE: % still has % rows referencing duplicate %', t, c, v_old;
      END IF;
    END LOOP;
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- 7) Delete duplicate hospital rows (keep canonical only)
-- ---------------------------------------------------------------------------
DELETE FROM public.hospitals
WHERE id <> current_setting('caresync.canonical_hospital_id')::uuid;

-- ---------------------------------------------------------------------------
-- 8) Drop seed UUID DEFAULT on hospital_id (dynamic — all base tables)
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  t RECORD;
BEGIN
  FOR t IN
    SELECT c.table_name
    FROM information_schema.columns c
    JOIN information_schema.tables tb
      ON tb.table_schema = c.table_schema AND tb.table_name = c.table_name
    WHERE c.table_schema = 'public'
      AND c.column_name = 'hospital_id'
      AND tb.table_type = 'BASE TABLE'
      AND c.column_default IS NOT NULL
      AND c.column_default LIKE '%11111111-1111-1111-1111-111111111111%'
  LOOP
    EXECUTE format(
      'ALTER TABLE public.%I ALTER COLUMN hospital_id DROP DEFAULT',
      t.table_name
    );
    RAISE NOTICE '0008 dropped seed DEFAULT on %.hospital_id', t.table_name;
  END LOOP;
END $$;

COMMIT;

-- ---------------------------------------------------------------------------
-- Post-migration verification (run separately after COMMIT succeeds)
-- ---------------------------------------------------------------------------
-- SELECT count(*) AS hospital_rows FROM public.hospitals;
-- SELECT id, hospital_code, name FROM public.hospitals;
-- SELECT hospital_id::text, count(*) FROM public.hospital_staff GROUP BY 1;
-- SELECT table_name, udt_name FROM information_schema.columns
--   WHERE table_schema='public' AND column_name='hospital_id' ORDER BY 1;
