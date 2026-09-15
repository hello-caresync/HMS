import type { SupabaseClient } from '@supabase/supabase-js';

import type { DoctorSession } from '@/lib/doctor/session';
import { HOSPITAL_TENANT_ID } from '@/lib/regal/constants';

export type DoctorPortalSessionPayload = {
  doctorId: string;
  doctorName: string;
  email?: string;
  department: string;
  hospitalId: string;
  doctorCode: string;
  employeeId: string;
  fullName: string;
  portalRoute: string;
};

export type DoctorAuthResult =
  | { ok: true; doctor: DoctorSession; portalSession: DoctorPortalSessionPayload }
  | { ok: false; error: string };

export const DOCTOR_NOT_FOUND_MESSAGE =
  'Clinician ID or Email not found in hospital registry.';

export const DOCTOR_INACTIVE_MESSAGE =
  'Clinician account is inactive. Please contact hospital admin.';

export const DOCTOR_INVALID_PASSCODE_MESSAGE =
  'Invalid security passcode for this clinician.';

export const DOCTOR_REGISTRY_QUERY_ERROR_PREFIX = 'Clinician registry lookup failed:';

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

function normalizePasscode(value: unknown): string {
  return String(value ?? '').trim().toUpperCase();
}

export function isDoctorPortalAccountActive(row: Record<string, unknown>): boolean {
  if (row.is_active === false) return false;
  const status = String(row.status ?? 'active').trim().toLowerCase();
  return status !== 'inactive' && status !== 'suspended' && status !== 'disabled';
}

export function verifyDoctorPortalPasscode(
  row: Record<string, unknown>,
  cleanPasscode: string,
): boolean {
  const normalized = normalizePasscode(cleanPasscode);
  if (!normalized) return false;

  const candidates = [
    row.doctor_code,
    row.employee_id,
    row.medical_license,
    row.registration_number,
    row.passcode,
    row.pin,
    row.passcode_key,
    row.temporary_passcode,
  ];

  return candidates.some((value) => normalizePasscode(value) === normalized);
}

export function resolveDoctorQueueIdentity(row: Record<string, unknown>): string {
  const candidates = [
    row.doctor_code,
    row.employee_id,
    row.doctor_id,
    row.registration_number,
    row.id,
  ]
    .map((value) => String(value ?? '').trim())
    .filter(Boolean);

  const staffCode = candidates.find((value) => /^RH-D\d+$/i.test(value));
  if (staffCode) return staffCode.toUpperCase();

  return (candidates[0] || '').toUpperCase();
}

export function mapDoctorRowToSession(row: Record<string, unknown>): DoctorSession {
  const doctorCode = String(row.doctor_code ?? row.employee_id ?? '').trim().toUpperCase();
  const doctorQueueId = doctorCode || resolveDoctorQueueIdentity(row);
  const registryUuid = String(row.doctor_id ?? row.id ?? '').trim();
  const doctorUuid = /^[0-9a-f-]{36}$/i.test(registryUuid) ? registryUuid : undefined;
  const fullName = String(row.full_name ?? row.doctor_name ?? row.name ?? 'Consultant Physician').trim();

  return {
    doctorId: doctorQueueId,
    doctorUuid,
    employeeId: doctorQueueId,
    doctorName: fullName,
    fullName,
    doctor_name: fullName,
    email: String(row.email ?? '').trim().toLowerCase() || undefined,
    department: String(row.department ?? row.specialization ?? 'General Medicine').trim(),
    specialization: String(row.specialization ?? row.specialty ?? row.department ?? '').trim() || undefined,
    hospitalCode: String(row.hospital_id ?? row.hospital_code ?? HOSPITAL_TENANT_ID).trim(),
    portalRoute: '/doctor/dashboard',
  };
}

export function buildDoctorPortalSessionPayload(row: Record<string, unknown>): DoctorPortalSessionPayload {
  const session = mapDoctorRowToSession(row);
  return {
    doctorId: String(row.doctor_id ?? row.id ?? session.doctorId),
    doctorName: session.doctorName,
    email: session.email,
    department: session.department || 'General Medicine',
    hospitalId: session.hospitalCode || HOSPITAL_TENANT_ID,
    doctorCode: String(row.doctor_code ?? row.employee_id ?? session.doctorId).trim().toUpperCase(),
    employeeId: session.employeeId || session.doctorId,
    fullName: session.fullName ?? session.doctorName,
    portalRoute: session.portalRoute || '/doctor/dashboard',
  };
}

function formatRegistryQueryError(error: { message?: string } | null): string {
  const detail = String(error?.message ?? '').trim();
  if (!detail) {
    return `${DOCTOR_REGISTRY_QUERY_ERROR_PREFIX} Could not read public.doctors.`;
  }
  return `${DOCTOR_REGISTRY_QUERY_ERROR_PREFIX} ${detail}`;
}

/** Lookup clinician in `public.doctors` by email or staff identifier. */
export async function findDoctorByIdentifier(
  supabase: SupabaseClient,
  rawIdentifier: string,
): Promise<{ row: Record<string, unknown> | null; error: string | null }> {
  const trimmed = rawIdentifier.trim();
  if (!trimmed) {
    return { row: null, error: null };
  }

  const cleanIdentifier = trimmed.toLowerCase();
  const lookupColumns = trimmed.includes('@')
    ? (['email'] as const)
    : (['doctor_code', 'employee_id', 'doctor_id', 'registration_number'] as const);

  for (const column of lookupColumns) {
    let query = supabase.from('doctors').select('*').limit(5);
    if (column === 'email') {
      query = query.ilike(column, cleanIdentifier);
    } else {
      query = query.ilike(column, trimmed);
    }

    const { data, error } = await query;
    if (error) {
      console.error(`Doctor login lookup failed on ${column}:`, error);
      return { row: null, error: formatRegistryQueryError(error) };
    }

    const match = (data ?? []).map(asRecord)[0] ?? null;
    if (match) return { row: match, error: null };
  }

  return { row: null, error: null };
}

export async function authenticateDoctorCredential(
  supabase: SupabaseClient,
  identifierInput: string,
  passcodeInput: string,
): Promise<DoctorAuthResult> {
  const rawIdentifier = (identifierInput || '').trim();
  const cleanPasscode = (passcodeInput || '').trim().toUpperCase();

  if (!rawIdentifier || !cleanPasscode) {
    return {
      ok: false,
      error: 'Enter your Doctor ID or hospital email and security passcode.',
    };
  }

  const { row, error } = await findDoctorByIdentifier(supabase, rawIdentifier);
  if (error) {
    return { ok: false, error };
  }
  if (!row) {
    return { ok: false, error: DOCTOR_NOT_FOUND_MESSAGE };
  }

  if (!isDoctorPortalAccountActive(row)) {
    return { ok: false, error: DOCTOR_INACTIVE_MESSAGE };
  }

  if (!verifyDoctorPortalPasscode(row, cleanPasscode)) {
    return { ok: false, error: DOCTOR_INVALID_PASSCODE_MESSAGE };
  }

  const doctor = mapDoctorRowToSession(row);
  return { ok: true, doctor, portalSession: buildDoctorPortalSessionPayload(row) };
}
