import type { Metadata } from 'next';
import { Suspense, type ReactNode } from 'react';

import { REGAL_HMS_DESCRIPTION, REGAL_HOSPITAL_FULL_NAME } from '@/lib/regal/brand';

import HospitalLayoutRouter from './_components/HospitalLayoutRouter';

export const metadata: Metadata = {
  title: REGAL_HOSPITAL_FULL_NAME,
  description: REGAL_HMS_DESCRIPTION,
};

function HospitalLayoutFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <p className="text-sm font-medium text-stone-500">Loading hospital workspace…</p>
    </div>
  );
}

export default function HospitalLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen w-full overscroll-none bg-slate-50">
      <Suspense fallback={<HospitalLayoutFallback />}>
        <HospitalLayoutRouter>{children}</HospitalLayoutRouter>
      </Suspense>
    </div>
  );
}
