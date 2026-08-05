import type { ReactNode } from 'react';

import HospitalLayoutRouter from './_components/HospitalLayoutRouter';

export default function HospitalLayout({ children }: { children: ReactNode }) {
  return <HospitalLayoutRouter>{children}</HospitalLayoutRouter>;
}
