import { Suspense } from 'react';

import { DoctorsWorkspace } from '@/components/patient-v0/DoctorsWorkspace';

export default function PatientDoctorsPage() {
  return (
    <Suspense fallback={<p className="p-6 text-sm font-bold text-patient-plum">Loading doctors…</p>}>
      <DoctorsWorkspace />
    </Suspense>
  );
}
