'use client';

import { Suspense } from 'react';
import { useParams } from 'next/navigation';

import LegacyConsultationRedirectClient from './LegacyConsultationRedirectClient';

function LegacyConsultationRedirectContent() {
  const params = useParams<{ appointmentId: string }>();
  const appointmentId = params.appointmentId ?? '';

  return <LegacyConsultationRedirectClient appointmentId={appointmentId} />;
}

export default function LegacyConsultationRedirectPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-sm text-stone-500">
          Loading consultation…
        </div>
      }
    >
      <LegacyConsultationRedirectContent />
    </Suspense>
  );
}
