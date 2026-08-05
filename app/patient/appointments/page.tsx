import { Suspense } from 'react';

import { AppointmentsWorkspace } from '@/components/patient-v0/AppointmentsWorkspace';

export default function PatientAppointmentsPage() {
  return (
    <Suspense fallback={<p className="p-6 text-sm font-bold text-patient-plum">Loading appointments…</p>}>
      <AppointmentsWorkspace />
    </Suspense>
  );
}
