'use client';

import StaffModuleNav from '../../staff/components/StaffModuleNav';
import { StaffManagementProvider } from '../../staff/context/StaffManagementProvider';

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  return (
    <StaffManagementProvider>
      <StaffModuleNav />
      {children}
    </StaffManagementProvider>
  );
}
