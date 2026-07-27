import { Suspense } from 'react';

import DoctorAuthLoginForm from './DoctorAuthLoginForm';

export default function DoctorAuthLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#FAFAF5]">
          <p className="text-sm text-[#5C5A4E]">Loading…</p>
        </div>
      }
    >
      <DoctorAuthLoginForm />
    </Suspense>
  );
}
