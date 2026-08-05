import { redirect } from 'next/navigation';

import { PATIENT_ROUTES } from '@/lib/patient/navigation';

/** Legacy Messages route → dashboard. */
export default function LegacyMessagesRedirect() {
  redirect(PATIENT_ROUTES.dashboard);
}
