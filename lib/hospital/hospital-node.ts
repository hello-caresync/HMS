import { isHospitalUuid } from '@/lib/hospital/resolve-hospital-context';
import {
  HOSPITAL_TENANT_ID,
  LEGACY_ACTIVE_HOSPITAL_ID,
  LEGACY_ROSTER_HOSPITAL_ID,
  LEGACY_SEED_HOSPITAL_ID,
  REGAL_FACILITY_CODE,
  REGAL_HOSPITAL_CODE,
} from '@/lib/regal/constants';

export { REGAL_FACILITY_CODE, REGAL_HOSPITAL_CODE };

/** Tenant codes + legacy UUIDs used when loading personnel/credential directories. */
export function hospitalDirectoryFilterIds(preferredId?: string | null): string[] {
  const values = new Set<string>([
    HOSPITAL_TENANT_ID,
    REGAL_HOSPITAL_CODE,
    REGAL_FACILITY_CODE,
    LEGACY_SEED_HOSPITAL_ID,
    LEGACY_ROSTER_HOSPITAL_ID,
    LEGACY_ACTIVE_HOSPITAL_ID,
  ]);
  const trimmed = preferredId?.trim();
  if (trimmed) values.add(trimmed);
  return Array.from(values);
}

export function buildHospitalDirectoryOrFilter(ids: string[]): string {
  const parts: string[] = [];
  for (const id of ids.filter(Boolean)) {
    parts.push(`hospital_id.eq.${id}`);
    if (!isHospitalUuid(id)) {
      parts.push(`hospital_code.eq.${id}`);
    }
  }
  parts.push('hospital_id.is.null');
  return parts.join(',');
}

export function isUuidValue(value: unknown): value is string {
  return isHospitalUuid(value);
}

/**
 * Values to query when loading hospital-scoped rows.
 * Includes tenant codes (HOSP-01), facility codes, legacy UUIDs, and null-unscoped rows.
 */
export function hospitalIdQueryValues(raw?: string | null): string[] {
  const value = String(raw ?? '').trim();
  const values = new Set<string>(hospitalDirectoryFilterIds(value || HOSPITAL_TENANT_ID));
  if (value) values.add(value);
  if (isHospitalUuid(value)) values.add(value);
  return Array.from(values);
}

/** True when a row belongs to the active hospital node (or is unscoped legacy data). */
export function recordBelongsToHospitalNode(
  row: Record<string, unknown>,
  nodeId: string,
): boolean {
  const hospitalId = String(row.hospital_id ?? '').trim();
  const hospitalCode = String(row.hospital_code ?? '').trim();
  if (!hospitalId && !hospitalCode) return true;

  const allowed = new Set(
    hospitalDirectoryFilterIds(nodeId).map((id) => id.trim().toLowerCase()),
  );
  allowed.add(String(nodeId).trim().toLowerCase());

  const candidates = [hospitalId, hospitalCode].filter(Boolean).map((v) => v.toLowerCase());
  return candidates.some((candidate) => allowed.has(candidate));
}

export function hospitalIdsMatch(left?: string | null, right?: string | null): boolean {
  if (!left || !right) return false;
  return left.trim().toLowerCase() === right.trim().toLowerCase();
}

export function isUuidColumnError(message?: string | null): boolean {
  const lower = String(message ?? '').toLowerCase();
  return lower.includes('invalid input syntax for type uuid');
}
