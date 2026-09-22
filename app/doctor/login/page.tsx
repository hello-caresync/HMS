import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

import DoctorLoginPortal from './_components/DoctorLoginPortal';

export default function DoctorLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen w-full items-center justify-center bg-slate-900/95">
          <Loader2 className="h-6 w-6 animate-spin text-teal-500" />
        </div>
      }
    >
      <DoctorLoginPortal />
    </Suspense>
  );
}
