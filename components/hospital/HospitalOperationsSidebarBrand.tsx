'use client';

import { RegalHospitalLogo } from '@/components/common/RegalHospitalLogo';
import { REGAL_HOSPITAL_CODE, REGAL_HOSPITAL_NAME } from '@/lib/regal/constants';

/** Compact branded badge for the dark navy operations sidebar. */
export function HospitalOperationsSidebarBrand() {
  return (
    <div className="border-b border-[#124263] px-5 py-5">
      <div className="flex items-center justify-center rounded-xl bg-white px-3 py-2.5 shadow-sm">
        <RegalHospitalLogo heightClass="h-8" widthClass="w-auto" framed={false} priority={false} />
      </div>
      <p className="mt-3 text-center text-[11px] font-bold uppercase tracking-wide text-white">
        {REGAL_HOSPITAL_NAME}
      </p>
      <p className="mt-1 text-center font-mono text-[10px] font-bold text-cyan-300">
        {REGAL_HOSPITAL_CODE} · Bengaluru
      </p>
    </div>
  );
}
