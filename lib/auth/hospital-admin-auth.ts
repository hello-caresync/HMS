import { createClient } from '@supabase/supabase-js';

import { isHospitalCredentialAdmin, normalizeHospitalRole } from '@/lib/auth/hospital-rbac';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export type HospitalAdminRecord = {
  id: string;
  hospital_id: string;
  hospital_name: string;
  full_name: string;
  email: string;
  department: string;
  temporary_passcode: string;
  portal_access: string;
  phone?: string;
  role: string;
  raw: Record<string, unknown>;
};

export type HospitalAdminAuthResult =
  | { ok: true; admin: HospitalAdminRecord }
  | { ok: false; error: string };

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

function readStoredPasscode(row: Record<string, unknown>): string {
  for (const key of ['passcode_key', 'passcode', 'temporary_passcode', 'password']) {
    const value = row[key];
    if (typeof value === 'string' && value.length > 0) return value;
  }
  return '';
}

function normalizeRole(role: unknown): string {
  return normalizeHospitalRole(String(role ?? '')).toLowerCase();
}

export function isHospitalAdminRole(role: unknown): boolean {
  return isHospitalCredentialAdmin(String(role ?? ''));
}

function hospitalNodesCompatible(staffHospitalId: string, selectedHospitalId?: string): boolean {
  if (!selectedHospitalId) return true;
  const staffNode = staffHospitalId.trim() || 'HOSP-01';
  const selectedNode = selectedHospitalId.trim();
  if (!selectedNode || selectedNode === 'HOSP-01' || staffNode === 'HOSP-01') return true;
  return staffNode === selectedNode;
}

export async function authenticateHospitalAdmin(
  email: string,
  passcode: string,
  hospitalId?: string,
): Promise<HospitalAdminAuthResult> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanPasscode = passcode.trim();

  if (!cleanEmail || !cleanPasscode) {
    return {
      ok: false,
      error: 'Invalid administrator credentials or unauthorized hospital node.',
    };
  }

  if (!supabase) {
    return { ok: false, error: 'Authentication service unavailable.' };
  }

  const { data, error } = await supabase
    .from('hospital_staff')
    .select('*')
    .ilike('email', cleanEmail)
    .eq('is_active', true)
    .maybeSingle();

  if (error || !data) {
    return {
      ok: false,
      error: 'Invalid administrator credentials or unauthorized hospital node.',
    };
  }

  const staff = asRecord(data);
  const storedPasscode = readStoredPasscode(staff);
  const isPasscodeValid =
    storedPasscode === cleanPasscode ||
    String(staff.passcode_key ?? '') === cleanPasscode ||
    String(staff.passcode ?? '') === cleanPasscode;

  if (!isPasscodeValid) {
    return { ok: false, error: 'Invalid administrator credentials or passcode.' };
  }

  if (!isHospitalAdminRole(staff.role) && !isHospitalAdminRole(staff.staff_type)) {
    return { ok: false, error: 'Access denied: Administrator role required.' };
  }

  const resolvedHospitalId = String(staff.hospital_id ?? hospitalId ?? 'HOSP-01').trim() || 'HOSP-01';
  if (!hospitalNodesCompatible(resolvedHospitalId, hospitalId)) {
    return {
      ok: false,
      error: 'Invalid administrator credentials or unauthorized hospital node.',
    };
  }

  return {
    ok: true,
    admin: {
      id: String(staff.id ?? ''),
      hospital_id: resolvedHospitalId,
      hospital_name: String(staff.hospital_name ?? 'Regal Hospital Main'),
      full_name: String(staff.full_name ?? staff.name ?? 'Hospital Administrator'),
      email: String(staff.email ?? cleanEmail).toLowerCase(),
      department: String(staff.department ?? 'Hospital Administration'),
      temporary_passcode: storedPasscode,
      portal_access: '/dashboard',
      phone: typeof staff.phone === 'string' ? staff.phone : undefined,
      role: normalizeRole(staff.role ?? staff.staff_type) || 'admin',
      raw: staff,
    },
  };
}
