'use client';

import { useState } from 'react';
import { History } from 'lucide-react';

import { MOCK_TIMELINE } from '../lib/patientsMockData';
import { PatientPanel } from '../components/patientsUi';
import PatientTimelineView from './PatientTimelineView';

const VISIT_SUMMARY = [
  { date: '2026-07-14', type: 'IPD', dept: 'Cardiology', provider: 'Dr. Anita Roy', summary: 'Admitted for ACS workup — telemetry monitoring' },
  { date: '2026-07-10', type: 'OPD', dept: 'Cardiology', provider: 'Dr. Anita Roy', summary: 'Echo + stress test — LVEF 48%' },
  { date: '2026-06-22', type: 'OPD', dept: 'General Medicine', provider: 'Dr. Rajesh Kumar', summary: 'Diabetes follow-up — HbA1c 7.8%' },
  { date: '2026-03-08', type: 'Emergency', dept: 'Emergency Medicine', provider: 'Dr. B. Joseph', summary: 'Hypertensive urgency — stabilized and discharged' },
];

export default function MedicalVisitHistoryView() {
  const [tab, setTab] = useState<'visits' | 'timeline'>('timeline');

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-sm font-bold text-[#0F172A]">Medical &amp; Visit History</h2>
          <p className="text-[10px] text-slate-500">Aggregated OPD · IPD · Emergency encounters</p>
        </div>
        <div className="flex rounded-md border border-slate-200 bg-slate-50 p-0.5">
          {(
            [
              ['timeline', 'Patient Timeline'],
              ['visits', 'Visit Summary'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              aria-selected={tab === id}
              className={`rounded px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
                tab === id ? 'bg-[#0F172A] text-white' : 'text-slate-600 hover:bg-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'timeline' ? (
        <PatientTimelineView events={MOCK_TIMELINE} compact />
      ) : (
        <PatientPanel title="Visit Summary Table" icon={History}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left">
              <thead>
                <tr className="border-b border-slate-100">
                  {['Date', 'Type', 'Department', 'Provider', 'Summary'].map((h) => (
                    <th key={h} className="pb-1.5 pr-2 text-[9px] font-bold uppercase tracking-wider text-slate-400">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {VISIT_SUMMARY.map((v) => (
                  <tr key={v.date + v.type} className="border-b border-slate-50">
                    <td className="py-1.5 pr-2 text-[10px] font-mono text-slate-600">{v.date}</td>
                    <td className="py-1.5 pr-2">
                      <span className="rounded bg-slate-100 px-1.5 py-px text-[9px] font-bold text-[#0F172A]">{v.type}</span>
                    </td>
                    <td className="py-1.5 pr-2 text-[10px] text-slate-600">{v.dept}</td>
                    <td className="py-1.5 pr-2 text-[10px] text-[#2563EB]">{v.provider}</td>
                    <td className="py-1.5 text-[10px] text-slate-600">{v.summary}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </PatientPanel>
      )}
    </div>
  );
}
