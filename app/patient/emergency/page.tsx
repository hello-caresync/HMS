'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { PATIENT_ROUTES } from '@/lib/patient/navigation';

/** Legacy route — Rakshak SOS now lives on the patient dashboard */
export default function RakshakEmergencyRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace(PATIENT_ROUTES.dashboard);
  }, [router]);

  return (
    <div className="flex min-h-[40vh] items-center justify-center p-8 text-sm font-bold text-patient-lavender">
      Redirecting to dashboard…
    </div>
  );
}
