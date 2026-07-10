let uhidSequence = 1042;
let tempSequence = 17;

/** Standard UHID: NEX-2026-XXXX */
export function generateStandardUhid(): string {
  uhidSequence += 1;
  return `NEX-2026-${String(uhidSequence).padStart(4, '0')}`;
}

/** Emergency temporary UHID: NEX-2026-TMP-XXXX */
export function generateTemporaryUhid(): string {
  tempSequence += 1;
  return `NEX-2026-TMP-${String(tempSequence).padStart(4, '0')}`;
}

export function generatePatientId(): string {
  return `pat-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

export function splitFullName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 0) return { firstName: 'Unknown', lastName: '' };
  if (parts.length === 1) return { firstName: parts[0], lastName: '—' };
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
}

export function formatPatientName(profile: { firstName: string; lastName: string }): string {
  return `${profile.firstName} ${profile.lastName}`.trim();
}

export function calculateAgeFromDob(dob: string): number | null {
  if (!dob) return null;
  const birth = new Date(dob);
  if (Number.isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age -= 1;
  return age;
}
