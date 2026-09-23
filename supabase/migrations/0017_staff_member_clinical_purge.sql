-- Extend purge_hospital_staff_member to cascade through clinical / OPD child tables
-- before removing doctors, credentials, and hospital_staff rows.

BEGIN;

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
  v_deleted_clinical BIGINT := 0;
  v_doctor_keys TEXT[] := ARRAY[]::TEXT[];
  v_key TEXT;
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
    hs.role,
    hs.full_name
  INTO v_staff
  FROM public.hospital_staff hs
  WHERE hs.id = p_staff_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Staff credential not found.');
  END IF;

  IF public.is_protected_hospital_tenant(COALESCE(v_staff.hospital_code, v_staff.hospital_id::text)) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Cannot delete credentials on a protected platform seed tenant.');
  END IF;

  v_doctor_keys := ARRAY[
    COALESCE(v_staff.staff_id_code, ''),
    COALESCE(v_staff.id::text, ''),
    COALESCE(v_staff.email, '')
  ];

  FOR v_key IN
    SELECT DISTINCT unnest(ARRAY[
      d.doctor_id,
      d.doctor_code,
      d.registration_number,
      d.id::text
    ])
    FROM public.doctors d
    WHERE lower(COALESCE(d.email, '')) = lower(COALESCE(v_staff.email, ''))
       OR d.doctor_code = COALESCE(v_staff.staff_id_code, '')
       OR d.registration_number = COALESCE(v_staff.staff_id_code, '')
       OR d.doctor_id = COALESCE(v_staff.staff_id_code, '')
  LOOP
    IF v_key IS NOT NULL AND TRIM(v_key) <> '' THEN
      v_doctor_keys := array_append(v_doctor_keys, v_key);
    END IF;
  END LOOP;

  -- Clinical / operational children (doctor-scoped)
  v_deleted_clinical := v_deleted_clinical + public._purge_delete_if_table_exists(
    'public.clinical_notes',
    format(
      'doctor_id = ANY(%L::text[])
       OR (%L <> '''' AND doctor_name = %L)
       OR queue_id IN (
         SELECT id FROM public.opd_queue
         WHERE doctor_id = ANY(%L::text[])
            OR (%L <> '''' AND doctor_name = %L)
       )',
      v_doctor_keys,
      COALESCE(v_staff.full_name, ''), COALESCE(v_staff.full_name, ''),
      v_doctor_keys,
      COALESCE(v_staff.full_name, ''), COALESCE(v_staff.full_name, '')
    )
  );

  v_deleted_clinical := v_deleted_clinical + public._purge_delete_if_table_exists(
    'public.medical_records',
    format(
      'doctor_id::text = ANY(%L::text[])
       OR appointment_id IN (
         SELECT id FROM public.appointments
         WHERE doctor_id = ANY(%L::text[])
            OR doctor_code = %L
            OR doctor_employee_id = %L
       )',
      v_doctor_keys,
      v_doctor_keys,
      COALESCE(v_staff.staff_id_code, ''),
      COALESCE(v_staff.staff_id_code, '')
    )
  );

  v_deleted_clinical := v_deleted_clinical + public._purge_delete_if_table_exists(
    'public.appointments',
    format(
      'doctor_id = ANY(%L::text[])
       OR doctor_code = %L
       OR doctor_employee_id = %L
       OR (%L <> '''' AND doctor_name = %L)',
      v_doctor_keys,
      COALESCE(v_staff.staff_id_code, ''),
      COALESCE(v_staff.staff_id_code, ''),
      COALESCE(v_staff.full_name, ''), COALESCE(v_staff.full_name, '')
    )
  );

  v_deleted_clinical := v_deleted_clinical + public._purge_delete_if_table_exists(
    'public.opd_queue',
    format(
      'doctor_id = ANY(%L::text[])
       OR (%L <> '''' AND doctor_name = %L)',
      v_doctor_keys,
      COALESCE(v_staff.full_name, ''), COALESCE(v_staff.full_name, '')
    )
  );

  v_deleted_clinical := v_deleted_clinical + public._purge_delete_if_table_exists(
    'public.hospital_opd_queue',
    format(
      '%L <> '''' AND doctor_name = %L',
      COALESCE(v_staff.full_name, ''), COALESCE(v_staff.full_name, '')
    )
  );

  v_deleted_clinical := v_deleted_clinical + public._purge_delete_if_table_exists(
    'public.doctor_schedules',
    format('doctor_id = ANY(%L::text[])', v_doctor_keys)
  );

  v_deleted_clinical := v_deleted_clinical + public._purge_delete_if_table_exists(
    'public.doctor_time_slots',
    format('doctor_id = ANY(%L::text[])', v_doctor_keys)
  );

  v_deleted_clinical := v_deleted_clinical + public._purge_delete_if_table_exists(
    'public.lab_orders',
    format(
      'doctor_id = ANY(%L::text[])
       OR (%L <> '''' AND doctor_name = %L)',
      v_doctor_keys,
      COALESCE(v_staff.full_name, ''), COALESCE(v_staff.full_name, '')
    )
  );

  v_deleted_clinical := v_deleted_clinical + public._purge_delete_if_table_exists(
    'public.radiology_orders',
    format(
      'doctor_id = ANY(%L::text[])
       OR (%L <> '''' AND doctor_name = %L)',
      v_doctor_keys,
      COALESCE(v_staff.full_name, ''), COALESCE(v_staff.full_name, '')
    )
  );

  v_deleted_clinical := v_deleted_clinical + public._purge_delete_if_table_exists(
    'public.prescriptions',
    format('doctor_id = ANY(%L::text[])', v_doctor_keys)
  );

  v_deleted_clinical := v_deleted_clinical + public._purge_delete_if_table_exists(
    'public.hospital_prescriptions',
    format(
      'doctor_id = ANY(%L::text[])
       OR (%L <> '''' AND doctor_name = %L)',
      v_doctor_keys,
      COALESCE(v_staff.full_name, ''), COALESCE(v_staff.full_name, '')
    )
  );

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
      'clinical_and_operational', v_deleted_clinical,
      'hospital_staff', v_deleted_staff,
      'doctors', v_deleted_doctors,
      'credentials', v_deleted_credentials
    )
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.purge_hospital_staff_member(UUID) TO anon, authenticated, service_role;

COMMIT;
