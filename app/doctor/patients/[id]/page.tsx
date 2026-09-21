'use client';

import { Suspense } from 'react';
import { useParams } from 'next/navigation';

import PatientProfileWorkspace from '@/components/doctor/command-center/PatientProfileWorkspace';

function DoctorPatientDetailContent() {
  const params = useParams<{ id: string }>();
  const id = params.id ?? '';

  return <PatientProfileWorkspace patientId={id} />;
}

export default function DoctorPatientDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-sm text-stone-500">
          Loading patient profile…
        </div>
      }
    >
      <DoctorPatientDetailContent />
    </Suspense>
  );
}
