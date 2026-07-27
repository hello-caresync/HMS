/** Fixed-precision helpers for patient-facing numeric displays. */

export function formatNumericDelta(periodA: number, periodB: number): number {
  return Number((periodB - periodA).toFixed(1));
}

export function formatPercentChange(delta: number, baseValue: number): number {
  if (baseValue === 0) return 0;
  return Number(((delta / baseValue) * 100).toFixed(1));
}

export function displaySigned(value: number): string {
  return `${value > 0 ? '+' : ''}${value}`;
}
