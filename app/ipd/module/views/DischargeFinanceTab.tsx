'use client';

import { BarChart3, CheckCircle2, Receipt, ShieldCheck } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import type { DischargeClearance } from '../lib/ipdMockData';
import {
  formatInr,
  ICU_CAPACITY_CURVE,
  MOCK_BILLING,
  READMISSION_RATES,
  WARD_UTILIZATION_TREND,
} from '../lib/ipdMockData';
import { ClearanceStatusPill, IpdPanel, SecureIdentityPlaceholder, StatusPill } from '../components/ipdUi';

type DischargeFinanceTabProps = {
  clearances: DischargeClearance[];
  onAdvanceClearanceStep: (clearanceId: string, stepIndex: number) => void;
};

export default function DischargeFinanceTab({ clearances, onAdvanceClearanceStep }: DischargeFinanceTabProps) {
  return (
    <div className="space-y-3">
      <IpdPanel title="Billing Coordination Grid" subtitle="Room · nursing · procedure fees · insurance validation" icon={Receipt}>
        <SecureIdentityPlaceholder verified />
        <table className="mt-2 w-full min-w-[760px] text-left">
          <thead>
            <tr className="border-b border-slate-100 bg-[#F8FAFC]">
              {['Ledger', 'Patient', 'Ward', 'Room', 'Nursing', 'Procedures', 'Running Total', 'Insurance'].map((h) => (
                <th key={h} className="px-2 py-1 text-[8px] font-bold uppercase text-slate-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MOCK_BILLING.map((b) => (
              <tr key={b.id} className="border-b border-slate-50">
                <td className="px-2 py-1 font-mono text-[9px] font-bold text-[#2563EB]">{b.id}</td>
                <td className="px-2 py-1">
                  <p className="text-[10px] font-semibold text-[#0F172A]">{b.patientName}</p>
                  <p className="font-mono text-[8px] text-slate-500">{b.uhid}</p>
                </td>
                <td className="px-2 py-1 text-[9px] text-slate-600">{b.ward}</td>
                <td className="px-2 py-1 text-[10px] tabular-nums">{formatInr(b.roomCharges)}</td>
                <td className="px-2 py-1 text-[10px] tabular-nums">{formatInr(b.nursingCharges)}</td>
                <td className="px-2 py-1 text-[10px] tabular-nums">{formatInr(b.procedureFees)}</td>
                <td className="px-2 py-1 text-[10px] font-bold tabular-nums text-[#0F172A]">{formatInr(b.runningTotal)}</td>
                <td className="px-2 py-1"><StatusPill status={b.insuranceValidation} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </IpdPanel>

      <IpdPanel
        title="Multi-Department Discharge Clearance Matrix"
        subtitle="Medical · nursing · pharmacy · billing · final bill — click status to advance"
        icon={ShieldCheck}
      >
        <div className="space-y-2">
          {clearances.map((dc) => (
            <div
              key={dc.id}
              className={`rounded-md border p-2.5 ${dc.bedReleaseReady ? 'border-emerald-200 bg-emerald-50/30' : 'border-[#E2E8F0]'}`}
            >
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-[11px] font-bold text-[#0F172A]">{dc.patientName}</p>
                  <p className="font-mono text-[9px] text-[#2563EB]">
                    {dc.uhid} · {dc.ward} · {dc.bed}
                  </p>
                </div>
                {dc.bedReleaseReady ? (
                  <span className="inline-flex items-center gap-1 rounded bg-emerald-100 px-2 py-0.5 text-[9px] font-bold text-emerald-800">
                    <CheckCircle2 className="h-3 w-3" />
                    Bed Release Ready
                  </span>
                ) : (
                  <span className="rounded bg-amber-100 px-2 py-0.5 text-[9px] font-bold text-amber-800">Clearance In Progress</span>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {dc.steps.map((step, idx) => (
                  <button
                    key={step.name}
                    type="button"
                    onClick={() => onAdvanceClearanceStep(dc.id, idx)}
                    disabled={step.status === 'Blocked'}
                    className={`min-w-[110px] flex-1 rounded border px-2 py-1.5 text-left ${
                      step.status === 'Cleared'
                        ? 'border-emerald-200 bg-emerald-50/50'
                        : step.status === 'Blocked'
                          ? 'border-red-200 bg-red-50/50 opacity-75'
                          : 'border-amber-200 bg-amber-50/30 hover:border-[#2563EB]/40'
                    }`}
                  >
                    <p className="text-[8px] font-bold text-[#0F172A]">
                      {idx + 1}. {step.name}
                    </p>
                    <p className="text-[7px] text-slate-500">{step.owner}</p>
                    <ClearanceStatusPill status={step.status} />
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </IpdPanel>

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-12">
        <OpdAnalyticsPanel className="xl:col-span-8" />
        <IpdPanel title="Readmission Rates" icon={BarChart3} className="xl:col-span-4">
          <ul className="space-y-2">
            {READMISSION_RATES.map((r) => (
              <li key={r.period} className="flex items-center justify-between rounded border border-[#E2E8F0] bg-[#F8FAFC] px-2 py-1.5">
                <span className="text-[10px] font-semibold text-[#0F172A]">{r.period}</span>
                <span className={`text-sm font-bold tabular-nums ${r.rate > 4 ? 'text-red-600' : 'text-amber-600'}`}>{r.rate}%</span>
              </li>
            ))}
          </ul>
        </IpdPanel>
      </div>
    </div>
  );
}

function OpdAnalyticsPanel({ className }: { className?: string }) {
  return (
    <IpdPanel title="Census Reports & Analytics" subtitle="Ward utilization · ICU capacity curves" icon={BarChart3} className={className}>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <div className="h-40">
          <p className="mb-1 text-[8px] font-bold uppercase text-slate-500">Ward Utilization Trend (%)</p>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={WARD_UTILIZATION_TREND} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="day" tick={{ fontSize: 9, fill: '#64748B' }} />
              <YAxis tick={{ fontSize: 9, fill: '#64748B' }} domain={[40, 100]} />
              <Tooltip contentStyle={{ fontSize: 10, borderRadius: 6, border: '1px solid #E2E8F0' }} />
              <Legend wrapperStyle={{ fontSize: 9 }} />
              <Line type="monotone" dataKey="general" stroke="#2563EB" strokeWidth={2} dot={{ r: 2 }} name="General" />
              <Line type="monotone" dataKey="icu" stroke="#EF4444" strokeWidth={2} dot={{ r: 2 }} name="ICU" />
              <Line type="monotone" dataKey="private" stroke="#7C3AED" strokeWidth={2} dot={{ r: 2 }} name="Private" />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="h-40">
          <p className="mb-1 text-[8px] font-bold uppercase text-slate-500">ICU Capacity Curve</p>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={ICU_CAPACITY_CURVE} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="hour" tick={{ fontSize: 9, fill: '#64748B' }} />
              <YAxis tick={{ fontSize: 9, fill: '#64748B' }} />
              <Tooltip contentStyle={{ fontSize: 10, borderRadius: 6, border: '1px solid #E2E8F0' }} />
              <Legend wrapperStyle={{ fontSize: 9 }} />
              <Bar dataKey="occupied" fill="#EF4444" radius={[3, 3, 0, 0]} name="Occupied" />
              <Bar dataKey="capacity" fill="#E2E8F0" radius={[3, 3, 0, 0]} name="Capacity" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </IpdPanel>
  );
}
