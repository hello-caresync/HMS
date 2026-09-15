-- Seed vs real data inventory (READ-ONLY — run in Supabase SQL Editor)
-- Does NOT touch hospitals table rows or schema.
--
-- Schema-safe: uses to_jsonb(row) so missing columns (e.g. employee_id) do not error.
-- Run ONE section at a time if your editor times out on large tables.

-- ============================================================================
-- 0) Discover live columns (run this first if any section still errors)
-- ============================================================================
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN (
    'hospital_staff', 'appointments', 'billing_invoices', 'purchase_orders',
    'medical_records', 'clinical_notes', 'opd_queue', 'emergency_alerts',
    'channel_messages', 'system_notifications', 'lab_orders', 'radiology_orders'
  )
ORDER BY table_name, ordinal_position;

-- Known seed signatures:
--   staff code ~ '^RH-D[0-9]+' (employee_id OR staff_id_code)
--   email ~ '@regalhospital.com'
--   demo patient UUID 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' or uhid/text id 'pat-v0-9021'

-- ============================================================================
-- hospital_staff — full row inventory
-- ============================================================================
SELECT
  s.id,
  COALESCE(j->>'employee_id', j->>'staff_id_code', j->>'doctor_code') AS staff_code,
  COALESCE(j->>'full_name', j->>'name') AS full_name,
  j->>'email' AS email,
  j->>'role' AS role,
  j->>'department' AS department,
  (j->>'is_active')::boolean AS is_active,
  (j->>'created_at')::timestamptz AS created_at,
  CASE
    WHEN COALESCE(j->>'employee_id', j->>'staff_id_code', '') ~* '^RH-D[0-9]+'
      THEN 'seed — RH-D roster staff code'
    WHEN COALESCE(j->>'email', '') ~* '@regalhospital\.com$'
      THEN 'seed — @regalhospital.com roster email'
    WHEN lower(COALESCE(j->>'email', '')) IN (
      'patient@nexora.com', 'hospital@curasync.com', 'hmsadmin1@gmail.com', 'admin@regalhospital.com'
    ) THEN 'seed — known demo email'
    ELSE 'uncertain — confirm before delete'
  END AS classification
FROM public.hospital_staff s
CROSS JOIN LATERAL (SELECT to_jsonb(s) AS j) _j
ORDER BY created_at, full_name;

-- ============================================================================
-- appointments
-- ============================================================================
SELECT
  a.id,
  j->>'patient_id' AS patient_id,
  j->>'uhid' AS uhid,
  j->>'patient_name' AS patient_name,
  j->>'doctor_name' AS doctor_name,
  j->>'department' AS department,
  j->>'status' AS status,
  (j->>'appointment_date')::date AS appointment_date,
  (j->>'created_at')::timestamptz AS created_at,
  CASE
    WHEN COALESCE(j->>'patient_id', '') IN (
      'pat-v0-9021', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
    ) THEN 'seed — demo patient id'
    WHEN COALESCE(j->>'uhid', '') ILIKE '%9021%' OR COALESCE(j->>'uhid', '') ILIKE '%NEX%'
      THEN 'seed — demo uhid marker'
    WHEN COALESCE(j->>'patient_name', '') ILIKE '%nexora%' OR COALESCE(j->>'patient_name', '') ILIKE '%demo%'
      THEN 'seed — demo name marker'
    WHEN COALESCE(j->>'doctor_name', '') ILIKE '%Aishwarya D S%'
      THEN 'seed — ecosystem seed doctor'
    ELSE 'uncertain — confirm before delete'
  END AS classification
FROM public.appointments a
CROSS JOIN LATERAL (SELECT to_jsonb(a) AS j) _j
ORDER BY created_at;

-- ============================================================================
-- billing_invoices
-- ============================================================================
SELECT
  b.id,
  j->>'invoice_number' AS invoice_number,
  COALESCE(j->>'patient_uhid', j->>'uhid', j->>'patient_id') AS patient_ref,
  j->>'patient_name' AS patient_name,
  j->>'doctor_name' AS doctor_name,
  COALESCE(j->>'payment_status', j->>'status') AS payment_status,
  COALESCE((j->>'total_amount')::numeric, (j->>'total_payable')::numeric) AS total_amount,
  (j->>'created_at')::timestamptz AS created_at,
  CASE
    WHEN COALESCE(j->>'patient_uhid', j->>'uhid', j->>'patient_id', '') IN (
      'pat-v0-9021', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
    ) THEN 'seed — demo patient ref'
    WHEN COALESCE(j->>'invoice_number', '') ~* '^(PO-SEED|INV-SEED|DEMO-)'
      THEN 'seed — seed document prefix'
    ELSE 'uncertain — confirm before delete'
  END AS classification
