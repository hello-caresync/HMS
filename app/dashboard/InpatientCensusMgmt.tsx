'use client';

import { useMemo, useState } from 'react';
import { Activity, Clock, Users } from 'lucide-react';

import {
  MasterDataTable,
  MasterPanel,
  MasterSearchBar,
  MasterViewHeader,
} from './_masterLightUi';

type ClinicalFlag = 'Stable' | 'Critical' | 'Observation' | 'Post-Op';

type InpatientRow = {
  uhid: string;
  name: string;
  ward: string;
  admitDate: string;
  losDays: number;
  status: ClinicalFlag;
  nurseShift: string;
};

const SEED_CENSUS: InpatientRow[] = [
  {
    uhid: 'NX-2026-000412',
    name: 'Rahul Sharma',
    ward: 'ICU-A',
    admitDate: '2026-07-14',
    losDays: 2,
    status: 'Critical',
    nurseShift: 'Anitha Raj · Day',
  },
  {
    uhid: 'NX-2026-000413',
    name: 'Priya Patel',
    ward: 'General-3',
    admitDate: '2026-07-12',
    losDays: 4,
    status: 'Stable',
    nurseShift: 'Kavitha M. · Night',
  },
  {
    uhid: 'NX-2026-000415',
    name: 'Meera Krishnan',
    ward: 'Deluxe-2',
    admitDate: '2026-07-10',
    losDays: 6,
    status: 'Post-Op',
    nurseShift: 'Sneha P. · Day',
  },
  {
    uhid: 'NX-2026-000420',
    name: 'Arjun Das',
    ward: 'General-1',
    admitDate: '2026-07-16',
    losDays: 0,
    status: 'Observation',
    nurseShift: 'Unassigned',
  },
];

function statusBadge(status: ClinicalFlag) {
  const styles = {
    Stable: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    Critical: 'bg-rose-50 text-rose-700 ring-rose-200',
    Observation: 'bg-amber-50 text-amber-700 ring-amber-200',
    'Post-Op': 'bg-blue-50 text-blue-700 ring-blue-200',
  }[status];
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ring-1 ${styles}`}>
      {status}
    </span>
  );
}

export default function InpatientCensusMgmt() {
  const [search, setSearch] = useState('');

  const filtered = useMemo(
    () =>
      SEED_CENSUS.filter(
        (p) =>
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          p.uhid.toLowerCase().includes(search.toLowerCase()) ||
          p.ward.toLowerCase().includes(search.toLowerCase()),
      ),
    [search],
  );

  const avgLos =
    filtered.length > 0
      ? (filtered.reduce((s, p) => s + p.losDays, 0) / filtered.length).toFixed(1)
      : '0';

  return (
    <div className="space-y-6">
      <MasterViewHeader
        title="Inpatient Census Management"
        subtitle="Active ledger with length-of-stay metrics, clinical flags, and nursing assignments."
        icon={Users}
      />

      <MasterSearchBar value={search} onChange={setSearch} placeholder="Search census by name, UHID, ward…" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Daily Census</p>
          <p className="mt-1 text-2xl font-bold text-slate-800">{filtered.length}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Avg LoS (days)</p>
          <p className="mt-1 flex items-center gap-1 text-2xl font-bold text-blue-600">
            <Clock className="h-5 w-5" />
            {avgLos}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Critical Flags</p>
          <p className="mt-1 flex items-center gap-1 text-2xl font-bold text-rose-600">
            <Activity className="h-5 w-5" />
            {filtered.filter((p) => p.status === 'Critical').length}
          </p>
        </div>
      </div>

      <MasterPanel title="Active Inpatient Ledger" description="Real-time clinical status and shift coverage">
        <MasterDataTable
          columns={['UHID', 'Patient', 'Ward', 'Admitted', 'LoS', 'Clinical Status', 'Nursing Shift']}
          rows={filtered.map((p) => [
            <span key="u" className="font-mono text-blue-600">
              {p.uhid}
            </span>,
            <span key="n" className="font-semibold text-slate-800">
              {p.name}
            </span>,
            p.ward,
            p.admitDate,
            `${p.losDays}d`,
            statusBadge(p.status),
            p.nurseShift,
          ])}
        />
      </MasterPanel>
    </div>
  );
}
