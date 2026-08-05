import { redirect } from 'next/navigation';

import { PATIENT_ROUTES } from '@/lib/patient/navigation';

export default function LegacyPatientBillingPage() {
  redirect(PATIENT_ROUTES.dashboard);
}
