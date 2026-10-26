import type { SupabaseClient } from '@supabase/supabase-js';

import { isGlobalSuperAdminStaffRecord } from '@/lib/auth/superAdminAuth';
import { resolveDoctorRegistrationEmail } from '@/lib/hospital/doctors';
import { fetchBookableDoctorsFromTable, upsertBookableDoctor } from '@/lib/hospital/doctors-directory';
import {
  classifyGovernancePersonnelRole,
  fetchGovernancePersonnelCredentials,
} from '@/lib/hospital/governance-directory';
import { hospitalDirectoryFilterIds, recordBelongsToHospitalNode } from '@/lib/hospital/hospital-node';
import { isHospitalCode, resolveHospitalUuid } from '@/lib/hospital/resolve-hospital-context';
import { permanentlyDeleteStaffCredential } from '@/lib/hospital/permanent-staff-delete';
import {
  HOSPITAL_TENANT_ID,
  LEGACY_ACTIVE_HOSPITAL_ID,
  LEGACY_ROSTER_HOSPITAL_ID,
  LEGACY_SEED_HOSPITAL_ID,
  REGAL_HOSPITAL_CODE,
} from '@/lib/regal/constants';

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
  specialization?: string;
  experience?: string;
  timings?: string;
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
  specialization?: string;
  experience?: string;
  timings?: string;
  is_active: boolean;
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

const STORED_PASSCODE_FIELDS = [
  'passcode_key',
  'temporary_passcode',
  'passcode',
  'password',
  'portal_pin',
  'pin',
] as const;

function readStoredPasscode(row: Record<string, unknown>): string {
  for (const key of STORED_PASSCODE_FIELDS) {
    const value = String(row[key] ?? '').trim();
    if (value && !value.startsWith('$2')) return value;
  }
  return '';
}

type DirectoryProfile = {
  passcode: string;
  specialization: string;
  experience: string;
  timings: string;
  qualification: string;
};

function readProfileDetails(row: Record<string, unknown>): Omit<DirectoryProfile, 'passcode'> {
  const yearsRaw = row.experience_years ?? row.years_of_experience ?? row.experience;
  let experience = '';
  if (typeof yearsRaw === 'number' && Number.isFinite(yearsRaw) && yearsRaw > 0) {
    experience = `${yearsRaw} Years`;
  } else if (typeof yearsRaw === 'string' && yearsRaw.trim() && yearsRaw.trim() !== '0') {
    const text = yearsRaw.trim();
    experience = /year|appointment/i.test(text) ? text : `${text} Years`;
  }
  if (!experience) {
    const designation = String(row.designation ?? '').trim();
    if (/year|appointment/i.test(designation)) experience = designation;
  }
  return {
    specialization: String(row.specialization ?? row.specialty ?? '').trim(),
    experience,
    timings: String(
      row.timings ?? row.visiting_hours ?? row.opd_timings ?? row.schedule ?? row.clinic_hours ?? row.shift ?? '',
    ).trim(),
    qualification: String(row.qualification ?? row.qualifications ?? '').trim(),
  };
}

function rememberPasscode(
  index: Map<string, string>,
  keys: { email?: string; code?: string; name?: string },
  passcode: string,
) {
  const value = passcode.trim();
  if (!value) return;
  const email = String(keys.email ?? '').trim().toLowerCase();
  const code = String(keys.code ?? '').trim().toUpperCase();
  const name = rosterNameKey(String(keys.name ?? ''));
  if (email) index.set(`e:${email}`, value);
  if (code) index.set(`c:${code}`, value);
  if (name) index.set(`n:${name}`, value);
}

function lookupPasscode(
  index: Map<string, string>,
  keys: { email?: string; code?: string; name?: string },
): string {
  const email = String(keys.email ?? '').trim().toLowerCase();
  const code = String(keys.code ?? '').trim().toUpperCase();
  const name = rosterNameKey(String(keys.name ?? ''));
  return (
    (email ? index.get(`e:${email}`) : '') ||
    (code ? index.get(`c:${code}`) : '') ||
    (name ? index.get(`n:${name}`) : '') ||
    ''
  );
}

