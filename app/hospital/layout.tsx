import type { ReactNode } from 'react';

import HospitalLayoutRouter from './_components/HospitalLayoutRouter';

export default function HospitalLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen w-full overscroll-none bg-slate-50">
      <HospitalLayoutRouter>{children}</HospitalLayoutRouter>
    </div>
  );
}
