export const INDIAN_MOBILE_RE = /^[6-9]\d{9}$/;
export const TEN_DIGIT_PHONE_RE = /^\d{10}$/;
export const PHONE_VALIDATION_MESSAGE = 'Please enter a valid 10-digit mobile number';
export const PATIENT_AGE_MIN = 1;
export const PATIENT_AGE_MAX = 120;

export function digitsOnly(value: string): string {
  return String(value ?? '').replace(/\D/g, '');
}

/** Strip non-digits and cap at 10 characters for controlled phone inputs. */
export function sanitizePhoneDigits(value: string): string {
  return digitsOnly(value).slice(0, 10);
}

export function isTenDigitPhone(value: string): boolean {
  return TEN_DIGIT_PHONE_RE.test(sanitizePhoneDigits(value));
}

export function resolveOptionalPhone(value: string): string | null {
  const digits = sanitizePhoneDigits(value);
  if (!digits) return null;
  return isTenDigitPhone(digits) ? digits : null;
}

export function validatePhoneField(
  value: string,
  required = false,
): { ok: true; phone: string | null } | { ok: false; message: string } {
  const digits = sanitizePhoneDigits(value);
  if (!digits) {
    if (required) return { ok: false, message: PHONE_VALIDATION_MESSAGE };
    return { ok: true, phone: null };
  }
  if (!TEN_DIGIT_PHONE_RE.test(digits)) {
    return { ok: false, message: PHONE_VALIDATION_MESSAGE };
  }
  return { ok: true, phone: digits };
}

export function blockNonDigitPhoneKey(event: {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  preventDefault: () => void;
}): void {
  const controlKeys = ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End'];
  if (controlKeys.includes(event.key)) return;
  if (event.ctrlKey || event.metaKey) return;
  if (!/^\d$/.test(event.key)) event.preventDefault();
}

export function normalizeIndianMobile(value: string): string {
  let digits = digitsOnly(value);
  if (digits.startsWith('91') && digits.length === 12) digits = digits.slice(2);
  if (digits.startsWith('0') && digits.length === 11) digits = digits.slice(1);
  return digits.slice(-10);
}

export function isValidIndianMobile(value: string): boolean {
  return INDIAN_MOBILE_RE.test(normalizeIndianMobile(value));
}

export function parsePatientAge(value: string | number | null | undefined): number | null {
  if (value == null || String(value).trim() === '') return null;
  if (typeof value === 'string' && !/^\d+$/.test(value.trim())) return null;
  const years = typeof value === 'number' ? value : Number(String(value).trim());
  if (!Number.isInteger(years) || years < PATIENT_AGE_MIN || years > PATIENT_AGE_MAX) return null;
  return years;
}

export function formatPatientAgeLabel(patient: {
  patient_age?: number | null;
  age?: number | null;
}): string {
  const years = patient.patient_age ?? patient.age;
  return years != null && Number.isFinite(Number(years)) ? `${Number(years)}y` : 'Age N/A';
}
