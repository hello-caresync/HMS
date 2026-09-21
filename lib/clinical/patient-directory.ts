import { resolveRawGenderFromRow } from '@/lib/clinical/format-gender';

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

/** Prefer canonical phone fields from patients / profile rows. */
export function resolvePatientPhoneFromRow(row: Record<string, unknown>): string {
  const metadata = asRecord(row.metadata);
  const nestedPatient = asRecord(row.patients ?? row.patient ?? row.patient_profiles);

  const candidates = [
    row.phone,
    row.mobile,
    row.contact_number,
    row.patient_phone,
    nestedPatient.phone,
    nestedPatient.mobile,
    metadata.phone,
    metadata.mobile,
  ];

  for (const candidate of candidates) {
    const value = String(candidate ?? '').trim();
    if (value) return value;
  }

  return '';
}

export function calculateAgeFromDob(
  dob?: string | null,
  fallbackAge?: number | null,
): number | null {
  if (dob) {
    const birthDate = new Date(dob);
    if (!Number.isNaN(birthDate.getTime())) {
      const diff = Date.now() - birthDate.getTime();
      const ageDate = new Date(diff);
      return Math.abs(ageDate.getUTCFullYear() - 1970);
    }
  }

  if (fallbackAge != null && Number.isFinite(Number(fallbackAge))) {
    return Number(fallbackAge);
  }

  return null;
}

export function resolvePatientDobFromRow(row: Record<string, unknown>): string | null {
  const value = String(row.dob ?? row.date_of_birth ?? '').trim();
  return value || null;
}

export function resolvePatientAgeFromRow(row: Record<string, unknown>): number | null {
  const ageRaw = row.patient_age ?? row.age;
  const fallback =
    ageRaw == null || ageRaw === ''
      ? null
      : Number.isFinite(Number(ageRaw))
        ? Number(ageRaw)
        : null;

  return calculateAgeFromDob(resolvePatientDobFromRow(row), fallback);
}

export function formatPatientAgeDisplay(patient: {
  dob?: string | null;
  age?: number | null;
  patient_age?: number | null;
}): string {
  const years = calculateAgeFromDob(
    patient.dob ?? null,
    patient.patient_age ?? patient.age ?? null,
  );
  return years != null ? `${years}y` : '—';
}

export function collectVisitIdsFromRow(row: Record<string, unknown>): string[] {
  const ids = new Set<string>();

  for (const bucket of ['appointments', 'encounters'] as const) {
    const nested = row[bucket];
    if (!Array.isArray(nested)) continue;
    for (const item of nested) {
      const id = String(asRecord(item).id ?? '').trim();
      if (id) ids.add(id);
    }
  }

  return [...ids];
}

export function countPatientVisitsFromRow(row: Record<string, unknown>): number {
  const nestedCount = collectVisitIdsFromRow(row).length;
  if (nestedCount > 0) return nestedCount;

  const stored = Number(row.visit_count);
  return Number.isFinite(stored) && stored > 0 ? stored : 0;
}

export function resolvePatientGenderFromRow(row: Record<string, unknown>): string {
  return resolveRawGenderFromRow(row) ?? '';
}

export function normalizeGenderFilterValue(gender?: string | null): string {
  const value = String(gender ?? '').trim().toLowerCase();
  if (!value || value === '—') return '';
  if (value === 'm' || value === 'male') return 'male';
  if (value === 'f' || value === 'female') return 'female';
  if (value === 'other') return 'other';
  return value;
}
