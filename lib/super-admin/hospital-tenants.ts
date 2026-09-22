import type { SupabaseClient } from '@supabase/supabase-js';

import { isBlockedSuperAdminTenantId } from '@/lib/super-admin/tenant-directory';
import { isUuidValue } from '@/lib/utils/formatters';

export type SuperAdminHospitalTenant = {
  /** Primary UUID from `public.hospitals.id` */
  id: string;
  /** Canonical tenant badge, e.g. HOSP-01 */
  hospital_code: string;
  name: string;
  city: string;
  status: string;
  facility_code?: string;
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

export function normalizeHospitalTenantRow(row: Record<string, unknown>): SuperAdminHospitalTenant | null {
  const id = String(row.id ?? '').trim();
  if (!id) return null;

  const explicitCode = String(row.hospital_code ?? '').trim().toUpperCase();
  const hospital_code =
    explicitCode ||
    (!isUuidValue(id) ? id.toUpperCase() : '');

  if (!hospital_code) return null;

  return {
    id,
    hospital_code,
    name: String(row.name ?? row.hospital_name ?? 'Hospital').trim(),
    city: String(row.city ?? 'Bengaluru').trim(),
    status: String(row.status ?? 'Active').trim(),
    facility_code: row.facility_code ? String(row.facility_code).trim() : undefined,
  };
}

/**
 * Keep one card per `hospital_code`. Prefers non-blocked seed UUIDs and active rows.
 */
export function dedupeHospitalTenantsByCode(
  tenants: SuperAdminHospitalTenant[],
): SuperAdminHospitalTenant[] {
  const byCode = new Map<string, SuperAdminHospitalTenant>();

  for (const tenant of tenants) {
    const code = tenant.hospital_code.trim().toUpperCase();
    if (!code) continue;

    const existing = byCode.get(code);
    if (!existing) {
      byCode.set(code, tenant);
      continue;
    }

    const existingBlocked = isBlockedSuperAdminTenantId(existing.id);
    const candidateBlocked = isBlockedSuperAdminTenantId(tenant.id);

    if (existingBlocked && !candidateBlocked) {
      byCode.set(code, tenant);
      continue;
    }

    if (!existingBlocked && candidateBlocked) {
      continue;
    }

    // Prefer explicitly active status when both rows are production-safe.
    const existingActive = existing.status.toLowerCase() === 'active';
    const candidateActive = tenant.status.toLowerCase() === 'active';
    if (!existingActive && candidateActive) {
      byCode.set(code, tenant);
    }
  }

  return Array.from(byCode.values()).sort((a, b) => a.name.localeCompare(b.name));
}

/** Load connected tenants strictly from `public.hospitals`. */
export async function fetchSuperAdminHospitalTenants(
  supabase: SupabaseClient,
): Promise<SuperAdminHospitalTenant[]> {
  const { data, error } = await supabase
    .from('hospitals')
    .select('id, hospital_code, name, city, status, facility_code, is_active')
    .order('name', { ascending: true });

  if (error) {
    console.error('[super-admin] hospitals load failed:', error.message);
    return [];
  }

  const normalized = (data ?? [])
    .map((row) => normalizeHospitalTenantRow(asRecord(row)))
    .filter((row): row is SuperAdminHospitalTenant => row !== null)
    .filter((row) => row.status.toLowerCase() !== 'inactive');

  return dedupeHospitalTenantsByCode(normalized).filter(
    (row) => !isBlockedSuperAdminTenantId(row.id),
  );
}

/** Badge label for tenant cards — always `hospital_code`. */
export function formatHospitalTenantBadge(tenant: Pick<SuperAdminHospitalTenant, 'hospital_code'>): string {
  return tenant.hospital_code.trim().toUpperCase();
}
