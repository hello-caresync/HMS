export const BLOOD_GROUPS = [
  'A+',
  'A-',
  'B+',
  'B-',
  'AB+',
  'AB-',
  'O+',
  'O-',
] as const;

export type StandardBloodGroup = (typeof BLOOD_GROUPS)[number];

export function isStandardBloodGroup(value: string): value is StandardBloodGroup {
  return (BLOOD_GROUPS as readonly string[]).includes(value);
}

/** Maps legacy free-text entries to a standard option when possible. */
export function normalizeBloodGroup(value: string): StandardBloodGroup | '' {
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (isStandardBloodGroup(trimmed)) return trimmed;

  const upper = trimmed.toUpperCase();
  return BLOOD_GROUPS.find((group) => group.toUpperCase() === upper) ?? '';
}
