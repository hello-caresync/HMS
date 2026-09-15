/**
 * Regal Hospital Enterprise Platform — shared constants (RH-BLR-01).
 *
 * hospital_id columns store UUIDs (hospitals.id).
 * REGAL_HOSPITAL_CODE is the human-readable tenant code — never write it into UUID columns.
 */

/** Human-readable tenant code for UI labels and hospitals.hospital_code lookups. */
export const REGAL_HOSPITAL_CODE = 'HOSP-01';

/** @deprecated Use REGAL_HOSPITAL_CODE for code; resolveHospitalUuid() for UUID writes. */
export const HOSPITAL_TENANT_ID = REGAL_HOSPITAL_CODE;

export const REGAL_FACILITY_CODE = 'RH-BLR-01';
export const REGAL_HOSPITAL_NAME = 'Regal Hospital';

/** Seed row from 0001_core_schema — merged away by 0008; do not use for writes. */
export const LEGACY_SEED_HOSPITAL_ID = '11111111-1111-1111-1111-111111111111';

/** Old static roster placeholder — merged away by 0008; do not use for writes. */
export const LEGACY_ROSTER_HOSPITAL_ID = 'a1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

/** Active Regal node UUID used on legacy purchase_orders / vendor_invoices rows. */
export const LEGACY_ACTIVE_HOSPITAL_ID = 'a0000000-0000-0000-0000-000000000001';

/** @deprecated Alias for LEGACY_SEED_HOSPITAL_ID — use resolveHospitalUuid() instead. */
export const REGAL_HOSPITAL_ID = LEGACY_SEED_HOSPITAL_ID;

export const DEFAULT_VENDOR_ID = '11111111-1111-1111-1111-111111111111';

export const BILLS_TABLE = 'bills';
export const LEGACY_BILLS_TABLE = 'billing_invoices';
