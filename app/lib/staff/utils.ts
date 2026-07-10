/** Mask government ID for display — last 4 characters visible */
export function maskGovernmentId(raw: string): string {
  const normalized = raw.trim();
  if (normalized.length <= 4) return '****';

  const visible = normalized.slice(-4);
  const maskedLength = Math.max(normalized.length - 4, 4);
  return `${'X'.repeat(Math.min(maskedLength, 12))}-${visible}`;
}

export function formatEmployeeId(id: string): string {
  return id.toUpperCase();
}

export function formatShiftDays(days: number[]): string {
  const labels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  if (days.length === 7) return 'Daily';
  if (days.length === 5 && days.every((d) => d >= 1 && d <= 5)) return 'Mon–Fri';
  return days.map((d) => labels[d]).join(', ');
}
