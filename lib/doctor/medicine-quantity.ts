/** Count daily doses from a frequency pattern like "1-0-1" or "STAT". */
export function parseFrequencyDosesPerDay(frequency: string): number {
  const normalized = frequency.trim().toUpperCase();
  if (!normalized) return 1;
  if (normalized === 'STAT') return 1;

  const hyphenParts = normalized.split('-');
  if (hyphenParts.length >= 2) {
    const sum = hyphenParts.reduce((total, part) => {
      const n = parseInt(part.replace(/\D/g, ''), 10);
      return total + (Number.isFinite(n) ? n : 0);
    }, 0);
    if (sum > 0) return sum;
  }

  const acronymMatch = normalized.match(/\b(OD|BID|BD|TID|QID)\b/);
  if (acronymMatch) {
    const map: Record<string, number> = { OD: 1, BID: 2, BD: 2, TID: 3, QID: 4 };
    return map[acronymMatch[1]] ?? 1;
  }

  return 1;
}

export function parseDurationDays(duration: string): number {
  const match = duration.match(/(\d+)/);
  return match ? Math.max(1, parseInt(match[1], 10)) : 1;
}

/** Estimate total units as daily dose count × duration in days. */
export function computeMedicineQuantity(frequency: string, duration: string): number {
  return parseFrequencyDosesPerDay(frequency) * parseDurationDays(duration);
}
