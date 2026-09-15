import type { VendorSession } from './ecosystem-sessions';

import { verifyPassword } from '@/lib/auth/hospital/password-utils';
import { HOSPITAL_USER_CREDENTIALS_TABLE } from '@/lib/auth/hospitalAuth';
import {
  isVendorCredentialRole,
  readStoredCredentialPasscode,
} from '@/lib/hospital/procurement';
import { supabase } from '@/lib/supabase/client';

export type VendorAuthResult =
  | { ok: true; vendor: VendorSession }
  | { ok: false; error: string };

export const VENDOR_INVALID_CREDENTIALS_MESSAGE =
  'Invalid vendor email or security passcode. Please verify your credentials.';

export const VENDOR_AUTH_SERVICE_ERROR_MESSAGE =
  'Unable to connect to the authentication service. Please try again.';

/** @deprecated Use VENDOR_AUTH_SERVICE_ERROR_MESSAGE */
export const VENDOR_UNEXPECTED_ERROR_MESSAGE = VENDOR_AUTH_SERVICE_ERROR_MESSAGE;

const PASSCODE_KEYS = [
  'passcode',
  'pin',
  'portal_pin',
  'access_pin',
  'temporary_passcode',
  'passcode_key',
  'password',
] as const;

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

function isVendorActive(row: Record<string, unknown>): boolean {
  if (row.is_active === false) return false;
  const status = String(row.status ?? 'active').toLowerCase();
  return !['suspended', 'inactive', 'disabled', 'revoked'].includes(status);
}

async function verifyVendorPasscode(
  row: Record<string, unknown>,
  cleanPasscode: string,
): Promise<boolean> {
  const stored = readStoredCredentialPasscode(row);
  if (stored && stored === cleanPasscode) return true;

  for (const key of PASSCODE_KEYS) {
    const value = row[key];
    if (typeof value === 'string' && value.length > 0 && value === cleanPasscode) {
      return true;
    }
  }

  const hash = String(row.passcode_hash ?? row.password_hash ?? '');
  if (hash) {
    return verifyPassword(cleanPasscode, hash);
  }

  return false;
}

async function findVendorCredentialForLogin(
  cleanEmail: string,
  cleanPasscode: string,
): Promise<{ row: Record<string, unknown> | null; error: string | null }> {
  if (!supabase) {
    return { row: null, error: VENDOR_AUTH_SERVICE_ERROR_MESSAGE };
  }

  const direct = await supabase
    .from(HOSPITAL_USER_CREDENTIALS_TABLE)
    .select('*')
    .ilike('email', cleanEmail)
    .eq('passcode', cleanPasscode)
    .eq('role', 'vendor')
    .maybeSingle();

  if (direct.error) {
    if (/PGRST116|multiple/i.test(direct.error.message)) {
      const listed = await supabase
        .from(HOSPITAL_USER_CREDENTIALS_TABLE)
        .select('*')
        .ilike('email', cleanEmail)
        .eq('passcode', cleanPasscode)
        .eq('role', 'vendor')
        .limit(1);
      if (listed.error) {
        console.error('Vendor login lookup error:', listed.error);
        return { row: null, error: VENDOR_AUTH_SERVICE_ERROR_MESSAGE };
      }
      const row = listed.data?.[0] ? asRecord(listed.data[0]) : null;
      return { row, error: null };
    }
    console.error('Vendor login lookup error:', direct.error);
    return { row: null, error: VENDOR_AUTH_SERVICE_ERROR_MESSAGE };
  }

  if (direct.data) {
    return { row: asRecord(direct.data), error: null };
  }

  const byEmail = await supabase
    .from(HOSPITAL_USER_CREDENTIALS_TABLE)
    .select('*')
    .ilike('email', cleanEmail)
    .limit(10);

  if (byEmail.error) {
    console.error('Vendor login fallback lookup error:', byEmail.error);
    return { row: null, error: VENDOR_AUTH_SERVICE_ERROR_MESSAGE };
  }

  const vendorRows = ((byEmail.data ?? []) as unknown[])
    .map((entry) => asRecord(entry))
    .filter((row) => isVendorCredentialRole(String(row.role)));

  for (const row of vendorRows) {
    if (await verifyVendorPasscode(row, cleanPasscode)) {
      return { row, error: null };
    }
  }

  return { row: null, error: null };
}

async function findVendorProfileByEmail(
  cleanEmail: string,
): Promise<Record<string, unknown> | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('vendors')
    .select('id, company_name, gstin, email, phone, contact_person, hospital_id')
    .ilike('email', cleanEmail)
    .maybeSingle();

  if (error) {
    if (/PGRST116|multiple/i.test(error.message)) {
      const { data: rows } = await supabase
        .from('vendors')
        .select('id, company_name, gstin, email, phone, contact_person, hospital_id')
        .ilike('email', cleanEmail)
        .limit(1);
      return rows?.[0] ? asRecord(rows[0]) : null;
    }
    return null;
  }

  return data ? asRecord(data) : null;
}

function buildVendorSession(
  credential: Record<string, unknown>,
  profile: Record<string, unknown> | null,
  cleanEmail: string,
): VendorSession {
  const companyName = String(
    profile?.company_name ?? credential.full_name ?? credential.company_name ?? 'Vendor Partner',
  ).trim();

  return {
    id: String(profile?.id ?? credential.id ?? ''),
    company_name: companyName,
    vendor_name: companyName,
    rep_email: cleanEmail,
    email: cleanEmail,
    category: profile?.gstin ? `GSTIN ${String(profile.gstin)}` : 'General Supplies',
    hospital_id: String(profile?.hospital_id ?? credential.hospital_id ?? 'HOSP-01'),
    token: `vnd_${Date.now()}`,
  };
}

export async function authenticateVendorCredential(
  email: string,
  passcode: string,
): Promise<VendorAuthResult> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanPasscode = passcode.trim();

  if (!cleanEmail || !cleanPasscode) {
    return { ok: false, error: 'Enter vendor email and security passcode.' };
  }

  const { row, error: lookupError } = await findVendorCredentialForLogin(cleanEmail, cleanPasscode);

  if (lookupError) {
    return { ok: false, error: lookupError };
  }

  if (!row || !isVendorCredentialRole(String(row.role))) {
    return { ok: false, error: VENDOR_INVALID_CREDENTIALS_MESSAGE };
  }

  if (!isVendorActive(row)) {
    return {
      ok: false,
      error: 'This vendor account has been suspended or deactivated.',
    };
  }

  const passcodeMatches = await verifyVendorPasscode(row, cleanPasscode);
  if (!passcodeMatches) {
    return { ok: false, error: VENDOR_INVALID_CREDENTIALS_MESSAGE };
  }

  const profile = await findVendorProfileByEmail(cleanEmail);

  return {
    ok: true,
    vendor: buildVendorSession(row, profile, cleanEmail),
  };
}
