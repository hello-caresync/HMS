'use client';

import type { ReactNode } from 'react';

import { hospitalOpsClasses } from '@/lib/hospital/design-tokens';

import { HospitalOpsSidebar } from './HospitalOpsSidebar';

type Props = {
  children: ReactNode;
};

/** Shared authenticated hospital shell — sidebar + main canvas (Warm Sage theme). */
export function HospitalLayout({ children }: Props) {
  return (
    <div className={`flex min-h-screen ${hospitalOpsClasses.canvas}`}>
      <HospitalOpsSidebar />
      <div className="flex min-w-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