async function loadDirectoryEnrichment(supabase: SupabaseClient): Promise<{
  passcodes: Map<string, string>;
  profiles: Map<string, Omit<DirectoryProfile, 'passcode'>>;
}> {
  const passcodes = new Map<string, string>();
  const profiles = new Map<string, Omit<DirectoryProfile, 'passcode'>>();
  const tables = [
    'hospital_user_credentials',
    'hospital_staff',
    'hospital_staff_credentials',
    'hospital_doctors',
    'doctor_profiles',
    'hospital_members',
  ] as const;

  const results = await Promise.all(
    tables.map(async (table) => {
      const { data, error } = await supabase.from(table).select('*');
      if (error || !Array.isArray(data)) return [];
      return data.map(asRecord);
    }),
  );

  const rememberProfile = (
    keys: { email?: string; code?: string; name?: string },
    details: Omit<DirectoryProfile, 'passcode'>,
  ) => {
    const slots = [
      keys.email ? `e:${keys.email.trim().toLowerCase()}` : '',
      keys.code ? `c:${keys.code.trim().toUpperCase()}` : '',
      keys.name ? `n:${rosterNameKey(keys.name)}` : '',
    ].filter(Boolean);
    for (const slot of slots) {
      const current = profiles.get(slot) ?? {
        specialization: '',
        experience: '',
        timings: '',
        qualification: '',
      };
      profiles.set(slot, {
        specialization: current.specialization || details.specialization,
        experience: current.experience || details.experience,
        timings: current.timings || details.timings,
        qualification: current.qualification || details.qualification,
      });
    }
  };

  for (const rows of results) {
    for (const row of rows) {
      const fullName = `${String(row.first_name ?? '')} ${String(row.last_name ?? '')}`.trim();
      const keys = {
        email: String(row.email ?? ''),
        code: String(
          row.employee_id ??
            row.staff_id_code ??
            row.doctor_code ??
            row.doctor_id ??
            row.badge_id ??
            '',
        ),
        name: String(row.full_name ?? row.doctor_name ?? row.name ?? fullName),
      };
      rememberPasscode(passcodes, keys, readStoredPasscode(row));
      rememberProfile(keys, readProfileDetails(row));
    }
  }

  return { passcodes, profiles };
}

function lookupProfile(
  profiles: Map<string, Omit<DirectoryProfile, 'passcode'>>,
  keys: { email?: string; code?: string; name?: string },
): Omit<DirectoryProfile, 'passcode'> {
  const email = String(keys.email ?? '').trim().toLowerCase();
  const code = String(keys.code ?? '').trim().toUpperCase();
  const name = rosterNameKey(String(keys.name ?? ''));
  const found =
    (email ? profiles.get(`e:${email}`) : undefined) ||
    (code ? profiles.get(`c:${code}`) : undefined) ||
    (name ? profiles.get(`n:${name}`) : undefined);
  return (
    found ?? {
      specialization: '',
      experience: '',
      timings: '',
      qualification: '',
    }
  );
}

function rosterNameKey(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/^dr\.?\s+/, '')
    .replace(/\s+/g, ' ');
}

