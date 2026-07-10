'use client';

import React from 'react';

import StaffSessionHeader from './StaffSessionHeader';

type HospitalBackOfficeShellProps = {
  children: React.ReactNode;
  moduleTitle?: string;
  showSearch?: boolean;
};

export default function HospitalBackOfficeShell({
  children,
  moduleTitle,
  showSearch,
}: HospitalBackOfficeShellProps) {
  return (
    <div className="flex min-h-screen flex-col bg-[#f1f5f9]">
      <StaffSessionHeader moduleTitle={moduleTitle} showSearch={showSearch} />
      <main className="custom-scrollbar flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-[2400px]">{children}</div>
      </main>
    </div>
  );
}
