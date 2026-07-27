import { redirect } from 'next/navigation';

import { PATIENT_ROUTES } from '@/lib/patient/navigation';

/** Legacy Care Plan module removed — send users to the dashboard. */
export default function LegacyCarePlanRedirect() {
  redirect(PATIENT_ROUTES.dashboard);
}