/** Registered clinicians live under the legacy roster UUID or with a blank hospital id. */
function rosterRowBelongsToNode(row: Record<string, unknown>, hospitalId: string): boolean {
  const stored = String(row.hospital_id ?? '').trim();
  if (!stored) return true;
  if (
    stored === LEGACY_ROSTER_HOSPITAL_ID ||
    stored === LEGACY_SEED_HOSPITAL_ID ||
    stored === LEGACY_ACTIVE_HOSPITAL_ID
  ) {
    return true;
  }
  return recordBelongsToHospitalNode(row, hospitalId);
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

  const remember = (email: string, code: string, name: string) => {
    if (email) seen.add(`e:${email}`);
    if (code) seen.add(`c:${code}`);
    const nameKey = rosterNameKey(name);
    if (nameKey) seen.add(`n:${nameKey}`);
  };

  const alreadyListed = (email: string, code: string, name: string) => {
    const nameKey = rosterNameKey(name);
    return (
      (email && seen.has(`e:${email}`)) ||
      (code && seen.has(`c:${code}`)) ||
      (nameKey && seen.has(`n:${nameKey}`))
    );
  };

  for (const credential of credentials) {
    const emailKey = credential.email.trim().toLowerCase();
    const codeKey = String(credential.employee_id ?? '').trim().toUpperCase();
    if (!emailKey || alreadyListed(emailKey, codeKey, credential.full_name)) continue;
    remember(emailKey, codeKey, credential.full_name);

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
      passcode_key: staff?.passcode_key || readStoredPasscode(asRecord(credential)) || '',
      role,
      department: credential.department || staff?.department || '',
      qualification: staff?.qualification || String(doctor?.qualification ?? ''),
      consultation_fee: consultationFee,
      is_active: credential.is_active,
      created_at: staff?.created_at,
    });
  }

  for (const staff of staffRows) {
    const emailKey = staff.email.trim().toLowerCase();
    const codeKey = staff.staff_id_code.trim().toUpperCase();
    if (!staff.full_name.trim()) continue;
    if (alreadyListed(emailKey, codeKey, staff.full_name)) continue;
    remember(emailKey, codeKey, staff.full_name);
    members.push({
      ...staff,
      raw_role: staff.raw_role || staff.role,
    });
  }

  for (const doctor of doctorRows) {
    const emailKey = String(doctor.email ?? '').trim().toLowerCase();
    const codeKey = String(doctor.doctor_code ?? doctor.doctor_id ?? doctor.id ?? '')
      .trim()
      .toUpperCase();
    const fullName = String(
      doctor.full_name ?? doctor.doctor_name ?? doctor.name ?? '',
    ).trim();
    if (!fullName) continue;
    if (alreadyListed(emailKey, codeKey, fullName)) continue;
    remember(emailKey, codeKey, fullName);
    const feeRaw = doctor.consultation_fee ?? doctor.fee;
    members.push({
      id: String(doctor.id ?? doctor.doctor_id ?? codeKey),
      hospital_id: hospitalId,
      staff_id_code: codeKey,
      full_name: fullName,
      email: emailKey,
      passcode_key: readStoredPasscode(doctor),
      role: 'doctor',
      raw_role: 'Doctor',
      department: String(doctor.department ?? doctor.specialization ?? doctor.specialty ?? ''),
      qualification: String(doctor.qualification ?? ''),
      consultation_fee: feeRaw == null || feeRaw === '' ? null : Number(feeRaw) || null,
      is_active: doctor.is_active !== false,
    });
  }

  const [memberResult, profileResult] = await Promise.all([
    supabase.from('hospital_members').select('*'),
    supabase.from('doctor_profiles').select('*'),
  ]);

  const memberRows = Array.isArray(memberResult.data) ? memberResult.data : [];
  for (const row of memberRows) {
    const record = asRecord(row);
    if (!rosterRowBelongsToNode(record, hospitalId)) continue;
    const fullName = `${String(record.first_name ?? '')} ${String(record.last_name ?? '')}`.trim();
    const emailKey = String(record.email ?? '').trim().toLowerCase();
    const codeKey = String(record.employee_id ?? '').trim().toUpperCase();
    if (!fullName || alreadyListed(emailKey, codeKey, fullName)) continue;
    remember(emailKey, codeKey, fullName);
    const feeRaw = record.consultation_fee;
    const status = String(record.status ?? 'Active').trim().toLowerCase();
    members.push({
      id: String(record.id ?? codeKey),
      hospital_id: String(record.hospital_id ?? hospitalId),
      staff_id_code: codeKey,
      full_name: fullName,
      email: emailKey,
      passcode_key: readStoredPasscode(record),
      role: mapCredentialRoleToStaffRole(String(record.role ?? 'Doctor')),
      raw_role: String(record.role ?? 'Doctor'),
      department: String(record.department ?? record.specialization ?? ''),
      qualification: String(record.qualification ?? ''),
      consultation_fee: feeRaw == null || feeRaw === '' ? null : Number(feeRaw) || null,
      is_active: status !== 'inactive' && status !== 'restricted' && status !== 'revoked',
    });
  }

  const profileRows = Array.isArray(profileResult.data) ? profileResult.data : [];
  for (const row of profileRows) {
    const record = asRecord(row);
    if (!rosterRowBelongsToNode(record, hospitalId)) continue;
    const fullName = String(record.full_name ?? record.name ?? '').trim();
    const emailKey = String(record.email ?? '').trim().toLowerCase();
    const codeKey = String(record.employee_id ?? record.doctor_code ?? '')
      .trim()
      .toUpperCase();
    if (!fullName || alreadyListed(emailKey, codeKey, fullName)) continue;
    remember(emailKey, codeKey, fullName);
    const feeRaw = record.consultation_fee ?? record.fee;
    members.push({
      id: String(record.id ?? codeKey),
      hospital_id: String(record.hospital_id ?? hospitalId),
      staff_id_code: codeKey,
      full_name: fullName,
      email: emailKey,
      passcode_key: readStoredPasscode(record),
      role: 'doctor',
      raw_role: 'Doctor',
      department: String(record.department ?? record.specialization ?? record.specialty ?? ''),
      qualification: String(record.qualification ?? ''),
      consultation_fee: feeRaw == null || feeRaw === '' ? null : Number(feeRaw) || null,
      is_active: record.is_available !== false && record.is_active !== false,
    });
  }

  const enrichment = await loadDirectoryEnrichment(supabase);
  return members
    .filter((row) => row.full_name.trim())
    .filter(
      (row) =>
        !isGlobalSuperAdminStaffRecord({
          email: row.email,
          role: row.raw_role || row.role,
        }) && !/platform root/i.test(row.full_name),
    )
    .map((row) => {
      const keys = { email: row.email, code: row.staff_id_code, name: row.full_name };
      const profile = lookupProfile(enrichment.profiles, keys);
      return {
        ...row,
        passcode_key: row.passcode_key.trim() || lookupPasscode(enrichment.passcodes, keys),
        specialization: row.specialization?.trim() || profile.specialization,
        experience: row.experience?.trim() || profile.experience,
        timings: row.timings?.trim() || profile.timings,
        qualification: row.qualification.trim() || profile.qualification,
      };
    });
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

