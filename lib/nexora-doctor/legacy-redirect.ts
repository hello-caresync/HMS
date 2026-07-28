import { redirect } from 'next/navigation';

/** Server redirect helper for legacy doctor routes */
export function legacyDoctorRedirect(fromPath: string) {
  const { LEGACY_DOCTOR_REDIRECTS } = require('./navigation') as typeof import('./navigation');
  const target = LEGACY_DOCTOR_REDIRECTS[fromPath] ?? '/doctor/dashboard';
  redirect(target);
}
