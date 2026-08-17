'use client';

import type { ReactNode } from 'react';

import { hospitalOpsClasses } from '@/lib/hospital/design-tokens';

type Props = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  actions?: ReactNode;
};

/** Page header + content area — use inside `(dashboard)` layout (sidebar provided by HospitalLayout). */
export function HospitalOpsShell({ title, subtitle, children, actions }: Props) {
  return (
    <>
      <header className="border-b border-[#CAD2C5] bg-white px-6 py-4 md:px-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className={hospitalOpsClasses.heading}>{title}</h1>
            {subtitle ? <p className={hospitalOpsClasses.subheading}>{subtitle}</p> : null}
          </div>
          {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
        </div>
      </header>
      <main className="flex-1 overflow-y-auto p-4 md:p-8">{children}</main>
    </>
  );
}