/** Staff rows use hospitals.id, which is the tenant code HOSP-01 on this node. */
async function resolveStaffHospitalTenant(
  supabase: SupabaseClient,
  hospitalId: string,
): Promise<{ hospitalId: string; hospitalCode: string } | null> {
  const trimmed = hospitalId.trim();
  const uuid = await resolveHospitalUuid(supabase, trimmed || REGAL_HOSPITAL_CODE);
  if (uuid) {
    return { hospitalId: uuid, hospitalCode: resolveHospitalCodeForWrite(trimmed) };
  }

  const code = isHospitalCode(trimmed) ? trimmed.toUpperCase() : REGAL_HOSPITAL_CODE;
  const byCode = await supabase
    .from('hospitals')
    .select('id, hospital_code')
    .eq('hospital_code', code)
    .limit(1)
    .maybeSingle();
  const row = byCode.data?.id
    ? byCode.data
    : (
        await supabase.from('hospitals').select('id, hospital_code').eq('id', code).limit(1).maybeSingle()
      ).data;

  const tenantId = String((row as { id?: unknown } | null)?.id ?? '').trim();
  if (!tenantId) return null;
  const hospitalCode = String((row as { hospital_code?: unknown } | null)?.hospital_code ?? code)
    .trim()
    .toUpperCase();
  return { hospitalId: tenantId, hospitalCode: hospitalCode || code };
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
      : 0;
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

  const tenant = await resolveStaffHospitalTenant(supabase, hospitalId);
  if (!tenant) {
    return { ok: false, error: 'Could not resolve hospital tenant for this credential.' };
  }

  const { data, error } = await supabase
    .from('hospital_staff')
    .insert([staffPayload(tenant.hospitalId, tenant.hospitalCode, draft)])
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

  const tenant = await resolveStaffHospitalTenant(supabase, hospitalId);
  if (!tenant) {
    return { ok: false, error: 'Could not resolve hospital tenant for this credential.' };
  }

  const { data, error } = await supabase
    .from('hospital_staff')
    .update(staffPayload(tenant.hospitalId, tenant.hospitalCode, draft))
    .eq('id', id)
    .eq('hospital_id', tenant.hospitalId)
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

function experienceYears(value: string): number | null {
  const match = value.match(/\d+/);
  if (!match) return null;
  const years = Number(match[0]);
  return Number.isFinite(years) ? years : null;
}

async function updateByEmail(
  supabase: SupabaseClient,
  table: string,
  email: string,
  payload: Record<string, unknown>,
): Promise<void> {
  const address = email.trim().toLowerCase();
  if (!address) return;
  let next = { ...payload };
  for (let attempt = 0; attempt < 6; attempt += 1) {
    if (Object.keys(next).length === 0) return;
    const { error } = await supabase.from(table).update(next).ilike('email', address);
    if (!error) return;
    const missing = String(error.message).match(/'([^']+)' column|column "([^"]+)"/i);
    const column = missing?.[1] || missing?.[2];
    if (!column || !(column in next)) return;
    const { [column]: _removed, ...rest } = next;
    next = rest;
  }
}

