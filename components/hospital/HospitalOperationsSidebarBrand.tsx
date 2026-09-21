'use client';

import { RegalHospitalLogo } from '@/components/common/RegalHospitalLogo';
import { REGAL_HOSPITAL_CODE } from '@/lib/regal/constants';

/** Compact branded badge for the dark navy operations sidebar. */
export function HospitalOperationsSidebarBrand() {
  return (
    <div className="border-b border-slate-700/40 px-4 py-3">
      <div className="flex items-center justify-center rounded-xl bg-white px-3 py-2 shadow-sm">
        <RegalHospitalLogo heightClass="h-7" widthClass="w-auto" framed={false} priority={false} />
      </div>
      <div className="mt-2 flex items-center justify-between px-1 text-[11px] font-medium text-slate-300">
        <span>Hospital Operations</span>
        <span className="font-semibold text-teal-400">{REGAL_HOSPITAL_CODE}</span>
      </div>
    </div>
  );
}
