import type { ReactNode } from 'react';

import HospitalPortalLayout from './_components/HospitalPortalLayout';

export default function HospitalLayout({ children }: { children: ReactNode }) {
  return <HospitalPortalLayout>{children}</HospitalPortalLayout>;
}
