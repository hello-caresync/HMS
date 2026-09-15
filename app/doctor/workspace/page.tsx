'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/** Legacy isolated patient list — clinicians now work in the live dashboard. */
export default function DoctorWorkspacePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/doctor/dashboard');
  }, [router]);

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-[#F8FAFC]">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#00A896] border-t-transparent" />
    </div>
  );
}
