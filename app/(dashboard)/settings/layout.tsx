'use client';

import SettingsModuleNav from '../../settings/components/SettingsModuleNav';
import { BedManagementProvider } from '../../settings/bed-management/context/BedManagementProvider';

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <BedManagementProvider>
      <SettingsModuleNav />
      {children}
    </BedManagementProvider>
  );
}
