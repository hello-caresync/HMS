import type { SupabaseClient } from '@supabase/supabase-js';

import { extractErrorMessage } from '@/lib/auth/parseAuthError';
import { fetchSuperAdminHospitalTenants } from '@/lib/super-admin/hospital-tenants';

export type RegisteredHospitalOption = {
  id: string;
  name: string;
  code: string | null;
  city: string | null;
  status: string | null;
};

/** Load the same active hospitals Super Admin creates and lists. */
export async function fetchRegisteredHospitals(
  supabase: SupabaseClient,
): Promise<{ hospitals: RegisteredHospitalOption[]; error: string | null }> {
  try {
    const tenants = await fetchSuperAdminHospitalTenants(supabase);

    const hospitals = tenants.map((tenant) => ({
      id: tenant.id,
      name: tenant.name,
      code: tenant.hospital_code,
      city: tenant.city,
      status: tenant.status,
    }));

    return { hospitals, error: hospitals.length === 0 ? 'No registered hospitals found.' : null };
  } catch (err: unknown) {
    return {
      hospitals: [],
      error: extractErrorMessage(err),
    };
  }
}

/** Match profile hospital reference against a registered facility (UUID or tenant code). */
export function profileBelongsToHospital(
  profileHospitalId: string | null | undefined,
  hospital: RegisteredHospitalOption,
): boolean {
  const stored = String(profileHospitalId ?? '')
    .trim()
    .toLowerCase();
  if (!stored) return false;

  const candidates = [hospital.id, hospital.code]
    .map((value) => String(value ?? '').trim().toLowerCase())
    .filter(Boolean);

  return candidates.some((candidate) => candidate === stored);
}

export function formatRegisteredHospitalLabel(hospital: RegisteredHospitalOption): string {
  const code = hospital.code ? ` (${hospital.code})` : '';
  const city = hospital.city ? ` — ${hospital.city}` : '';
  return `${hospital.name}${code}${city}`;
}
