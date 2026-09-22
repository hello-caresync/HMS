import { createClient } from '@supabase/supabase-js';

import { PROVISIONING_ACCESS_DENIED_MESSAGE } from '@/lib/auth/provisioning-gate';
import { verifySuperAdminCredentials } from '@/lib/auth/superAdminAuth';
import { buildSuperAdminUser } from './super-admin-auth';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

/** Primary table name in spec; falls back to legacy hospital_staff_credentials. */
const STAFF_TABLES = ['hospital_staff', 'staff_members', 'hospital_staff_credentials'] as const;

export type StaffCredentialRecord = {
  id: string;
  hospital_id: string;
  hospital_name: string;
  full_name: string;
  staff_type: string;
  department: string;
  email: string;
  temporary_passcode: string;
  phone?: string;
  portal_access: string;
  status?: string;
};

export type PortalAuthScope = 'super_admin' | 'hospital_admin' | 'operational_staff';

export type PortalAuthResult =
  | { ok: true; user: StaffCredentialRecord }
  | { ok: false; error: string };

function normalizeRecord(row: Record<string, unknown>): StaffCredentialRecord {
  return {
    id: String(row.id ?? ''),
    hospital_id: String(row.hospital_id ?? ''),
    hospital_name: String(row.hospital_name ?? 'Regal Hospital Main'),
    full_name: String(row.full_name ?? ''),
    staff_type: String(row.staff_type ?? row.role ?? ''),
    department: String(row.department ?? ''),
    email: String(row.email ?? '').toLowerCase(),
    temporary_passcode: String(row.temporary_passcode ?? row.passcode ?? ''),
    phone: row.phone ? String(row.phone) : undefined,
    portal_access: String(row.portal_access ?? '/dashboard'),
    status: row.status ? String(row.status) : undefined,
  };
}

export function isSuperAdminCredential(user: StaffCredentialRecord): boolean {
  const staffType = user.staff_type.toLowerCase().replace(/[\s_-]/g, '');
  const portal = user.portal_access.toLowerCase();
  const hospitalId = user.hospital_id.toUpperCase();
  return (
    staffType === 'superadmin' ||
    portal.startsWith('/super-admin') ||
    hospitalId.startsWith('PLATFORM')
  );
}

function matchesScope(user: StaffCredentialRecord, scope: PortalAuthScope): boolean {
  if (scope === 'super_admin') return isSuperAdminCredential(user);
  if (scope === 'hospital_admin') {
    return user.staff_type === 'Admin' && !isSuperAdminCredential(user);
  }
  return ['Nurse', 'Receptionist', 'Pharmacist', 'Doctor', 'Staff'].includes(user.staff_type);
}

function hospitalNodeIdsMatch(left?: string, right?: string): boolean {
  if (!left || !right) return false;
  const aliases: Record<string, string> = {
    'RH-BLR-01': 'HOSP-01',
    'HOSP-01': 'HOSP-01',
  };
  const normalize = (value: string) => aliases[value.trim()] ?? value.trim();
  return normalize(left) === normalize(right);
}

function isInactiveStaffStatus(status?: string): boolean {
  return ['Restricted', 'Suspended', 'Inactive'].includes(String(status ?? ''));
}

async function lookupStaffByEmail(email: string): Promise<StaffCredentialRecord | null> {
  if (!supabase) return null;

  const cleanEmail = email.trim().toLowerCase();

  for (const table of STAFF_TABLES) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .eq('email', cleanEmail)
      .maybeSingle();

    if (!error && data) {
      return normalizeRecord(data as Record<string, unknown>);
    }
  }

  return null;
}

async function authenticateSuperAdminLogin(
  cleanEmail: string,
  cleanPasscode: string,
): Promise<PortalAuthResult> {
  const verified = await verifySuperAdminCredentials(cleanEmail, cleanPasscode);
  if (verified) {
    return { ok: true, user: buildSuperAdminUser(cleanEmail, cleanPasscode) };
  }

  return { ok: false, error: PROVISIONING_ACCESS_DENIED_MESSAGE };
}

