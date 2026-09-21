import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

import DoctorLoginPortal from './_components/DoctorLoginPortal';

export default function DoctorLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen w-full items-center justify-center bg-[#020617]">
          <Loader2 className="h-6 w-6 animate-spin text-teal-400" />
        </div>
      }
    >
      <DoctorLoginPortal />
    </Suspense>
  );
}
