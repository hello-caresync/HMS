'use client';

import { use, useEffect } from 'react';
import { useRouter } from 'next/navigation';

/** Legacy route — redirects to canonical `/doctor/consultations/` */
export default function LegacyConsultationRedirectClient({
  appointmentId,
}: {
  appointmentId: string;
}) {
  const router = useRouter();

  useEffect(() => {
    router.replace(`/doctor/consultations?appointmentId=${appointmentId}`);
  }, [appointmentId, router]);

  return null;
}
