'use client';

import { use, useEffect } from 'react';
import { useRouter } from 'next/navigation';

/** Legacy route — redirects to canonical `/doctor/consultations/` */
export default function LegacyConsultationRedirect({
  params,
}: {
  params: Promise<{ appointmentId: string }>;
}) {
  const { appointmentId } = use(params);
  const router = useRouter();

  useEffect(() => {
    router.replace(`/doctor/consultations/${appointmentId}/`);
  }, [appointmentId, router]);

  return null;
}
