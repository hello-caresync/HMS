import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { REGAL_HMS_DESCRIPTION, REGAL_HOSPITAL_FULL_NAME } from '@/lib/regal/brand';

import HospitalLayoutRouter from './_components/HospitalLayoutRouter';

export const metadata: Metadata = {
  title: REGAL_HOSPITAL_FULL_NAME,
  description: REGAL_HMS_DESCRIPTION,
};

export default function HospitalLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen w-full overscroll-none bg-slate-50">
      <HospitalLayoutRouter>{children}</HospitalLayoutRouter>
    </div>
  );
}
