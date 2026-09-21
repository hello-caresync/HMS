'use client';

import Image from 'next/image';

import { REGAL_HOSPITAL_LOGO_SRC } from '@/lib/regal/brand';

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
      <Image
        src={REGAL_HOSPITAL_LOGO_SRC}
        alt="Regal Multispeciality Hospital"
        width={160}
        height={40}
        priority={priority}
        className={`${heightClass} w-auto object-contain object-left`}
      />
    </div>
  );
}
