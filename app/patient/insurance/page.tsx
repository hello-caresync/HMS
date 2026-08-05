import { redirect } from 'next/navigation';

import { PATIENT_ROUTES } from '@/lib/patient/navigation';

export default function LegacyPatientInsurancePage() {
  redirect(PATIENT_ROUTES.profile);
}
