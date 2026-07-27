import { redirect } from 'next/navigation';

import { PATIENT_ROUTES } from '@/lib/patient/navigation';

/** Legacy Messages route → unified telemedicine hub (messages tab). */
export default function LegacyCommunicationRedirect() {
  redirect(`${PATIENT_ROUTES.telemedicine}?tab=messages`);
}
