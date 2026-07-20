'use client';

import { Activity, UserPlus, Users } from 'lucide-react';

import { MOCK_PATIENTS } from '../lib/patientsMockData';
import { PatientPanel, StatusBadge } from '../components/patientsUi';

export default function PatientsDashboardView() {
  const counts = {
    total: MOCK_PATIENTS.length,
    opd: MOCK_PATIENTS.filter((p) => p.status === 'Outpatient').length,
    ipd: MOCK_PATIENTS.filter((p) => p.status === 'Inpatient').length,
    er: MOCK_PATIENTS.filter((p) => p.status === 'Emergency').length,
  };

  return (
    <div className="space-y-2">
      <div>
        <h2 className="text-sm font-bold text-[#0F172A]">Patients Dashboard</h2>
        <p className="text-[10px] text-slate-500">Front office census · today&apos;s intake overview</p>
      </div>

      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        {[
          { label: 'Indexed Patients', value: counts.total, icon: Users },
          { label: 'Active OPD', value: counts.opd, icon: Activity },
          { label: 'Admitted IPD', value: counts.ipd, icon: Activity },
          { label: 'Emergency Active', value: counts.er, icon: UserPlus },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-md border border-slate-200 bg-white p-3">
            <Icon className="mb-1 h-3.5 w-3.5 text-[#2563EB]" />
            <p className="text-xl font-bold tabular-nums text-[#0F172A]">{value}</p>
            <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
          </div>
        ))}
      </div>

      <PatientPanel title="Recent Registrations" subtitle="Last 24 hours — front desk intake queue">
        <ul className="space-y-1.5">
          {MOCK_PATIENTS.slice(0, 4).map((p) => (
            <li
              key={p.uhid}
              className="flex items-center justify-between rounded-md border border-slate-100 px-2.5 py-1.5"
            >
              <div>
                <p className="text-[11px] font-semibold text-[#0F172A]">{p.name}</p>
                <p className="font-mono text-[9px] text-slate-500">{p.uhid}</p>
              </div>
              <StatusBadge status={p.status} />
            </li>
          ))}
        </ul>
      </PatientPanel>
    </div>
  );
}
