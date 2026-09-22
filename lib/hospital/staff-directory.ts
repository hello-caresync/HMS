import type { SupabaseClient } from '@supabase/supabase-js';

import { resolveDoctorRegistrationEmail } from '@/lib/hospital/doctors';
import { fetchBookableDoctorsFromTable, upsertBookableDoctor } from '@/lib/hospital/doctors-directory';
import {
  classifyGovernancePersonnelRole,
  fetchGovernancePersonnelCredentials,
} from '@/lib/hospital/governance-directory';
import { hospitalDirectoryFilterIds } from '@/lib/hospital/hospital-node';
import {
  isHospitalCode,
  isHospitalUuid,
  resolveHospitalUuid,
} from '@/lib/hospital/resolve-hospital-context';
import { HOSPITAL_TENANT_ID, REGAL_HOSPITAL_CODE } from '@/lib/regal/constants';

export type StaffRole = 'doctor' | 'staff' | 'admin';

export type HospitalStaffMember = {
  id: string;
  credential_id?: string;
  staff_record_id?: string;
  raw_role?: string;
  hospital_id: string;
  staff_id_code: string;
  full_name: string;
  email: string;
  passcode_key: string;
  role: StaffRole;
  department: string;
  qualification: string;
  consultation_fee: number | null;
  is_active: boolean;
  created_at?: string;
};

