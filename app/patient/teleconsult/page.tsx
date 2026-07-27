import { redirect } from 'next/navigation';

import { PATIENT_ROUTES } from '@/lib/patient/navigation';

export default function LegacyTeleconsultRedirect() {
  redirect(PATIENT_ROUTES.telemedicine);
}
