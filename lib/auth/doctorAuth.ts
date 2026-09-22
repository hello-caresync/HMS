import type { SupabaseClient } from '@supabase/supabase-js';

import { HOSPITAL_DESK_DASHBOARD_PATH } from '@/lib/auth/hospital-desk-session';
import {
  lookupActiveHospitalStaffByCredentials,
  toAuthUser,
} from '@/lib/auth/hospital-staff-login';
import {
  HOSPITAL_LOGIN_INVALID_MESSAGE,
  mapHospitalStaffAuthRow,
  normalizeCredentialRole,
  type HospitalAuthUser,
} from '@/lib/auth/hospitalAuth';
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
  | { ok: true; kind: 'doctor'; doctor: DoctorSession; portalSession: DoctorPortalSessionPayload }
  | { ok: true; kind: 'admin'; user: HospitalAuthUser; redirectTo: string }
  | { ok: false; error: string };

export const DOCTOR_LOGIN_INVALID_MESSAGE = HOSPITAL_LOGIN_INVALID_MESSAGE;

export const DOCTOR_ADMIN_MISROUTED_MESSAGE =
  'This is an Administrator account. Please sign in via the Hospital Portal at /hospital/login.';

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
    doctorCode: String(row.staff_id_code ?? row.employee_id ?? session.doctorId).trim().toUpperCase(),
    employeeId: session.employeeId || session.doctorId,
    fullName: session.fullName ?? session.doctorName,
    portalRoute: session.portalRoute || '/doctor/dashboard',
  };
}

export function buildDoctorSessionForCookie(session: DoctorSession): DoctorSession {
  return {
    ...session,
    loggedInAt: session.loggedInAt ?? new Date().toISOString(),
    portalRoute: session.portalRoute ?? '/doctor/dashboard',
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

  const { row, error } = await lookupActiveHospitalStaffByCredentials(
    supabase,
    rawIdentifier,
    cleanPasscode,
  );

  if (error || !row) {
    return { ok: false, error: DOCTOR_LOGIN_INVALID_MESSAGE };
  }

  const credential = mapHospitalStaffAuthRow(row);
  const user = toAuthUser(credential, cleanPasscode);
  const role = normalizeCredentialRole(user.role);

  if (role === 'admin') {
    return {
      ok: true,
      kind: 'admin',
      user,
      redirectTo: HOSPITAL_DESK_DASHBOARD_PATH,
    };
  }

  if (role !== 'doctor') {
    return { ok: false, error: DOCTOR_LOGIN_INVALID_MESSAGE };
  }

  const doctor = mapDoctorRowToSession(row);
  doctor.doctorUuid = user.id;
  doctor.employeeId = user.employee_id;
  return {
    ok: true,
    kind: 'doctor',
    doctor,
    portalSession: buildDoctorPortalSessionPayload(row),
  };
}

/** @deprecated Doctor portal auth uses hospital_user_credentials only. */
export async function findDoctorByIdentifier(
  _supabase: SupabaseClient,
  _rawIdentifier: string,
): Promise<{ row: Record<string, unknown> | null; error: string | null }> {
  return { row: null, error: null };
}
