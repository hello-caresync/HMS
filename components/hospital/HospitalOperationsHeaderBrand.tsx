'use client';

import { RegalHospitalLogo } from '@/components/common/RegalHospitalLogo';

type HospitalOperationsHeaderBrandProps = {
  /** Hide when the sidebar brand is visible (e.g. `md:hidden` on /dashboard). */
  className?: string;
};

/** Full wordmark for the white top bar — shown when the sidebar is collapsed/hidden. */
export function HospitalOperationsHeaderBrand({
  className = 'md:hidden',
}: HospitalOperationsHeaderBrandProps) {
  return (
    <RegalHospitalLogo
      heightClass="h-10"
      widthClass="w-auto"
      framed={false}
      priority
      className={`my-2 shrink-0 ${className}`}
    />
  );
}

/** Page title block beside the logo (or standalone on desktop). */
export function HospitalOperationsHeaderTitle({
  title,
  nodeId,
  nodeName,
}: {
  title: string;
  nodeId: string;
  nodeName: string;
}) {
  return (
    <div className="min-w-0">
      <h2 className="text-base font-black leading-tight text-slate-900">{title}</h2>
      <p className="text-xs text-slate-500">
        Active Node:{' '}
        <span className="font-mono font-bold text-cyan-800">
          {nodeId} ({nodeName})
        </span>
      </p>
    </div>
  );
}
