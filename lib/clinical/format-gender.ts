/** Normalize gender strings for OPD / queue display. */
export function formatGender(gender?: string | null): string {
  if (!gender) return '—';

  const g = String(gender).trim().toLowerCase();
  if (!g) return '—';
  if (g === 'male' || g === 'm') return 'Male';
  if (g === 'female' || g === 'f') return 'Female';
  if (g === 'other') return 'Other';
  if (g === 'prefer not to say') return 'Prefer not to say';

  return gender.trim().charAt(0).toUpperCase() + gender.trim().slice(1).toLowerCase();
}

/** Display helper — use em dash when demographics were not loaded. */
export function formatGenderDisplay(gender?: string | null): string {
  if (!gender || !String(gender).trim()) return '—';
  return formatGender(gender);
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

/** Read gender from appointment/queue rows and optional nested patient relations. */
export function resolveRawGenderFromRow(row: Record<string, unknown>): string | undefined {
  const nestedPatient = asRecord(row.patients ?? row.patient ?? row.patient_profiles);

  const candidates = [
    row.gender,
    row.patient_gender,
    row.sex,
    nestedPatient.gender,
    nestedPatient.patient_gender,
    nestedPatient.sex,
  ];

  for (const candidate of candidates) {
    const value = String(candidate ?? '').trim();
    if (value) return value;
  }

  return undefined;
}