FROM public.billing_invoices b
CROSS JOIN LATERAL (SELECT to_jsonb(b) AS j) _j
ORDER BY created_at;

-- ============================================================================
-- purchase_orders
-- ============================================================================
SELECT
  p.id,
  COALESCE(j->>'po_number', j->>'order_number') AS po_number,
  COALESCE(j->>'vendor_name', j->>'supplier_name') AS vendor_name,
  j->>'status' AS status,
  COALESCE((j->>'total_amount')::numeric, (j->>'amount')::numeric) AS total_amount,
  j->>'hospital_id' AS hospital_id,
  j->>'notes' AS notes,
  (j->>'created_at')::timestamptz AS created_at,
  CASE
    WHEN COALESCE(j->>'po_number', j->>'order_number', '') ~* '^(PO-SEED|DEMO-|SEED-)'
      THEN 'seed — seed PO prefix'
    WHEN COALESCE(j->>'notes', '') ILIKE '%seed%' OR COALESCE(j->>'notes', '') ILIKE '%demo%'
      THEN 'seed — notes mention seed/demo'
    ELSE 'uncertain — confirm before delete'
  END AS classification
FROM public.purchase_orders p
CROSS JOIN LATERAL (SELECT to_jsonb(p) AS j) _j
ORDER BY created_at;

-- ============================================================================
-- medical_records
-- ============================================================================
SELECT
  m.id,
  j->>'patient_id' AS patient_id,
  COALESCE(j->>'patient_name', j->>'summary') AS label,
  j->>'record_type' AS record_type,
  left(COALESCE(j->>'summary', j->>'title', ''), 80) AS summary_preview,
  (j->>'created_at')::timestamptz AS created_at,
  CASE
    WHEN COALESCE(j->>'patient_id', '') IN (
      'pat-v0-9021', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
    ) THEN 'seed — demo patient id'
    ELSE 'uncertain — confirm before delete'
  END AS classification
FROM public.medical_records m
CROSS JOIN LATERAL (SELECT to_jsonb(m) AS j) _j
ORDER BY created_at;

-- ============================================================================
-- clinical_notes
-- ============================================================================
SELECT
  c.id,
  j->>'patient_id' AS patient_id,
  j->>'doctor_name' AS doctor_name,
  COALESCE(j->>'diagnosis_disease', j->>'note_type') AS note_label,
  (j->>'created_at')::timestamptz AS created_at,
  CASE
    WHEN COALESCE(j->>'patient_id', '') IN (
      'pat-v0-9021', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
    ) THEN 'seed — demo patient id'
    ELSE 'uncertain — confirm before delete'
  END AS classification
FROM public.clinical_notes c
CROSS JOIN LATERAL (SELECT to_jsonb(c) AS j) _j
ORDER BY created_at;

-- ============================================================================
-- opd_queue
-- ============================================================================
SELECT
  q.id,
  j->>'patient_id' AS patient_id,
  j->>'patient_name' AS patient_name,
  j->>'doctor_name' AS doctor_name,
  j->>'token_number' AS token_number,
  COALESCE(j->>'queue_status', j->>'status') AS queue_status,
  (j->>'created_at')::timestamptz AS created_at,
  CASE
    WHEN COALESCE(j->>'patient_id', '') IN (
      'pat-v0-9021', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
    ) THEN 'seed — demo patient id'
    ELSE 'uncertain — confirm before delete'
  END AS classification
FROM public.opd_queue q
CROSS JOIN LATERAL (SELECT to_jsonb(q) AS j) _j
ORDER BY created_at;

-- ============================================================================
-- emergency_alerts
-- ============================================================================
SELECT
  e.id,
  j->>'patient_name' AS patient_name,
  j->>'severity' AS severity,
  j->>'status' AS status,
  (j->>'created_at')::timestamptz AS created_at,
  CASE
    WHEN COALESCE(j->>'patient_name', '') ILIKE '%demo%'
      OR COALESCE(j->>'patient_name', '') ILIKE '%nexora%'
      THEN 'seed — demo name marker'
    ELSE 'uncertain — confirm before delete'
  END AS classification
FROM public.emergency_alerts e
CROSS JOIN LATERAL (SELECT to_jsonb(e) AS j) _j
ORDER BY created_at;

