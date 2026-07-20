'use client';

import { useMemo, useState } from 'react';
import { Stethoscope, UserPlus } from 'lucide-react';

import {
  MasterDataTable,
  MasterField,
  MasterPanel,
  MasterSearchBar,
  MasterSheet,
  MasterTabBar,
  MasterViewHeader,
  masterBtnPrimary,
  masterInputClass,
} from './_masterLightUi';

type Doctor = {
  id: string;
  name: string;
  department: string;
  specialization: string;
  opdTiming: string;
  allocation: 'Full' | 'Partial' | 'On-Call';
};

const SEED_DOCTORS: Doctor[] = [
  {
    id: 'DOC-01',
    name: 'Dr. Anita Roy',
    department: 'Cardiology',
    specialization: 'Interventional Cardiology',
    opdTiming: 'Mon–Fri · 09:00–13:00',
    allocation: 'Full',
  },
  {
    id: 'DOC-02',
    name: 'Dr. B. J. Joseph',
    department: 'Orthopedics',
    specialization: 'Joint Replacement',
    opdTiming: 'Mon–Sat · 14:00–18:00',
    allocation: 'Full',
  },
  {
    id: 'DOC-03',
    name: 'Dr. Meera Iyer',
    department: 'Pediatrics',
    specialization: 'Neonatology',
    opdTiming: 'Tue–Sun · 10:00–14:00',
    allocation: 'Partial',
  },
  {
    id: 'DOC-04',
    name: 'Dr. Rajesh Kumar',
    department: 'General Medicine',
    specialization: 'Internal Medicine',
    opdTiming: 'Daily · 08:00–12:00',
    allocation: 'On-Call',
  },
];

const DEPT_TABS = ['All', 'Cardiology', 'Orthopedics', 'Pediatrics', 'General Medicine'] as const;

export default function MasterDoctorsView() {
  const [doctors, setDoctors] = useState(SEED_DOCTORS);
  const [search, setSearch] = useState('');
  const [deptTab, setDeptTab] = useState<(typeof DEPT_TABS)[number]>('All');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [form, setForm] = useState({
    name: '',
    department: 'Cardiology',
    specialization: '',
    opdTiming: '',
    allocation: 'Full' as Doctor['allocation'],
  });

  const filtered = useMemo(
    () =>
      doctors.filter((d) => {
        const matchDept = deptTab === 'All' || d.department === deptTab;
        const q = search.toLowerCase();
        const matchSearch =
          d.name.toLowerCase().includes(q) ||
          d.specialization.toLowerCase().includes(q) ||
          d.department.toLowerCase().includes(q);
        return matchDept && matchSearch;
      }),
    [doctors, search, deptTab],
  );

  const handleOnboard = () => {
    if (!form.name.trim()) return;
    setDoctors((rows) => [
      ...rows,
      {
        id: `DOC-${String(rows.length + 1).padStart(2, '0')}`,
        name: form.name.trim(),
        department: form.department,
        specialization: form.specialization.trim() || 'General',
        opdTiming: form.opdTiming.trim() || 'TBD',
        allocation: form.allocation,
      },
    ]);
    setSheetOpen(false);
    setForm({ name: '', department: 'Cardiology', specialization: '', opdTiming: '', allocation: 'Full' });
  };

  const allocationBadge = (status: Doctor['allocation']) => {
    const styles = {
      Full: 'bg-blue-50 text-blue-700 ring-blue-200',
      Partial: 'bg-amber-50 text-amber-700 ring-amber-200',
      'On-Call': 'bg-slate-100 text-slate-600 ring-slate-200',
    }[status];
    return (
      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ring-1 ${styles}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <MasterViewHeader
        title="Clinician Master Registry"
        subtitle="Consultant roster with specialization mapping, OPD timing slots, and allocation matrix."
        icon={Stethoscope}
        action={
          <button type="button" className={masterBtnPrimary} onClick={() => setSheetOpen(true)}>
            <UserPlus className="h-3.5 w-3.5" />
            Onboard Consultant
          </button>
        }
      />

      <MasterSearchBar value={search} onChange={setSearch} placeholder="Search clinicians, specialization…" />

      <MasterTabBar
        tabs={DEPT_TABS.map((d) => ({ id: d, label: d }))}
        active={deptTab}
        onChange={setDeptTab}
      />

      <MasterPanel title="Allocation Status Matrix" description="Department-filtered clinician grid">
        <MasterDataTable
          columns={['Practitioner', 'Department', 'Specialization', 'OPD Timings', 'Allocation']}
          rows={filtered.map((d) => [
            <span key="n" className="font-semibold text-slate-800">
              {d.name}
            </span>,
            d.department,
            d.specialization,
            <span key="t" className="font-mono text-[11px] text-slate-500">
              {d.opdTiming}
            </span>,
            allocationBadge(d.allocation),
          ])}
        />
      </MasterPanel>

      <MasterSheet open={sheetOpen} title="Onboard Consulting Personnel" onClose={() => setSheetOpen(false)}>
        <div className="space-y-4">
          <MasterField label="Full Name">
            <input
              className={masterInputClass}
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Dr. Full Name"
            />
          </MasterField>
          <MasterField label="Primary Department">
            <select
              className={masterInputClass}
              value={form.department}
              onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}
            >
              {DEPT_TABS.filter((d) => d !== 'All').map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </MasterField>
          <MasterField label="Core Specialization">
            <input
              className={masterInputClass}
              value={form.specialization}
              onChange={(e) => setForm((f) => ({ ...f, specialization: e.target.value }))}
            />
          </MasterField>
          <MasterField label="OPD Timing Slots">
            <input
              className={masterInputClass}
              value={form.opdTiming}
              onChange={(e) => setForm((f) => ({ ...f, opdTiming: e.target.value }))}
              placeholder="Mon–Fri · 09:00–13:00"
            />
          </MasterField>
          <MasterField label="Allocation Status">
            <select
              className={masterInputClass}
              value={form.allocation}
              onChange={(e) =>
                setForm((f) => ({ ...f, allocation: e.target.value as Doctor['allocation'] }))
              }
            >
              <option value="Full">Full</option>
              <option value="Partial">Partial</option>
              <option value="On-Call">On-Call</option>
            </select>
          </MasterField>
          <button type="button" className={`${masterBtnPrimary} w-full justify-center`} onClick={handleOnboard}>
            Register Clinician
          </button>
        </div>
      </MasterSheet>
    </div>
  );
}
