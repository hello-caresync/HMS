'use client';

import { useMemo, useState } from 'react';
import { Search, UserSearch } from 'lucide-react';

import { usePatientRegistry } from '../context/PatientRegistryProvider';
import type { PatientRecord } from '../types';
import PatientProfileCard from './PatientProfileCard';

type PatientAdvancedSearchProps = {
  onPatientSelect?: (record: PatientRecord) => void;
};

export default function PatientAdvancedSearch({ onPatientSelect }: PatientAdvancedSearchProps) {
  const { searchPatients, patients } = usePatientRegistry();
  const [query, setQuery] = useState('');

  const results = useMemo(() => searchPatients(query), [searchPatients, query]);

  return (
    <div className="space-y-3">
      <div>
        <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <UserSearch className="h-4 w-4 text-primary" />
          Patient Advanced Search
        </h2>
        <p className="text-[11px] text-slate-800">Filter by UHID, name, or phone number</p>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-800" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="NEX-2026-1001 · Ananya Sharma · +91 98765…"
          className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-800 placeholder:text-slate-800 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          autoComplete="off"
        />
      </div>

      <p className="text-[11px] tabular-nums text-slate-800">
        {query.trim() ? `${results.length} match${results.length === 1 ? '' : 'es'}` : `${patients.length} total patients`}
      </p>

      {results.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 py-12 text-center">
          <UserSearch className="mx-auto mb-2 h-8 w-8 text-slate-900" />
          <p className="text-sm text-slate-800">No patients found</p>
          <p className="text-xs text-slate-800">Try UHID, full name, or mobile number</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {results.map((record) => (
            <PatientProfileCard
              key={record.profile.id}
              record={record}
              onSelect={onPatientSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}
