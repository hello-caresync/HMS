import {
  LEGACY_ACTIVE_HOSPITAL_ID,
  LEGACY_ROSTER_HOSPITAL_ID,
  LEGACY_SEED_HOSPITAL_ID,
} from '@/lib/regal/constants';

/** Seed / demo tenant UUIDs that must never appear in Super Admin tenant cards. */
export const BLOCKED_SUPER_ADMIN_TENANT_IDS = new Set<string>([
  LEGACY_SEED_HOSPITAL_ID,
  LEGACY_ACTIVE_HOSPITAL_ID,
  LEGACY_ROSTER_HOSPITAL_ID,
]);

export type SuperAdminTenantRow = {
  id: string;
  name: string;
  city: string;
  status: string;
};

export function isBlockedSuperAdminTenantId(id?: string | null): boolean {
  const value = String(id ?? '').trim();
  if (!value) return true;
  return BLOCKED_SUPER_ADMIN_TENANT_IDS.has(value);
}

export function filterProductionSuperAdminTenants<T extends { id: string }>(
  rows: T[],
): T[] {
  return rows.filter((row) => !isBlockedSuperAdminTenantId(row.id));
}
