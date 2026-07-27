'use client';

import { Search } from 'lucide-react';

import { useCareCenterStore } from '@/lib/doctor/stores/care-center-store';
import type { CareCenterFilter } from '@/lib/doctor/types/care-center-dto';
import { nxUi } from '@/lib/doctor/design-system';

const OPD_FILTERS: { id: CareCenterFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'waiting', label: 'Waiting' },
  { id: 'in_consult', label: 'In Consultation' },
  { id: 'completed', label: 'Completed' },
  { id: 'emergency', label: 'Emergency' },
  { id: 'follow_up', label: 'Follow-up' },
];

const IPD_FILTERS: { id: CareCenterFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'admitted', label: 'Admitted' },
  { id: 'icu', label: 'ICU' },
  { id: 'high_risk', label: 'High Risk' },
  { id: 'discharge_today', label: 'Discharge Today' },
];

export default function CareCenterFilters() {
  const activeTab = useCareCenterStore((s) => s.activeTab);
  const filter = useCareCenterStore((s) => s.filter);
  const search = useCareCenterStore((s) => s.search);
  const setFilter = useCareCenterStore((s) => s.setFilter);
  const setSearch = useCareCenterStore((s) => s.setSearch);

  const filters = activeTab === 'opd' ? OPD_FILTERS : IPD_FILTERS;

  return (
    <div className={`${nxUi.shell} flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between`}>
      <div className="relative min-w-[200px] flex-1 sm:max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5C5A4E]" aria-hidden />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search patient, UHID, ward, bed, diagnosis…"
          className={`${nxUi.input} pl-9`}
        />
      </div>
      <div className="flex flex-wrap gap-1.5">
        {filters.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={`rounded-full px-3 py-1 text-[11px] font-semibold transition ${
              filter === f.id ? 'bg-[#1C1B18] text-white' : 'bg-[#F3F2ED] text-[#6B6860] hover:text-[#1C1B18]'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>
    </div>
  );
}
