'use client';

import { useMemo, useState } from 'react';
import { Filter } from 'lucide-react';

import { searchPatients, type PatientRecord } from '../lib/patientsMockData';
import { PatientPanel, StatusBadge } from '../components/patientsUi';

type PatientDirectoryViewProps = {
  lookupQuery: string;
  onSelectPatient: (uhid: string) => void;
  selectedUhid: string | null;
};

export default function PatientDirectoryView({
  lookupQuery,
  onSelectPatient,
  selectedUhid,
}: PatientDirectoryViewProps) {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deptFilter, setDeptFilter] = useState<string>('all');
  const [genderFilter, setGenderFilter] = useState<string>('all');

  const filtered = useMemo(() => {
    let list = searchPatients(lookupQuery);
    if (statusFilter !== 'all') list = list.filter((p) => p.status === statusFilter);
    if (deptFilter !== 'all') list = list.filter((p) => p.department === deptFilter);
    if (genderFilter !== 'all') list = list.filter((p) => p.gender === genderFilter);
    return list;
  }, [lookupQuery, statusFilter, deptFilter, genderFilter]);

  const departments = useMemo(
    () => [...new Set(searchPatients('').map((p) => p.department))],
    [],
  );

  return (
    <div className="space-y-2">
      <div>
        <h2 className="text-sm font-bold text-[#0F172A]">Patient Directory</h2>
        <p className="text-[10px] text-slate-500">Multi-attribute filter · {filtered.length} records</p>
      </div>

      <PatientPanel title="Advanced Filters" icon={Filter}>
        <div className="flex flex-wrap gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-md border border-slate-200 px-2 py-1 text-[10px] font-semibold text-[#0F172A]"
            aria-label="Filter by status"
          >
            <option value="all">All Statuses</option>
            {['Outpatient', 'Inpatient', 'Emergency', 'Discharged'].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="rounded-md border border-slate-200 px-2 py-1 text-[10px] font-semibold text-[#0F172A]"
            aria-label="Filter by department"
          >
            <option value="all">All Departments</option>
            {departments.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
          <select
            value={genderFilter}
            onChange={(e) => setGenderFilter(e.target.value)}
            className="rounded-md border border-slate-200 px-2 py-1 text-[10px] font-semibold text-[#0F172A]"
            aria-label="Filter by gender"
          >
            <option value="all">All Genders</option>
            {['Male', 'Female'].map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>
      </PatientPanel>

      <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left">
            <thead className="border-b border-slate-100 bg-[#F8FAFC]">
              <tr>
                {['UHID', 'Name', 'Age/Sex', 'Phone', 'Insurance ID', 'Department', 'Status'].map((h) => (
                  <th key={h} className="px-2.5 py-2 text-[9px] font-bold uppercase tracking-wider text-slate-500">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <DirectoryRow
                  key={p.uhid}
                  patient={p}
                  selected={selectedUhid === p.uhid}
                  onSelect={() => onSelectPatient(p.uhid)}
                />
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-2.5 py-6 text-center text-[10px] text-slate-400">
                    No patients match current filters
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function DirectoryRow({
  patient,
  selected,
  onSelect,
}: {
  patient: PatientRecord;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <tr
      onClick={onSelect}
      onKeyDown={(e) => e.key === 'Enter' && onSelect()}
      tabIndex={0}
      role="button"
      className={`cursor-pointer border-b border-slate-50 transition-colors hover:bg-blue-50/40 ${
        selected ? 'bg-blue-50 ring-1 ring-inset ring-[#2563EB]/30' : ''
      }`}
    >
      <td className="px-2.5 py-1.5 font-mono text-[10px] font-semibold text-[#2563EB]">{patient.uhid}</td>
      <td className="px-2.5 py-1.5 text-[10px] font-semibold text-[#0F172A]">{patient.name}</td>
      <td className="px-2.5 py-1.5 text-[10px] text-slate-600">{patient.age} / {patient.gender}</td>
      <td className="px-2.5 py-1.5 text-[10px] text-slate-600">{patient.phone}</td>
      <td className="px-2.5 py-1.5 font-mono text-[9px] text-slate-500">{patient.insuranceId}</td>
      <td className="px-2.5 py-1.5 text-[10px] text-slate-600">{patient.department}</td>
      <td className="px-2.5 py-1.5"><StatusBadge status={patient.status} /></td>
    </tr>
  );
}
