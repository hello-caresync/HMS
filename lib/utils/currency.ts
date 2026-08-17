/**
 * Safely formats any numeric input into standard Indian Rupee (INR) notation.
 * Prevents UTF-8 encoding artifacts (e.g. "â‚¹") across all browsers and environments.
 */
export function formatINR(
  amount: number | string | null | undefined,
  options?: {
    showSymbol?: boolean;
    maximumFractionDigits?: number;
    fallback?: string;
  },
): string {
  const { showSymbol = true, maximumFractionDigits = 0, fallback = '\u20B90' } = options || {};

  if (amount === null || amount === undefined || Number.isNaN(Number(amount))) {
    return fallback;
  }

  const numericValue = Number(amount);

  try {
    const formattedNumber = new Intl.NumberFormat('en-IN', {
      maximumFractionDigits,
      minimumFractionDigits: 0,
    }).format(numericValue);

    return showSymbol ? `\u20B9${formattedNumber}` : formattedNumber;
  } catch {
    return `${showSymbol ? '\u20B9' : ''}${numericValue.toLocaleString('en-IN')}`;
  }
}

/** Alias for legacy call sites (`formatInr`). */
export const formatInr = formatINR;

/** Alias for hospital procurement PO displays. */
export const formatHospitalPoInr = formatINR;

/**
 * Parses raw currency strings or numbers safely to a number.
 */
export function parseCurrencyToNumber(value: string | number | null | undefined): number {
  if (typeof value === 'number') return Number.isNaN(value) ? 0 : value;
  if (!value) return 0;
  const clean = value.toString().replace(/[^0-9.-]+/g, '');
  const parsed = parseFloat(clean);
  return Number.isNaN(parsed) ? 0 : parsed;
}
