import { redirect } from 'next/navigation';

import { PATIENT_ROUTES } from '@/lib/patient/navigation';

export default function LegacyPatientHealthPage() {
  redirect(PATIENT_ROUTES.records);
}