/** Save directory edits onto staff, member, profile, and login credential rows. */
export async function saveDirectoryProfile(
  supabase: SupabaseClient,
  hospitalId: string,
  member: HospitalStaffMember | null,
  draft: StaffDirectoryDraft,
): Promise<{ ok: boolean; error?: string }> {
  if (!draft.full_name.trim()) return { ok: false, error: 'Full name is required' };

  const email = (member?.email || draft.email).trim().toLowerCase();
  const years = experienceYears(draft.experience ?? '');
  const staffId = member?.staff_record_id || '';
  if (staffId) {
    const updated = await updateHospitalStaffMember(supabase, hospitalId, staffId, draft);
    if (!updated.ok && !/0 rows|not find|no rows/i.test(updated.error || '')) {
      console.warn('[saveDirectoryProfile] hospital_staff update:', updated.error);
    }
  }

  await updateByEmail(supabase, 'hospital_members', email, {
    specialization: draft.specialization?.trim() || null,
    qualification: draft.qualification.trim() || null,
    ...(years != null ? { experience_years: years } : {}),
  });
  await updateByEmail(supabase, 'doctor_profiles', email, {
    full_name: draft.full_name.trim(),
    department: draft.department.trim() || null,
    specialization: draft.specialization?.trim() || null,
    specialty: draft.specialization?.trim() || null,
    qualification: draft.qualification.trim() || null,
    experience: draft.experience?.trim() || null,
    timings: draft.timings?.trim() || null,
  });
  await updateByEmail(supabase, 'hospital_doctors', email, {
    doctor_name: draft.full_name.trim(),
    department: draft.department.trim() || null,
    specialization: draft.specialization?.trim() || null,
    qualification: draft.qualification.trim() || null,
    experience: draft.experience?.trim() || null,
    passcode: draft.passcode_key.trim() || null,
  });
  await updateByEmail(supabase, 'hospital_user_credentials', email, {
    full_name: draft.full_name.trim(),
    department: draft.department.trim() || null,
    passcode: draft.passcode_key.trim() || null,
    passcode_key: draft.passcode_key.trim() || null,
    temporary_passcode: draft.passcode_key.trim() || null,
  });
  await updateByEmail(supabase, 'hospital_staff_credentials', email, {
    full_name: draft.full_name.trim(),
    department: draft.department.trim() || null,
    temporary_passcode: draft.passcode_key.trim() || null,
    passcode: draft.passcode_key.trim() || null,
  });

  return { ok: true };
}

export function memberLooksLikeDoctor(
  member: Pick<HospitalStaffMember, 'role' | 'department' | 'staff_id_code' | 'raw_role'>,
): boolean {
  const role = String(member.raw_role ?? member.role ?? '')
    .trim()
    .toLowerCase();
  const department = String(member.department ?? '').trim().toLowerCase();
  const staffCode = String(member.staff_id_code ?? '').trim().toUpperCase();

  return (
    member.role === 'doctor' ||
    role.includes('doctor') ||
    role.includes('clinician') ||
    department.includes('medicine') ||
    staffCode.startsWith('RH-D')
  );
}

/** Permanently delete a hospital staff credential and all linked operational rows. */
export async function deleteHospitalStaffCredential(
  supabase: SupabaseClient,
  hospitalId: string,
  member: Pick<
    HospitalStaffMember,
    | 'id'
    | 'staff_record_id'
    | 'staff_id_code'
    | 'email'
    | 'full_name'
    | 'role'
    | 'department'
    | 'raw_role'
    | 'credential_id'
  >,
): Promise<{ ok: boolean; error?: string }> {
  return permanentlyDeleteStaffCredential(supabase, hospitalId, member);
}

export async function deleteHospitalStaffMember(
  supabase: SupabaseClient,
  hospitalId: string,
  id: string,
  member?: Pick<
    HospitalStaffMember,
    'role' | 'email' | 'staff_id_code' | 'department' | 'raw_role' | 'staff_record_id' | 'full_name' | 'credential_id'
  >,
): Promise<{ ok: boolean; error?: string }> {
  return deleteHospitalStaffCredential(supabase, hospitalId, {
    id,
    staff_record_id: member?.staff_record_id ?? id,
    staff_id_code: member?.staff_id_code ?? '',
    email: member?.email ?? '',
    full_name: member?.full_name ?? '',
    role: member?.role ?? 'staff',
    department: member?.department ?? '',
    raw_role: member?.raw_role,
    credential_id: member?.credential_id,
  });
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
