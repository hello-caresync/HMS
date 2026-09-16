export function isUuidValue(str?: string | null): boolean {
  return (
    !!str &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str.trim())
  );
}

export type HospitalBadgeUser = {
  id?: string;
  badge_id?: string | null;
  staff_id?: string | null;
  doctor_id?: string | null;
  doctor_code?: string | null;
  email?: string | null;
  name?: string | null;
  role?: string | null;
};

/**
 * Resolves a human-readable hospital badge ID from user records,
 * preventing any raw 36-character UUID from ever rendering in the UI.
 */
export function formatHospitalBadge(user: HospitalBadgeUser): string {
  if (user.badge_id && !isUuidValue(user.badge_id)) {
    return user.badge_id.trim();
  }

  if (user.staff_id && !isUuidValue(user.staff_id)) {
    return user.staff_id.trim();
  }

  if (user.doctor_code && !isUuidValue(user.doctor_code)) {
    return user.doctor_code.trim();
  }

  if (user.doctor_id && !isUuidValue(user.doctor_id)) {
    return user.doctor_id.trim();
  }

  const email = (user.email || '').toLowerCase().trim();
  const name = (user.name || '').toLowerCase().trim();

  if (email === 'aishwaryaregaladmin@gmail.com' || name.includes('aishwarya')) {
    return 'HOSP-01-ADM01';
  }
  if (email === 'suriraju@gmail.com' || name.includes('suriraju')) {
    return 'SURI-RH-26-12';
  }
  if (email === 'suresh@gmail.com' || name.includes('adsync')) {
    return 'HOSP-01-VEN01';
  }
  if (email === 'ravi@gmail.com' || name.includes('ravi')) {
    return 'HOSP-01-STF02';
  }

  const roleRaw = (user.role || 'STF').toUpperCase();
  const prefix = roleRaw.includes('DOC')
    ? 'DOC'
    : roleRaw.includes('ADM')
      ? 'ADM'
      : roleRaw.includes('VEN')
        ? 'VEN'
        : 'STF';

  const cleanHash = (user.id || '000000').replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase();
  return `HOSP-01-${prefix}${cleanHash}`;
}

export type HospitalNodeBadgeInput = {
  id?: string;
  hospital_id?: string;
  hospital_code?: string | null;
  facility_code?: string | null;
  name?: string | null;
};

/** Formats tenant node badges without exposing raw PostgreSQL UUIDs. */
export function formatHospitalNodeBadge(node: HospitalNodeBadgeInput): string {
  for (const candidate of [
    node.hospital_code,
    node.facility_code,
    node.hospital_id,
    node.id,
  ]) {
    const value = String(candidate ?? '').trim();
    if (value && !isUuidValue(value)) {
      return value;
    }
  }

  const name = (node.name || '').toLowerCase();
  if (name.includes('regal')) {
    return 'HOSP-01';
  }

  const cleanHash = (node.id || node.hospital_id || '0000')
    .replace(/[^a-zA-Z0-9]/g, '')
    .slice(0, 4)
    .toUpperCase();
  return `NODE-${cleanHash || '0000'}`;
}
