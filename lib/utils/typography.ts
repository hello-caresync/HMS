/**
 * Safe typography tokens — use instead of literal UTF-8 in source files
 * to prevent mojibake (e.g. Â·, â€", â‚¹) when encoding drifts.
 */
export const MDOT = '\u00B7';
export const BULLET = '\u2022';
export const EM_DASH = '\u2014';
export const ELLIPSIS = '\u2026';
export const INR = '\u20B9';

/** Fallback placeholder for empty table cells and missing values. */
export const EMPTY_VALUE = EM_DASH;

/** Join non-empty segments with a middle dot separator. */
export function dotJoin(...parts: (string | null | undefined)[]): string {
  return parts.filter(Boolean).join(` ${MDOT} `);
}
