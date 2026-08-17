'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

import ConsultationWorkspaceClient from './[appointmentId]/ConsultationWorkspaceClient';

function ConsultationWorkspace() {
  const searchParams = useSearchParams();
  const appointmentId =
    searchParams.get('appointmentId') ||
    searchParams.get('id') ||
    searchParams.get('appointment_id') ||
    '';

  if (!appointmentId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500 font-semibold text-sm p-6 text-center">
        No appointment selected. Return to the dashboard and start a consultation from the
        queue.
      </div>
    );
  }

  return <ConsultationWorkspaceClient appointmentIdOverride={appointmentId} />;
}

export default function DoctorConsultationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500 font-semibold text-sm">
          Loading Encounter...
        </div>
      }
    >
      <ConsultationWorkspace />
    </Suspense>
  );
}
