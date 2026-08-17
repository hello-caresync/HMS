'use client';

import { Building2, ChevronDown } from 'lucide-react';

import { useActiveHospital, useActiveHospitalCode, useVendorAppStore } from '@/lib/vendor/store/vendor-app-store';

/** Top shell hospital context switcher — filters POs, shipments, and messages by hospital_code. */
export function HospitalSelector() {
  const hospitals = useVendorAppStore((s) => s.hospitals);
  const activeHospitalId = useVendorAppStore((s) => s.activeHospitalId);
  const setActiveHospitalId = useVendorAppStore((s) => s.setActiveHospitalId);
  const active = useActiveHospital();
  const activeCode = useActiveHospitalCode();

  return (
    <label className="relative inline-flex min-w-0 items-center gap-2">
      <Building2 className="hidden h-4 w-4 shrink-0 text-vendor-secondary sm:block" aria-hidden />
      <span className="sr-only">Hospital context</span>
      <select
        value={activeHospitalId}
        onChange={(event) => setActiveHospitalId(event.target.value)}
        className="max-w-[220px] cursor-pointer truncate rounded-lg border border-vendor-accent/20 bg-vendor-card py-1.5 pl-2 pr-8 text-xs font-semibold text-slate-800 shadow-sm sm:max-w-xs"
      >
        {hospitals.map((hospital) => (
          <option key={hospital.id} value={hospital.id}>
            {hospital.name}
          </option>
        ))}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-vendor-muted"
        aria-hidden
      />
      <span className="hidden text-[10px] font-medium text-vendor-muted lg:inline">{activeCode}</span>
      <span className="sr-only">Selected: {active.name}</span>
    </label>
  );
}

export default HospitalSelector;