export type StaffDirectoryDraft = {
  staff_id_code: string;
  full_name: string;
  email: string;
  passcode_key: string;
  role: StaffRole;
  /** Display role persisted to hospital_staff.role (Admin, Doctor, Nurse, …). */
  role_label?: string;
  department: string;
  qualification: string;
  consultation_fee: number | null;
  is_active: boolean;
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

export function normalizeStaffRole(raw?: string | null): StaffRole {
  const value = String(raw ?? '').trim().toLowerCase();
  if (value === 'admin') return 'admin';
  if (value === 'staff' || value === 'nurse' || value === 'receptionist' || value === 'pharmacist') {
    return 'staff';
  }
  return 'doctor';
}

/** Map credential / governance role strings to command-center buckets. */
export function mapCredentialRoleToStaffRole(rawRole?: string | null): StaffRole {
  const classification = classifyGovernancePersonnelRole(rawRole);
  if (classification === 'Doctor') return 'doctor';
  if (classification === 'Administration') return 'admin';
  return 'staff';
}

export function mapHospitalStaffMember(row: Record<string, unknown>, hospitalId: string): HospitalStaffMember {
  const role = normalizeStaffRole(String(row.role ?? row.staff_type ?? 'doctor'));
  return {
    id: String(row.id ?? ''),
    hospital_id: String(row.hospital_id ?? hospitalId),
    staff_id_code: String(row.staff_id_code ?? row.employee_id ?? ''),
    full_name: String(row.full_name ?? '').trim(),
    email: String(row.email ?? '').trim(),
    passcode_key: String(row.passcode_key ?? row.temporary_passcode ?? row.passcode ?? ''),
    role,
    department: String(row.department ?? ''),
    qualification: String(row.qualification ?? ''),
    consultation_fee:
      row.consultation_fee == null || row.consultation_fee === ''
        ? null
        : Number(row.consultation_fee) || null,
    is_active: row.is_active !== false && String(row.status ?? 'active').toLowerCase() !== 'restricted',
    created_at: row.created_at ? String(row.created_at) : undefined,
  };
}

export async function fetchHospitalStaffDirectory(
  supabase: SupabaseClient,
  hospitalId: string,
): Promise<HospitalStaffMember[]> {
  const filterIds = hospitalDirectoryFilterIds(hospitalId);

  let data: unknown[] | null = null;
  let error: { message: string } | null = null;

  if (filterIds.length > 0) {
    const scoped = await supabase
      .from('hospital_staff')
      .select('*')
      .in('hospital_id', filterIds)
      .order('created_at', { ascending: false });
    data = scoped.data;
    error = scoped.error;
  }

  if (error || !Array.isArray(data) || data.length === 0) {
    const fallback = await supabase
      .from('hospital_staff')
      .select('*')
      .order('created_at', { ascending: false });
    data = fallback.data;
    error = fallback.error;
  }

  if (error || !Array.isArray(data)) return [];

  const seen = new Set<string>();
  return data
    .map((row) => mapHospitalStaffMember(asRecord(row), hospitalId))
    .filter((row) => {
      if (!row.full_name) return false;
      const key = row.email.toLowerCase() || row.staff_id_code || row.id;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

/**
 * Primary roster for Doctors & Staff Command Center — credentials vault is canonical,
 * enriched with hospital_staff rows and doctors table consultation fees.
 */
export async function fetchCommandCenterPersonnel(
  supabase: SupabaseClient,
  hospitalId: string,
): Promise<HospitalStaffMember[]> {
  const [credentials, staffRows, doctorRows] = await Promise.all([
    fetchGovernancePersonnelCredentials(supabase, hospitalId),
    fetchHospitalStaffDirectory(supabase, hospitalId),
    fetchBookableDoctorsFromTable(supabase, hospitalId),
  ]);

  const staffByEmail = new Map<string, HospitalStaffMember>();
  for (const row of staffRows) {
    const email = row.email.trim().toLowerCase();
    if (email) staffByEmail.set(email, row);
  }

  const doctorByEmail = new Map<string, Record<string, unknown>>();
  const doctorByCode = new Map<string, Record<string, unknown>>();
  for (const row of doctorRows) {
    const email = String(row.email ?? '').trim().toLowerCase();
    const code = String(row.doctor_code ?? row.registration_number ?? '').trim().toUpperCase();
    if (email) doctorByEmail.set(email, row);
    if (code) doctorByCode.set(code, row);
  }

  const seen = new Set<string>();
  const members: HospitalStaffMember[] = [];

  for (const credential of credentials) {
    const emailKey = credential.email.trim().toLowerCase();
    if (!emailKey || seen.has(emailKey)) continue;
    seen.add(emailKey);

    const staff = staffByEmail.get(emailKey);
    const doctor =
      doctorByEmail.get(emailKey) ??
      (credential.employee_id
        ? doctorByCode.get(credential.employee_id.trim().toUpperCase())
        : undefined);

    const role = mapCredentialRoleToStaffRole(credential.role);
    const doctorFeeRaw = doctor?.consultation_fee ?? doctor?.fee;
    const consultationFee =
      role === 'doctor'
        ? staff?.consultation_fee ??
          (doctorFeeRaw != null && doctorFeeRaw !== ''
            ? Number(doctorFeeRaw) || null
            : null)
        : null;

    members.push({
      id: staff?.id || credential.id,
      credential_id: credential.id,
      staff_record_id: staff?.id,
      raw_role: credential.role,
      hospital_id: String(credential.hospital_id || staff?.hospital_id || hospitalId),
      staff_id_code: credential.employee_id || staff?.staff_id_code || '',
      full_name: credential.full_name || staff?.full_name || '',
      email: credential.email,
      passcode_key: staff?.passcode_key || '',
      role,
      department: credential.department || staff?.department || '',
      qualification: staff?.qualification || String(doctor?.qualification ?? ''),
      consultation_fee: consultationFee,
      is_active: credential.is_active,
      created_at: staff?.created_at,
    });
  }

  return members.filter((row) => row.full_name.trim());
}

function nextStaffCode(role: StaffRole): string {
  const prefix = role === 'admin' ? 'RH-A' : role === 'staff' ? 'RH-S' : 'RH-D';
  return `${prefix}${Date.now().toString().slice(-4)}`;
}

function resolveStoredRoleLabel(draft: StaffDirectoryDraft, internalRole: StaffRole): string {
  const label = draft.role_label?.trim();
  if (label) return label;
  if (internalRole === 'admin') return 'Admin';
  if (internalRole === 'doctor') return 'Doctor';
  return 'Staff';
}

function resolveHospitalCodeForWrite(hospitalId: string): string {
  const trimmed = hospitalId.trim();
  if (isHospitalCode(trimmed)) return trimmed.toUpperCase();
  return REGAL_HOSPITAL_CODE;
}

function staffPayload(
  hospitalUuid: string,
  hospitalCode: string,
  draft: StaffDirectoryDraft,
): Record<string, unknown> {
  const role = normalizeStaffRole(draft.role);
  const fee =
    role === 'doctor'
      ? Math.max(0, Number(draft.consultation_fee ?? 500) || 500)
      : null;
  const employeeCode = (draft.staff_id_code.trim() || nextStaffCode(role)).toUpperCase();

  // Never send `id` — custom RH-D / RH-S codes belong in staff_id_code + employee_id only.
  return {
    hospital_id: hospitalUuid,
    hospital_code: hospitalCode,
    staff_id_code: employeeCode,
    employee_id: employeeCode,
    full_name: draft.full_name.trim(),
    email: draft.email.trim() || null,
    passcode_key: draft.passcode_key.trim() || null,
    role: resolveStoredRoleLabel(draft, role),
    department: draft.department.trim() || (role === 'doctor' ? 'General Medicine' : 'Operations'),
    qualification: draft.qualification.trim() || null,
    consultation_fee: fee,
    is_active: draft.is_active,
  };
}

export async function createHospitalStaffMember(
  supabase: SupabaseClient,
  hospitalId: string,
  draft: StaffDirectoryDraft,
): Promise<{ ok: boolean; member?: HospitalStaffMember; error?: string }> {
  if (!draft.full_name.trim()) return { ok: false, error: 'Full name is required' };
  if (!draft.passcode_key.trim()) {
    return { ok: false, error: 'Security passcode is required for portal login' };
  }
  if (draft.role === 'doctor' && draft.consultation_fee != null && Number(draft.consultation_fee) < 0) {
    return { ok: false, error: 'Consultation fee cannot be negative' };
  }

  const resolvedHospitalUuid =
    (await resolveHospitalUuid(supabase, hospitalId)) ||
    (isHospitalUuid(hospitalId) ? hospitalId.trim() : null);

  if (!resolvedHospitalUuid) {
    return { ok: false, error: 'Could not resolve hospital tenant for this credential.' };
  }

  const hospitalCode = resolveHospitalCodeForWrite(hospitalId);

  const { data, error } = await supabase
    .from('hospital_staff')
    .insert([staffPayload(resolvedHospitalUuid, hospitalCode, draft)])
    .select()
    .maybeSingle();

  if (error) {
    const message = error.message || 'Could not add staff member';
    if (/duplicate|unique|already exists/i.test(message)) {
      return { ok: false, error: 'That email is already assigned to another staff record' };
    }
    return { ok: false, error: message };
  }

  const member = mapHospitalStaffMember(asRecord(data), hospitalId);

  if (member.role === 'doctor') {
    const syncResult = await upsertBookableDoctor(supabase, hospitalId, {
      staff_id_code: member.staff_id_code,
      full_name: member.full_name,
      email: resolveDoctorRegistrationEmail({
        email: member.email,
        full_name: member.full_name,
        staff_id_code: member.staff_id_code,
      }),
      department: member.department,
      qualification: member.qualification,
      consultation_fee: member.consultation_fee ?? 500,
    });
    if (!syncResult.ok) {
      console.warn('[createHospitalStaffMember] doctors table sync skipped:', syncResult.error);
    }
  }

  return { ok: true, member };
}

export async function updateHospitalStaffMember(
  supabase: SupabaseClient,
  hospitalId: string,
  id: string,
  draft: StaffDirectoryDraft,
): Promise<{ ok: boolean; member?: HospitalStaffMember; error?: string }> {
  if (!draft.full_name.trim()) return { ok: false, error: 'Full name is required' };

  const resolvedHospitalUuid =
    (await resolveHospitalUuid(supabase, hospitalId)) ||
    (isHospitalUuid(hospitalId) ? hospitalId.trim() : null);

  if (!resolvedHospitalUuid) {
    return { ok: false, error: 'Could not resolve hospital tenant for this credential.' };
  }

  const hospitalCode = resolveHospitalCodeForWrite(hospitalId);

  const { data, error } = await supabase
    .from('hospital_staff')
    .update(staffPayload(resolvedHospitalUuid, hospitalCode, draft))
    .eq('id', id)
    .eq('hospital_id', resolvedHospitalUuid)
    .select()
    .maybeSingle();

  if (error) {
    const message = error.message || 'Could not update staff member';
    if (/duplicate|unique|already exists/i.test(message)) {
      return { ok: false, error: 'That email is already assigned to another staff record' };
    }
    return { ok: false, error: message };
  }

  const member = mapHospitalStaffMember(asRecord(data), hospitalId);

  if (member.role === 'doctor') {
    const syncResult = await upsertBookableDoctor(supabase, hospitalId, {
      staff_id_code: member.staff_id_code,
      full_name: member.full_name,
      email: resolveDoctorRegistrationEmail({
        email: member.email,
        full_name: member.full_name,
        staff_id_code: member.staff_id_code,
      }),
      department: member.department,
      qualification: member.qualification,
      consultation_fee: member.consultation_fee ?? 500,
    });
    if (!syncResult.ok) {
      console.warn('[updateHospitalStaffMember] doctors table sync skipped:', syncResult.error);
    }
  }

  return { ok: true, member };
}

export async function deleteHospitalStaffMember(
  supabase: SupabaseClient,
  hospitalId: string,
  id: string,
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.from('hospital_staff').delete().eq('id', id).eq('hospital_id', hospitalId);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export function toDashboardStaffRow(member: HospitalStaffMember) {
  return {
    id: member.staff_id_code || member.id,
    full_name: member.full_name,
    staff_type: member.role === 'doctor' ? 'Doctor' : member.role === 'admin' ? 'Admin' : 'Staff',
    department: member.department,
    email: member.email,
    temporary_passcode: member.passcode_key,
    portal_access: member.role === 'doctor' ? '/doctor/dashboard' : '/dashboard',
    status: member.is_active ? 'Active' : 'Restricted',
  };
}

export const HOSPITAL_STAFF_DEFAULT_HOSPITAL = HOSPITAL_TENANT_ID;
