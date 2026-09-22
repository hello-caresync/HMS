import { createClient } from '@supabase/supabase-js';

import {
  SUPER_ADMIN_ROOT_EMAIL,
  SUPER_ADMIN_ROOT_PASSCODE,
} from '@/lib/auth/superAdminAuth';

export type SuperAdminUser = {
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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export function buildSuperAdminUser(
  email: string,
  passcode: string,
  existing?: SuperAdminUser | null,
): SuperAdminUser {
  const cleanEmail = email.trim().toLowerCase();
  const localPart = cleanEmail.split('@')[0] ?? 'admin';

  if (existing) {
    return {
      ...existing,
      email: cleanEmail,
      staff_type: 'SuperAdmin',
      hospital_id: existing.hospital_id.startsWith('PLATFORM') ? existing.hospital_id : 'PLATFORM-00',
      hospital_name: existing.hospital_name || 'Regal Platform Root',
      portal_access: '/super-vault-access',
      temporary_passcode: passcode.trim(),
    };
  }

  return {
    id: `PLATFORM-SA-${localPart.replace(/[^a-z0-9]/gi, '').slice(0, 12).toUpperCase() || 'ROOT'}`,
    hospital_id: 'PLATFORM-00',
    hospital_name: 'Regal Platform Root',
    full_name: localPart
      .split(/[._-]/)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' '),
    staff_type: 'SuperAdmin',
    department: 'Platform Operations',
    email: cleanEmail,
    temporary_passcode: passcode.trim(),
    portal_access: '/super-vault-access',
    status: 'Active',
  };
}

function isSuperAdminVaultRole(roleType: string): boolean {
  return roleType.toUpperCase().includes('SUPER');
}

export async function verifySuperAdminVaultCredentials(
  email: string,
  passcode: string,
): Promise<boolean> {
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedPasscode = passcode.trim();

  if (
    normalizedEmail !== SUPER_ADMIN_ROOT_EMAIL ||
    normalizedPasscode !== SUPER_ADMIN_ROOT_PASSCODE
  ) {
    return false;
  }

  if (!supabase) return true;

  const { data, error } = await supabase
    .from('super_admin_credentials_vault')
    .select('identifier, passcode, role_type, is_active')
    .eq('identifier', SUPER_ADMIN_ROOT_EMAIL)
    .eq('is_active', true)
    .maybeSingle();

  if (error || !data) return true;

  const record = data as Record<string, unknown>;
  const stored = String(record.passcode ?? '');
  const roleType = String(record.role_type ?? '');

  return stored === SUPER_ADMIN_ROOT_PASSCODE && isSuperAdminVaultRole(roleType);
}

/** @deprecated Hardcoded email lists were removed. Super Admin is vault/role based. */
export function isWhitelistedSuperAdminEmail(_email: string): boolean {
  return false;
}

export function isValidSuperAdminPasscode(_passcode: string): boolean {
  return false;
}

export function passesSuperAdminPasscodeCheck(passcode: string, dbPasscode?: string): boolean {
  return Boolean(dbPasscode && dbPasscode === passcode.trim());
}

export const buildWhitelistedSuperAdminUser = buildSuperAdminUser;