export async function authenticatePortalCredential(params: {
  email: string;
  passcode: string;
  hospitalId?: string;
  scope: PortalAuthScope;
}): Promise<PortalAuthResult> {
  const cleanEmail = params.email.trim().toLowerCase();
  const cleanPasscode = params.passcode.trim();

  if (!cleanEmail || !cleanPasscode) {
    return { ok: false, error: 'Please enter both your official email and security passcode.' };
  }

  if (params.scope === 'super_admin') {
    return authenticateSuperAdminLogin(cleanEmail, cleanPasscode);
  }

  if (!supabase) {
    return { ok: false, error: 'Database client unavailable. Please check configuration.' };
  }

  const user = await lookupStaffByEmail(cleanEmail);
  if (!user) {
    return { ok: false, error: PROVISIONING_ACCESS_DENIED_MESSAGE };
  }

  if (!matchesScope(user, params.scope)) {
    if (params.scope === 'hospital_admin') {
      return { ok: false, error: 'This account is not a Hospital Admin credential. Use the Staff portal.' };
    }
    if (user.staff_type === 'Admin') {
      return {
        ok: false,
        error: 'Hospital Admin accounts must sign in through the Hospital Admin portal.',
      };
    }
    return { ok: false, error: 'This credential is not authorized for the Staff & Doctor portal.' };
  }

  if (params.hospitalId && !hospitalNodeIdsMatch(user.hospital_id, params.hospitalId)) {
    return { ok: false, error: 'This account is not registered under the selected hospital tenant.' };
  }

  if (isInactiveStaffStatus(user.status)) {
    return { ok: false, error: 'Your account is inactive. Contact platform administration.' };
  }

  if (user.temporary_passcode !== cleanPasscode) {
    return { ok: false, error: PROVISIONING_ACCESS_DENIED_MESSAGE };
  }

  return { ok: true, user };
}

function isLegacyTestHospitalId(id: string): boolean {
  const normalized = id.trim().toLowerCase();
  return (
    normalized.includes('11111111') ||
    normalized.includes('a0000000') ||
    normalized === '11111111-1111-1111-1111-111111111111' ||
    normalized === 'a0000000-0000-0000-0000-000000000001'
  );
}

function filterLoginHospitalOptions(
  options: { id: string; name: string; location: string }[],
): { id: string; name: string; location: string }[] {
  return options.filter((option) => !isLegacyTestHospitalId(option.id));
}

export async function loadHospitalOptionsForLogin(): Promise<
  { id: string; name: string; location: string }[]
> {
  if (!supabase) return [];

  const { data: hospitals } = await supabase
    .from('hospitals')
    .select('id, name, city, hospital_code')
    .order('name', { ascending: true });

  if (hospitals?.length) {
    const mapped = hospitals.map((row) => ({
      id: String(row.hospital_code ?? row.id),
      name: String(row.name),
      location: String(row.city ?? 'Bengaluru'),
    }));
    const filtered = filterLoginHospitalOptions(mapped);
    if (filtered.length > 0) return filtered;
  }

  const { data: tenants } = await supabase
    .from('hospital_tenants')
    .select('hospital_id, hospital_name, city')
    .order('hospital_name', { ascending: true });

  if (tenants?.length) {
    const mapped = tenants.map((row) => ({
      id: String(row.hospital_id),
      name: String(row.hospital_name),
      location: String(row.city ?? 'Bengaluru'),
    }));
    const filtered = filterLoginHospitalOptions(mapped);
    if (filtered.length > 0) return filtered;
  }

  for (const table of STAFF_TABLES) {
    const { data: credentials } = await supabase
      .from(table)
      .select('hospital_id, hospital_name')
      .order('hospital_name', { ascending: true });

    if (credentials?.length) {
      const seen = new Set<string>();
      const options = credentials
        .filter((row) => {
          const id = String(row.hospital_id);
          if (seen.has(id)) return false;
          seen.add(id);
          return true;
        })
        .map((row) => ({
          id: String(row.hospital_id),
          name: String(row.hospital_name),
          location: 'Bengaluru',
        }));

      const filtered = filterLoginHospitalOptions(options);
      if (filtered.length > 0) return filtered;
    }
  }

  return [];
}
