'use client';

import { usePathname } from 'next/navigation';

import { usesBareLayout } from '../../lib/erpNavigation';
import ErpSidebar from './ErpSidebar';
import StaffSessionHeader from './StaffSessionHeader';

type ErpAppShellProps = {
  children: React.ReactNode;
};

export default function ErpAppShell({ children }: ErpAppShellProps) {
  const pathname = usePathname();

  if (usesBareLayout(pathname)) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#f1f5f9]">
      <ErpSidebar />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <StaffSessionHeader moduleTitle="Nexora Hospital Back-Office ERP" />

        <main className="custom-scrollbar flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-[2400px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
