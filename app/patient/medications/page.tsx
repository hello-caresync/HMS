import { redirect } from 'next/navigation';

import { PATIENT_ROUTES } from '@/lib/patient/navigation';

export default function LegacyPatientMedicationsPage() {
  redirect(PATIENT_ROUTES.prescriptions);
}
