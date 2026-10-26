const CLINICAL_INPUT_MAX = 180;
export const CLINICAL_DISPLAY_MAX = 360;

/** Programming text. A semicolon or equals sign in a normal note is still allowed. */
const CODE_PATTERN =
  /=>|\b(function|useState|useEffect|setCount|setState)\b|<\/?[a-z]+[\s>]/i;

const DISALLOWED_CLINICAL_CHARACTER = /[^A-Za-z0-9\s.,'’\-/():?;=]/;

export function looksLikeCode(value: string): boolean {
  return CODE_PATTERN.test(value) || /[{}]/.test(value);
}

/** Keep a short clinical sentence. Code and other symbols stay out of the field. */
export function acceptClinicalDraft(
  next: string,
  previous: string,
  max = CLINICAL_INPUT_MAX,
): string {
  if (next.length > max || looksLikeCode(next)) return previous;
  if (DISALLOWED_CLINICAL_CHARACTER.test(next)) return previous;
  return next;
}

export function sanitizeClinicalInput(value: string, max = CLINICAL_INPUT_MAX): string {
  const raw = String(value ?? '');
  if (!raw.trim() || looksLikeCode(raw)) return '';
  return raw.replace(/[^A-Za-z0-9\s.,'’\-/():?;=]/g, '').replace(/\s+/g, ' ').trim().slice(0, max);
}

/** Shorten stored notes so a pasted blob cannot fill the screen. */
export function displayClinicalText(value: string, max = CLINICAL_DISPLAY_MAX): string {
  const raw = String(value ?? '').replace(/\s+/g, ' ').trim();
  if (!raw) return '';
  if (looksLikeCode(raw)) return 'Visit reason was not saved as a clinical note.';
  if (raw.length > max) return `${raw.slice(0, max).trim()}…`;
  return raw;
}
