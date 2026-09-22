-- Super Admin cascade teardown: purge individual staff credentials or entire hospital tenants.
-- Safe to re-run (CREATE OR REPLACE / IF EXISTS guards).

BEGIN;

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.is_protected_hospital_tenant(p_hospital_id TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_input TEXT := UPPER(TRIM(COALESCE(p_hospital_id, '')));
BEGIN
  IF v_input = '' THEN
    RETURN TRUE;
  END IF;

  IF v_input IN (
    'HOSP-01',
    '11111111-1111-1111-1111-111111111111',
    'A0000000-0000-0000-0000-000000000001',
    'A1EEBC99-9C0B-4EF8-BB6D-6BB9BD380A11'
  ) THEN
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$;

CREATE OR REPLACE FUNCTION public.resolve_hospital_tenant_keys(p_hospital_id TEXT)
RETURNS TABLE(resolved_uuid UUID, resolved_code TEXT)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_input TEXT := TRIM(COALESCE(p_hospital_id, ''));
  v_uuid UUID;
  v_code TEXT;
BEGIN
  IF v_input = '' THEN
    RETURN;
  END IF;

  BEGIN
    v_uuid := v_input::uuid;
  EXCEPTION
    WHEN invalid_text_representation THEN
      v_uuid := NULL;
  END;

  IF v_uuid IS NOT NULL THEN
    SELECT h.id, UPPER(COALESCE(NULLIF(TRIM(h.hospital_code), ''), v_input))
    INTO v_uuid, v_code
    FROM public.hospitals h
    WHERE h.id = v_uuid
    LIMIT 1;

    IF v_code IS NULL THEN
      v_code := UPPER(v_input);
    END IF;

    resolved_uuid := v_uuid;
    resolved_code := v_code;
    RETURN NEXT;
    RETURN;
  END IF;

  v_code := UPPER(v_input);

  SELECT h.id, UPPER(COALESCE(NULLIF(TRIM(h.hospital_code), ''), v_code))
  INTO v_uuid, v_code
  FROM public.hospitals h
  WHERE UPPER(TRIM(h.hospital_code)) = v_code
     OR UPPER(TRIM(h.id::text)) = v_code
  ORDER BY h.created_at NULLS LAST
  LIMIT 1;

  resolved_uuid := v_uuid;
  resolved_code := v_code;
  RETURN NEXT;
END;
$$;

CREATE OR REPLACE FUNCTION public._purge_delete_if_table_exists(
  p_table_name TEXT,
  p_predicate_sql TEXT
)
RETURNS BIGINT
LANGUAGE plpgsql
AS $$
DECLARE
  v_table regclass := to_regclass(p_table_name);
  v_deleted BIGINT := 0;
BEGIN
  IF v_table IS NULL THEN
    RETURN 0;
  END IF;

  EXECUTE format('DELETE FROM %s WHERE %s', v_table, p_predicate_sql);
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
EXCEPTION
  WHEN undefined_table THEN
    RETURN 0;
  WHEN undefined_column THEN
    RETURN 0;
  WHEN others THEN
    RAISE NOTICE 'Skipped delete on %: %', p_table_name, SQLERRM;
    RETURN 0;
END;
$$;

-- ---------------------------------------------------------------------------
-- Purge a single staff credential (+ linked doctor / credential shadow rows)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.purge_hospital_staff_member(p_staff_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_staff RECORD;
  v_deleted_staff BIGINT := 0;
  v_deleted_doctors BIGINT := 0;
  v_deleted_credentials BIGINT := 0;
BEGIN
  IF p_staff_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Staff id is required.');
  END IF;

  SELECT
    hs.id,
    hs.hospital_id,
    hs.hospital_code,
    hs.staff_id_code,
    hs.email,
    hs.role
  INTO v_staff
  FROM public.hospital_staff hs
  WHERE hs.id = p_staff_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Staff credential not found.');
  END IF;

  IF public.is_protected_hospital_tenant(COALESCE(v_staff.hospital_code, v_staff.hospital_id::text)) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Cannot delete credentials on a protected platform seed tenant.');
  END IF;

  v_deleted_doctors := v_deleted_doctors + public._purge_delete_if_table_exists(
    'public.doctors',
    format(
      'lower(email) = lower(%L) OR doctor_code = %L OR registration_number = %L OR doctor_id = %L',
      COALESCE(v_staff.email, ''),
      COALESCE(v_staff.staff_id_code, ''),
      COALESCE(v_staff.staff_id_code, ''),
      COALESCE(v_staff.staff_id_code, '')
    )
  );

  v_deleted_credentials := v_deleted_credentials + public._purge_delete_if_table_exists(
    'public.hospital_user_credentials',
    format(
      'lower(email) = lower(%L) OR employee_id = %L',
      COALESCE(v_staff.email, ''),
      COALESCE(v_staff.staff_id_code, '')
    )
  );

  v_deleted_credentials := v_deleted_credentials + public._purge_delete_if_table_exists(
    'public.hospital_staff_credentials',
    format('lower(email) = lower(%L)', COALESCE(v_staff.email, ''))
  );

  DELETE FROM public.hospital_staff WHERE id = p_staff_id;
  GET DIAGNOSTICS v_deleted_staff = ROW_COUNT;

  IF v_deleted_staff = 0 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Staff credential could not be deleted.');
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'staff_id', p_staff_id,
    'deleted', jsonb_build_object(
      'hospital_staff', v_deleted_staff,
      'doctors', v_deleted_doctors,
      'credentials', v_deleted_credentials
    )
  );
END;
$$;

-- ---------------------------------------------------------------------------
-- Purge an entire hospital tenant and all scoped historical records
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.purge_hospital_tenant(p_hospital_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uuid UUID;
  v_code TEXT;
  v_uuid_text TEXT;
  v_hospital_deleted BIGINT := 0;
  v_counts JSONB := '{}'::jsonb;
  v_add BIGINT;
BEGIN
  IF public.is_protected_hospital_tenant(p_hospital_id) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'This hospital tenant is protected and cannot be purged.');
  END IF;

  SELECT resolved_uuid, resolved_code
  INTO v_uuid, v_code
  FROM public.resolve_hospital_tenant_keys(p_hospital_id)
  LIMIT 1;

  IF v_code IS NULL OR v_code = '' THEN
    v_code := UPPER(TRIM(p_hospital_id));
  END IF;

  v_uuid_text := COALESCE(v_uuid::text, '');

  -- Medical / clinical children first
  v_add := public._purge_delete_if_table_exists(
    'public.medical_records',
    format(
      'appointment_id IN (SELECT id FROM public.appointments WHERE hospital_id = %L::uuid OR hospital_code = %L)',
      COALESCE(v_uuid_text, '00000000-0000-0000-0000-000000000000'),
      v_code
    )
  );
  v_counts := v_counts || jsonb_build_object('medical_records', v_add);

  v_add := public._purge_delete_if_table_exists(
    'public.clinical_notes',
    format(
      'queue_id IN (SELECT id FROM public.opd_queue WHERE hospital_id = %L::uuid OR hospital_code = %L)
       OR hospital_id = %L::uuid OR hospital_code = %L',
      COALESCE(v_uuid_text, '00000000-0000-0000-0000-000000000000'),
      v_code,
      COALESCE(v_uuid_text, '00000000-0000-0000-0000-000000000000'),
      v_code
    )
  );
  v_counts := v_counts || jsonb_build_object('clinical_notes', v_add);

  v_add := public._purge_delete_if_table_exists(
    'public.consultations',
    format('hospital_id = %L OR hospital_id = %L', v_code, v_uuid_text)
  );
  v_counts := v_counts || jsonb_build_object('consultations', v_add);

  v_add := public._purge_delete_if_table_exists(
    'public.patient_consultations',
    format('hospital_id = %L OR hospital_id = %L', v_code, v_uuid_text)
  );
  v_counts := v_counts || jsonb_build_object('patient_consultations', v_add);

  v_add := public._purge_delete_if_table_exists(
    'public.patients',
    format('hospital_id = %L OR hospital_id = %L', v_code, v_uuid_text)
  );
  v_counts := v_counts || jsonb_build_object('patients', v_add);

  v_add := public._purge_delete_if_table_exists(
    'public.hospital_patient_counters',
    format('hospital_id = %L OR hospital_id = %L', v_code, v_uuid_text)
  );
  v_counts := v_counts || jsonb_build_object('hospital_patient_counters', v_add);

  -- Billing / finance
  v_add := public._purge_delete_if_table_exists(
    'public.billing_invoices',
    format('hospital_id = %L OR hospital_id = %L', v_code, v_uuid_text)
  );
  v_counts := v_counts || jsonb_build_object('billing_invoices', v_add);

  v_add := public._purge_delete_if_table_exists(
    'public.hospital_invoices',
    format('hospital_id = %L OR hospital_id = %L', v_code, v_uuid_text)
  );
  v_counts := v_counts || jsonb_build_object('hospital_invoices', v_add);

  v_add := public._purge_delete_if_table_exists(
    'public.billings',
    format('hospital_id = %L OR hospital_id = %L', v_code, v_uuid_text)
  );
  v_counts := v_counts || jsonb_build_object('billings', v_add);

  -- Queues / scheduling / orders
  v_add := public._purge_delete_if_table_exists(
    'public.opd_queue',
    format('hospital_id = %L::uuid OR hospital_code = %L', COALESCE(v_uuid_text, '00000000-0000-0000-0000-000000000000'), v_code)
  );
  v_counts := v_counts || jsonb_build_object('opd_queue', v_add);

  v_add := public._purge_delete_if_table_exists(
    'public.appointments',
    format('hospital_id = %L::uuid OR hospital_code = %L', COALESCE(v_uuid_text, '00000000-0000-0000-0000-000000000000'), v_code)
  );
  v_counts := v_counts || jsonb_build_object('appointments', v_add);

  v_add := public._purge_delete_if_table_exists(
    'public.lab_orders',
    format('hospital_id = %L::uuid OR hospital_code = %L', COALESCE(v_uuid_text, '00000000-0000-0000-0000-000000000000'), v_code)
  );
  v_counts := v_counts || jsonb_build_object('lab_orders', v_add);

  v_add := public._purge_delete_if_table_exists(
    'public.radiology_orders',
    format('hospital_id = %L::uuid OR hospital_code = %L', COALESCE(v_uuid_text, '00000000-0000-0000-0000-000000000000'), v_code)
  );
  v_counts := v_counts || jsonb_build_object('radiology_orders', v_add);

  v_add := public._purge_delete_if_table_exists(
    'public.doctor_schedules',
    format('hospital_id = %L::uuid OR hospital_code = %L', COALESCE(v_uuid_text, '00000000-0000-0000-0000-000000000000'), v_code)
  );
  v_counts := v_counts || jsonb_build_object('doctor_schedules', v_add);

  v_add := public._purge_delete_if_table_exists(
    'public.doctor_time_slots',
    format('hospital_id = %L::uuid OR hospital_code = %L', COALESCE(v_uuid_text, '00000000-0000-0000-0000-000000000000'), v_code)
  );
  v_counts := v_counts || jsonb_build_object('doctor_time_slots', v_add);

  -- Emergency
  v_add := public._purge_delete_if_table_exists(
    'public.emergency_triage',
    format('hospital_id = %L::uuid OR hospital_code = %L', COALESCE(v_uuid_text, '00000000-0000-0000-0000-000000000000'), v_code)
  );
  v_counts := v_counts || jsonb_build_object('emergency_triage', v_add);

  v_add := public._purge_delete_if_table_exists(
    'public.emergency_alerts',
    format('hospital_id = %L::uuid OR hospital_code = %L', COALESCE(v_uuid_text, '00000000-0000-0000-0000-000000000000'), v_code)
  );
  v_counts := v_counts || jsonb_build_object('emergency_alerts', v_add);

  -- Procurement (child rows first when present)
  v_add := public._purge_delete_if_table_exists(
    'public.shipments',
    format(
      'po_id IN (SELECT id FROM public.purchase_orders WHERE hospital_id = %L::uuid OR hospital_code = %L)',
      COALESCE(v_uuid_text, '00000000-0000-0000-0000-000000000000'),
      v_code
    )
  );
  v_counts := v_counts || jsonb_build_object('shipments', v_add);

  v_add := public._purge_delete_if_table_exists(
    'public.invoices',
    format(
      'po_id IN (SELECT id FROM public.purchase_orders WHERE hospital_id = %L::uuid OR hospital_code = %L)',
      COALESCE(v_uuid_text, '00000000-0000-0000-0000-000000000000'),
      v_code
    )
  );
  v_counts := v_counts || jsonb_build_object('invoices', v_add);

  v_add := public._purge_delete_if_table_exists(
    'public.purchase_orders',
    format('hospital_id = %L::uuid OR hospital_code = %L', COALESCE(v_uuid_text, '00000000-0000-0000-0000-000000000000'), v_code)
  );
  v_counts := v_counts || jsonb_build_object('purchase_orders', v_add);

  -- Comms / events
  v_add := public._purge_delete_if_table_exists(
    'public.channel_messages',
    format('hospital_id = %L::uuid OR hospital_code = %L', COALESCE(v_uuid_text, '00000000-0000-0000-0000-000000000000'), v_code)
  );
  v_counts := v_counts || jsonb_build_object('channel_messages', v_add);

  v_add := public._purge_delete_if_table_exists(
    'public.system_notifications',
    format('hospital_id = %L::uuid OR hospital_code = %L', COALESCE(v_uuid_text, '00000000-0000-0000-0000-000000000000'), v_code)
  );
  v_counts := v_counts || jsonb_build_object('system_notifications', v_add);

  v_add := public._purge_delete_if_table_exists(
    'public.system_events',
    format('hospital_id = %L::uuid OR hospital_code = %L', COALESCE(v_uuid_text, '00000000-0000-0000-0000-000000000000'), v_code)
  );
  v_counts := v_counts || jsonb_build_object('system_events', v_add);

  -- Identity / roster
  v_add := public._purge_delete_if_table_exists(
    'public.hospital_user_credentials',
    format('hospital_id = %L OR hospital_id = %L', v_code, v_uuid_text)
  );
  v_counts := v_counts || jsonb_build_object('hospital_user_credentials', v_add);

  v_add := public._purge_delete_if_table_exists(
    'public.hospital_staff_credentials',
    format('hospital_id = %L OR hospital_id = %L', v_code, v_uuid_text)
  );
  v_counts := v_counts || jsonb_build_object('hospital_staff_credentials', v_add);

  v_add := public._purge_delete_if_table_exists(
    'public.doctors',
    format('hospital_id = %L OR hospital_id = %L OR hospital_code = %L', v_code, v_uuid_text, v_code)
  );
  v_counts := v_counts || jsonb_build_object('doctors', v_add);

  v_add := public._purge_delete_if_table_exists(
    'public.hospital_staff',
    format('hospital_id = %L::uuid OR hospital_code = %L', COALESCE(v_uuid_text, '00000000-0000-0000-0000-000000000000'), v_code)
  );
  v_counts := v_counts || jsonb_build_object('hospital_staff', v_add);

  v_add := public._purge_delete_if_table_exists(
    'public.hospital_suppliers',
    format('hospital_id = %L OR hospital_id = %L', v_code, v_uuid_text)
  );
  v_counts := v_counts || jsonb_build_object('hospital_suppliers', v_add);

  -- Legacy operational tables (TEXT hospital_id) — no-op if absent
  v_add := public._purge_delete_if_table_exists('public.hospital_tenants', format('hospital_id = %L', v_code));
  v_counts := v_counts || jsonb_build_object('hospital_tenants', v_add);

  v_add := public._purge_delete_if_table_exists('public.hospital_opd_queue', format('hospital_id = %L', v_code));
  v_counts := v_counts || jsonb_build_object('hospital_opd_queue', v_add);

  v_add := public._purge_delete_if_table_exists('public.hospital_patients', format('hospital_id = %L', v_code));
  v_counts := v_counts || jsonb_build_object('hospital_patients', v_add);

  v_add := public._purge_delete_if_table_exists('public.hospital_beds', format('hospital_id = %L', v_code));
  v_counts := v_counts || jsonb_build_object('hospital_beds', v_add);

  v_add := public._purge_delete_if_table_exists('public.hospital_vendors', format('hospital_id = %L', v_code));
  v_counts := v_counts || jsonb_build_object('hospital_vendors', v_add);

  v_add := public._purge_delete_if_table_exists('public.hospital_emergencies', format('hospital_id = %L', v_code));
  v_counts := v_counts || jsonb_build_object('hospital_emergencies', v_add);

  -- Tenant root (match UUID and/or human-readable code)
  IF v_uuid IS NOT NULL THEN
    DELETE FROM public.hospitals WHERE id = v_uuid;
    GET DIAGNOSTICS v_hospital_deleted = ROW_COUNT;
  END IF;

  IF v_hospital_deleted = 0 THEN
    DELETE FROM public.hospitals WHERE UPPER(TRIM(hospital_code)) = v_code;
    GET DIAGNOSTICS v_hospital_deleted = ROW_COUNT;
  END IF;

  v_counts := v_counts || jsonb_build_object('hospitals', v_hospital_deleted);

  RETURN jsonb_build_object(
    'ok', true,
    'hospital_id', COALESCE(v_uuid_text, v_code),
    'hospital_code', v_code,
    'deleted', v_counts
  );
END;
$$;

REVOKE ALL ON FUNCTION public._purge_delete_if_table_exists(TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_protected_hospital_tenant(TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.resolve_hospital_tenant_keys(TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.purge_hospital_staff_member(UUID) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.purge_hospital_tenant(TEXT) TO anon, authenticated, service_role;

COMMIT;
