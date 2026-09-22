import type { SupabaseClient } from '@supabase/supabase-js';

import {
  authenticateHospitalUser,
  HOSPITAL_LOGIN_INVALID_MESSAGE,
  normalizeCredentialRole,
} from '@/lib/auth/hospitalAuth';
import { PROVISIONING_ACCESS_DENIED_MESSAGE } from '@/lib/auth/provisioning-gate';
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

export const DOCTOR_NOT_FOUND_MESSAGE = PROVISIONING_ACCESS_DENIED_MESSAGE;

export const DOCTOR_INACTIVE_MESSAGE = PROVISIONING_ACCESS_DENIED_MESSAGE;

export const DOCTOR_INVALID_PASSCODE_MESSAGE = PROVISIONING_ACCESS_DENIED_MESSAGE;

export const DOCTOR_REGISTRY_QUERY_ERROR_PREFIX = 'Clinician registry lookup failed:';

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

export function isDoctorPortalAccountActive(row: Record<string, unknown>): boolean {
  if (row.is_active === false) return false;
  const status = String(row.status ?? 'active').trim().toLowerCase();
  return status !== 'inactive' && status !== 'suspended' && status !== 'disabled';
}

export function mapDoctorRowToSession(row: Record<string, unknown>): DoctorSession {
  const doctorCode = String(row.staff_id_code ?? row.employee_id ?? row.doctor_code ?? '').trim().toUpperCase();
  const registryUuid = String(row.id ?? '').trim();
  const doctorUuid = /^[0-9a-f-]{36}$/i.test(registryUuid) ? registryUuid : undefined;
  const fullName = String(row.full_name ?? row.doctor_name ?? row.name ?? 'Consultant Physician').trim();

  return {
    doctorId: doctorCode || registryUuid,
    doctorUuid,
    employeeId: doctorCode || registryUuid,
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
    doctorId: String(row.id ?? session.doctorId),
    doctorName: session.doctorName,
    email: session.email,
    department: session.department || 'General Medicine',
    hospitalId: session.hospitalCode || HOSPITAL_TENANT_ID,
    doctorCode: String(row.employee_id ?? session.doctorId).trim().toUpperCase(),
    employeeId: session.employeeId || session.doctorId,
    fullName: session.fullName ?? session.doctorName,
    portalRoute: session.portalRoute || '/doctor/dashboard',
  };
}

/** Authenticate clinician against `public.hospital_staff` (role = doctor). */
export async function authenticateDoctorCredential(
  supabase: SupabaseClient,
  identifierInput: string,
  passcodeInput: string,
): Promise<DoctorAuthResult> {
  const rawIdentifier = (identifierInput || '').trim();
  const cleanPasscode = (passcodeInput || '').trim();

  if (!rawIdentifier || !cleanPasscode) {
    return {
      ok: false,
      error: 'Enter your Doctor ID or hospital email and security passcode.',
    };
  }

  const result = await authenticateHospitalUser(supabase, rawIdentifier, cleanPasscode);
  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  if (normalizeCredentialRole(result.user.role) !== 'doctor') {
    return { ok: false, error: HOSPITAL_LOGIN_INVALID_MESSAGE };
  }

  const row = asRecord({
    id: result.user.id,
    staff_id_code: result.user.employee_id,
    employee_id: result.user.employee_id,
    email: result.user.email,
    full_name: result.user.full_name,
    department: result.user.department,
    hospital_id: result.user.hospital_id,
    is_active: result.user.is_active,
  });

  const doctor = mapDoctorRowToSession(row);
  return { ok: true, doctor, portalSession: buildDoctorPortalSessionPayload(row) };
}

/** @deprecated Doctor portal auth uses hospital_user_credentials only. */
export async function findDoctorByIdentifier(
  _supabase: SupabaseClient,
  _rawIdentifier: string,
): Promise<{ row: Record<string, unknown> | null; error: string | null }> {
  return { row: null, error: null };
}
