import type { SupabaseClient } from '@supabase/supabase-js';

import { extractErrorMessage } from '@/lib/auth/parseAuthError';
import { isBlockedSuperAdminTenantId } from '@/lib/super-admin/tenant-directory';

export type RegisteredHospitalOption = {
  id: string;
  name: string;
  code: string | null;
  city: string | null;
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

function isActiveHospitalRow(row: Record<string, unknown>): boolean {
  if (row.is_active === false) return false;

  const status = String(row.status ?? 'Active')
    .trim()
    .toLowerCase();

  return status !== 'inactive' && status !== 'disabled' && status !== 'archived';
}

function mapHospitalRow(row: Record<string, unknown>): RegisteredHospitalOption | null {
  const id = String(row.id ?? '').trim();
  const name = String(row.name ?? '').trim();
  if (!id || !name || isBlockedSuperAdminTenantId(id)) return null;

  return {
    id,
    name,
    code: String(row.hospital_code ?? row.code ?? '').trim() || null,
    city: String(row.city ?? '').trim() || null,
  };
}

/** Load active hospitals registered via Super Admin / hospital setup. */
export async function fetchRegisteredHospitals(
  supabase: SupabaseClient,
): Promise<{ hospitals: RegisteredHospitalOption[]; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('hospitals')
      .select('id, name, hospital_code, city, is_active, status')
      .order('name', { ascending: true });

    if (error) {
      return {
        hospitals: [],
        error: extractErrorMessage(error),
      };
    }

    const hospitals = (data ?? [])
      .map(asRecord)
      .filter(isActiveHospitalRow)
      .map(mapHospitalRow)
      .filter((row): row is RegisteredHospitalOption => Boolean(row));

    if (hospitals.length > 0) {
      return { hospitals, error: null };
    }

    const { data: tenants, error: tenantError } = await supabase
      .from('hospital_tenants')
      .select('hospital_id, hospital_name, city, status')
      .order('hospital_name', { ascending: true });

    if (tenantError) {
      return {
        hospitals: [],
        error: extractErrorMessage(tenantError),
      };
    }

    const tenantHospitals = (tenants ?? [])
      .map(asRecord)
      .filter(isActiveHospitalRow)
      .map((row) =>
        mapHospitalRow({
          id: row.hospital_id,
          name: row.hospital_name,
          hospital_code: row.hospital_code,
          city: row.city,
          is_active: row.is_active,
          status: row.status,
        }),
      )
      .filter((row): row is RegisteredHospitalOption => Boolean(row));

    return { hospitals: tenantHospitals, error: null };
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
  const codeSuffix = hospital.code ? ` (${hospital.code})` : '';
  const citySuffix = hospital.city ? ` — ${hospital.city}` : '';
  return `${hospital.name}${codeSuffix}${citySuffix}`;
}
