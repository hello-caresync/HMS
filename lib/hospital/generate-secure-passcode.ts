/** Generate a human-readable portal passcode, e.g. DOC-4821-K#A */
export function generateSecurePasscode(role: string = 'DOC'): string {
  const prefix = role.toUpperCase().slice(0, 3);
  const randomDigits = Math.floor(1000 + Math.random() * 9000);
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ#@!';
  const salt = Array.from({ length: 3 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `${prefix}-${randomDigits}-${salt}`;
}

export function passcodePrefixForStaffRole(role: string): string {
  const normalized = role.trim().toLowerCase();
  if (normalized === 'admin') return 'ADM';
  if (normalized === 'staff') return 'STA';
  if (normalized === 'doctor') return 'DOC';
  return normalized.slice(0, 3).toUpperCase() || 'DOC';
}

export function ensureStaffPasscodeKey(role: string, existing?: string | null): string {
  const trimmed = String(existing ?? '').trim();
  if (trimmed) return trimmed;
  return generateSecurePasscode(passcodePrefixForStaffRole(role));
}
