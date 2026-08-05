import { redirect } from 'next/navigation';

import { PATIENT_ROUTES } from '@/lib/patient/navigation';

export default function LegacyTelemedicineRedirect() {
  redirect(PATIENT_ROUTES.dashboard);
}