-- ============================================================================
-- channel_messages
-- ============================================================================
SELECT
  cm.id,
  COALESCE(j->>'sender_name', j->>'sender_id') AS sender,
  COALESCE(j->>'recipient_name', j->>'recipient_id') AS recipient,
  left(COALESCE(j->>'message', j->>'body', ''), 80) AS message_preview,
  j->>'channel' AS channel,
  (j->>'created_at')::timestamptz AS created_at,
  CASE
    WHEN COALESCE(j->>'message', j->>'body', '') ILIKE '%demo%'
      OR COALESCE(j->>'message', j->>'body', '') ILIKE '%seed%'
      THEN 'seed — content marker'
    ELSE 'uncertain — confirm before delete'
  END AS classification
FROM public.channel_messages cm
CROSS JOIN LATERAL (SELECT to_jsonb(cm) AS j) _j
ORDER BY created_at;

-- ============================================================================
-- system_notifications
-- ============================================================================
SELECT
  sn.id,
  j->>'title' AS title,
  left(COALESCE(j->>'message', j->>'body', ''), 80) AS message_preview,
  COALESCE(j->>'recipient_id', j->>'patient_id') AS recipient_id,
  j->>'type' AS type,
  (j->>'created_at')::timestamptz AS created_at,
  CASE
    WHEN COALESCE(j->>'recipient_id', j->>'patient_id', '') IN (
      'pat-v0-9021', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
    ) THEN 'seed — demo recipient'
    ELSE 'uncertain — confirm before delete'
  END AS classification
FROM public.system_notifications sn
CROSS JOIN LATERAL (SELECT to_jsonb(sn) AS j) _j
ORDER BY created_at;

-- ============================================================================
-- lab_orders (skip if table does not exist)
-- ============================================================================
SELECT
  lo.id,
  j->>'patient_id' AS patient_id,
  j->>'test_name' AS test_name,
  j->>'status' AS status,
  j->>'ordered_by' AS ordered_by,
  (j->>'created_at')::timestamptz AS created_at,
  CASE
    WHEN COALESCE(j->>'patient_id', '') IN (
      'pat-v0-9021', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
    ) THEN 'seed — demo patient id'
    ELSE 'uncertain — confirm before delete'
  END AS classification
FROM public.lab_orders lo
CROSS JOIN LATERAL (SELECT to_jsonb(lo) AS j) _j
ORDER BY created_at;

-- ============================================================================
-- radiology_orders (skip if table does not exist)
-- ============================================================================
SELECT
  ro.id,
  j->>'patient_id' AS patient_id,
  j->>'study_name' AS study_name,
  j->>'status' AS status,
  j->>'ordered_by' AS ordered_by,
  (j->>'created_at')::timestamptz AS created_at,
  CASE
    WHEN COALESCE(j->>'patient_id', '') IN (
      'pat-v0-9021', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
    ) THEN 'seed — demo patient id'
    ELSE 'uncertain — confirm before delete'
  END AS classification
FROM public.radiology_orders ro
CROSS JOIN LATERAL (SELECT to_jsonb(ro) AS j) _j
ORDER BY created_at;

-- ============================================================================
-- Summary counts — hospital_staff + appointments
-- ============================================================================
SELECT 'hospital_staff' AS table_name, classification, count(*)
FROM (
  SELECT CASE
    WHEN COALESCE(j->>'employee_id', j->>'staff_id_code', '') ~* '^RH-D[0-9]+'
      OR COALESCE(j->>'email', '') ~* '@regalhospital\.com$'
      OR lower(COALESCE(j->>'email', '')) IN (
        'patient@nexora.com', 'hospital@curasync.com', 'hmsadmin1@gmail.com', 'admin@regalhospital.com'
      )
    THEN 'seed' ELSE 'uncertain' END AS classification
  FROM public.hospital_staff s
  CROSS JOIN LATERAL (SELECT to_jsonb(s) AS j) _j
) x
GROUP BY classification
UNION ALL
SELECT 'appointments', classification, count(*)
FROM (
  SELECT CASE
    WHEN COALESCE(j->>'patient_id', '') IN ('pat-v0-9021', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11')
      OR COALESCE(j->>'uhid', '') ILIKE '%9021%'
      OR COALESCE(j->>'patient_name', '') ILIKE '%nexora%'
    THEN 'seed' ELSE 'uncertain' END AS classification
  FROM public.appointments a
  CROSS JOIN LATERAL (SELECT to_jsonb(a) AS j) _j
) x
GROUP BY classification;
