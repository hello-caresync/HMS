import type { SupabaseClient } from '@supabase/supabase-js';

import { getStoredActiveHospitalId } from '@/lib/hospital/hospital-members.service';
import {
  LEGACY_ROSTER_HOSPITAL_ID,
  LEGACY_SEED_HOSPITAL_ID,
  REGAL_HOSPITAL_CODE,
} from '@/lib/regal/constants';
import { SELECTED_HOSPITAL_ID_KEY } from '@/lib/patient/hospital-context';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const LEGACY_HOSPITAL_IDS = new Set([
  LEGACY_SEED_HOSPITAL_ID,
  LEGACY_ROSTER_HOSPITAL_ID,
]);

let cachedCanonicalUuid: string | null = null;

export function isHospitalUuid(value: unknown): value is string {
  return typeof value === 'string' && UUID_PATTERN.test(value.trim());
}

export function isHospitalCode(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  return /^HOSP-\d+$/i.test(trimmed) || trimmed === REGAL_HOSPITAL_CODE;
}

export function isLegacyHospitalId(value: unknown): boolean {
  return typeof value === 'string' && LEGACY_HOSPITAL_IDS.has(value.trim());
}

/** Read client-side persisted hospital UUID (never a tenant code). */
/** @alias readStoredHospitalUuid */
export function readActiveHospitalUuid(): string | null {
  return readStoredHospitalUuid();
}

export function readStoredHospitalUuid(): string | null {
  if (typeof window === 'undefined') return null;

  const keys = [
    getStoredActiveHospitalId(),
    localStorage.getItem(SELECTED_HOSPITAL_ID_KEY),
    localStorage.getItem('nexora_active_hospital_id'),
    localStorage.getItem('active_hospital_id'),
  ];

  for (const raw of keys) {
    if (raw && isHospitalUuid(raw)) return raw.trim();
  }
  return null;
}

/**
 * Resolve the active hospital UUID for DB writes/filters.
 * Prefers an explicit UUID, then stored session UUID, then lookup by REGAL_HOSPITAL_CODE.
 */
export async function resolveHospitalUuid(
  supabase: SupabaseClient,
  preferredId?: string | null,
): Promise<string | null> {
  const candidates = [preferredId, readStoredHospitalUuid()].filter(Boolean) as string[];

  for (const raw of candidates) {
    const trimmed = raw.trim();
    if (isHospitalUuid(trimmed) && !isLegacyHospitalId(trimmed)) {
      return trimmed;
    }
    if (isHospitalCode(trimmed)) {
      const byCode = await lookupHospitalUuidByCode(supabase, trimmed);
      if (byCode) return byCode;
    }
  }

  if (cachedCanonicalUuid && isHospitalUuid(cachedCanonicalUuid)) {
    return cachedCanonicalUuid;
  }

  const fallback = await lookupHospitalUuidByCode(supabase, REGAL_HOSPITAL_CODE);
  if (fallback) cachedCanonicalUuid = fallback;
  return fallback;
}

export async function requireHospitalUuid(
  supabase: SupabaseClient,
  preferredId?: string | null,
): Promise<string> {
  const resolved = await resolveHospitalUuid(supabase, preferredId);
  if (!resolved) {
    throw new Error(
      `Could not resolve hospital UUID for code ${REGAL_HOSPITAL_CODE}. Complete hospital onboarding first.`,
    );
  }
  return resolved;
}

async function lookupHospitalUuidByCode(
  supabase: SupabaseClient,
  hospitalCode: string,
): Promise<string | null> {
  const code = hospitalCode.trim();
  if (!code) return null;

  const byCode = await supabase
    .from('hospitals')
    .select('id')
    .eq('hospital_code', code)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!byCode.error && byCode.data?.id) {
    const id = String(byCode.data.id);
    if (isHospitalUuid(id)) return id;
  }

  const byId = await supabase
    .from('hospitals')
    .select('id')
    .eq('id', code)
    .limit(1)
    .maybeSingle();

  if (!byId.error && byId.data?.id) {
    const id = String(byId.data.id);
    if (isHospitalUuid(id)) return id;
  }

  if (byCode.error) {
    console.warn('[resolveHospitalUuid] hospitals lookup failed:', byCode.error.message);
  }

  return null;
}

/** Resolve doctor session hospital from staff membership (post-0008 always UUID). */
export async function resolveDoctorHospitalUuid(
  supabase: SupabaseClient,
  email: string,
): Promise<string | null> {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) return null;

  const staffLookup = await supabase
    .from('hospital_staff')
    .select('hospital_id')
    .ilike('email', normalizedEmail)
    .eq('is_active', true)
    .limit(1)
    .maybeSingle();

  const staffHospitalId = staffLookup.data?.hospital_id;
  if (staffHospitalId && isHospitalUuid(String(staffHospitalId))) {
    return String(staffHospitalId);
  }

  const memberLookup = await supabase
    .from('hospital_members')
    .select('hospital_id')
    .ilike('email', normalizedEmail)
    .eq('status', 'Active')
    .limit(1)
    .maybeSingle();

  const memberHospitalId = memberLookup.data?.hospital_id;
  if (memberHospitalId && isHospitalUuid(String(memberHospitalId))) {
    return String(memberHospitalId);
  }

  return resolveHospitalUuid(supabase);
}
