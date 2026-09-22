'use client';

import { HospitalLogo } from '@/components/common/Logo';

type HospitalOperationsBrandProps = {
  /** Tailwind height utility, e.g. h-9 */
  heightClass?: string;
  className?: string;
  priority?: boolean;
};

/** Clean wordmark for Hospital Operations sidebar and top header — no badge frame. */
export function HospitalOperationsBrand({
  heightClass = 'h-9',
  className = '',
  priority = false,
}: HospitalOperationsBrandProps) {
  return (
    <div className={`flex h-10 items-center ${className}`}>
      <HospitalLogo className={`${heightClass} w-auto object-left`} priority={priority} />
    </div>
  );
}
