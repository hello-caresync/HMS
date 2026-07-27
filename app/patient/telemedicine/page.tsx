import { Suspense } from 'react';

import { TelemedicineView } from '@/components/patient/telemedicine/TelemedicineView';

export default function PatientTelemedicinePage() {
  return (
    <Suspense fallback={<div className="p-4 text-sm font-medium text-patient-text">Loading…</div>}>
      <TelemedicineView />
    </Suspense>
  );
}
