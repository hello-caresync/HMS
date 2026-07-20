'use client';

import { BarChart3, CheckCircle2, Circle, Receipt, ShieldCheck, XCircle } from 'lucide-react';
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

import {
  ADMISSION_TREND,
  formatInr,
  MOCK_DISCHARGE_PIPELINES,
  MOCK_FINANCE,
  WARD_UTILIZATION,
} from '../lib/admissionsMockData';
import { AdmPanel, SecureIdentityPlaceholder, StatusPill } from '../components/admissionsUi';
import type { DischargeStepStatus } from '../admissionsNav.types';

function StepIcon({ status }: { status: DischargeStepStatus }) {
  if (status === 'Complete') return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />;
  if (status === 'Blocked') return <XCircle className="h-3.5 w-3.5 text-red-600" />;
  return <Circle className="h-3.5 w-3.5 text-amber-500" />;
}

export default function FinancialDischargeTab() {
  const readmissionRate = 1.8;

  return (
    <div className="space-y-3">
      <AdmPanel
        title="Admission Finance & TPA Hub"
        subtitle="Deposits · advance payments · packages · pre-authorization"
        icon={Receipt}
      >
        <div className="mb-2">
          <SecureIdentityPlaceholder verified />
        </div>
        <table className="w-full min-w-[720px] text-left">
          <thead>
            <tr className="border-b border-slate-100 bg-[#F8FAFC]">
              {['Record', 'Patient', 'Package', 'Deposit', 'Advance Paid', 'TPA / Insurance', 'Status'].map((h) => (
                <th key={h} className="px-2 py-1.5 text-[9px] font-bold uppercase text-slate-500">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MOCK_FINANCE.map((f) => (
              <tr key={f.id} className="border-b border-slate-50">
                <td className="px-2 py-1.5 font-mono text-[9px] font-bold text-[#2563EB]">{f.id}</td>
                <td className="px-2 py-1.5">
                  <p className="text-[10px] font-semibold text-[#0F172A]">{f.patientName}</p>
                  <p className="font-mono text-[8px] text-slate-500">{f.uhid}</p>
                </td>
                <td className="px-2 py-1.5 text-[9px] text-slate-600">{f.packageName}</td>
                <td className="px-2 py-1.5 text-[10px] font-semibold tabular-nums">{formatInr(f.depositAmount)}</td>
                <td className="px-2 py-1.5 text-[10px] tabular-nums text-emerald-700">{formatInr(f.advancePaid)}</td>
                <td className="px-2 py-1.5 text-[9px] text-slate-600">{f.tpaName}</td>
                <td className="px-2 py-1.5">
                  <StatusPill status={f.insuranceStatus} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </AdmPanel>

      <AdmPanel
        title="Multi-Department Discharge Clearance Pipeline"
        subtitle="Medical · Nursing · Pharmacy · Billing · Digital Gatepass"
        icon={ShieldCheck}
      >
        <div className="space-y-3">
          {MOCK_DISCHARGE_PIPELINES.map((dp) => (
            <div key={dp.id} className="rounded-md border border-[#E2E8F0] p-3">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-[11px] font-bold text-[#0F172A]">{dp.patientName}</p>
                  <p className="font-mono text-[9px] text-[#2563EB]">
                    {dp.uhid} · {dp.ward}
                  </p>
                </div>
                {dp.gatepassIssued ? (
                  <StatusPill status="Complete" />
                ) : (
                  <span className="rounded bg-amber-100 px-2 py-0.5 text-[9px] font-bold text-amber-800">
                    Gatepass Pending
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {dp.steps.map((step, idx) => (
                  <div
                    key={step.name}
                    className={`flex min-w-[120px] flex-1 items-start gap-1.5 rounded border px-2 py-1.5 ${
                      step.status === 'Complete'
                        ? 'border-emerald-200 bg-emerald-50/50'
                        : step.status === 'Blocked'
                          ? 'border-red-200 bg-red-50/50'
                          : 'border-amber-200 bg-amber-50/30'
                    }`}
                  >
                    <StepIcon status={step.status} />
                    <div>
                      <p className="text-[9px] font-bold text-[#0F172A]">
                        {idx + 1}. {step.name}
                      </p>
                      <p className="text-[8px] text-slate-500">{step.owner}</p>
                      <StatusPill status={step.status} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </AdmPanel>

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-12">
        <AdmPanel
          title="Daily Admission & Discharge Trend"
          subtitle="Last 7 days — admissions vs discharges vs readmissions"
          icon={BarChart3}
          className="xl:col-span-8"
        >
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={ADMISSION_TREND} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 10, fill: '#64748B' }} />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 6, border: '1px solid #E2E8F0' }} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Line type="monotone" dataKey="admissions" stroke="#2563EB" strokeWidth={2} dot={{ r: 3 }} name="Admissions" />
                <Line type="monotone" dataKey="discharges" stroke="#10B981" strokeWidth={2} dot={{ r: 3 }} name="Discharges" />
                <Line type="monotone" dataKey="readmissions" stroke="#F59E0B" strokeWidth={2} dot={{ r: 3 }} name="Readmissions" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </AdmPanel>

        <AdmPanel title="Key Metrics" icon={BarChart3} className="xl:col-span-4">
          <div className="space-y-2">
            <div className="rounded-md border border-[#E2E8F0] bg-[#F8FAFC] p-2.5">
              <p className="text-2xl font-bold text-amber-600">{readmissionRate}%</p>
              <p className="text-[9px] font-bold uppercase text-slate-500">30-Day Readmission Rate</p>
            </div>
            <div className="rounded-md border border-[#E2E8F0] bg-[#F8FAFC] p-2.5">
              <p className="text-2xl font-bold text-[#2563EB]">24</p>
              <p className="text-[9px] font-bold uppercase text-slate-500">Today&apos;s Admissions</p>
            </div>
            <div className="rounded-md border border-[#E2E8F0] bg-[#F8FAFC] p-2.5">
              <p className="text-2xl font-bold text-emerald-600">19</p>
              <p className="text-[9px] font-bold uppercase text-slate-500">Today&apos;s Discharges</p>
            </div>
          </div>
        </AdmPanel>
      </div>

      <AdmPanel title="Ward Utilization Analytics" subtitle="Current occupancy by ward category">
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={WARD_UTILIZATION} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="ward" tick={{ fontSize: 10, fill: '#64748B' }} />
              <YAxis tick={{ fontSize: 10, fill: '#64748B' }} unit="%" domain={[0, 100]} />
              <Tooltip
                formatter={(v: number) => [`${v}%`, 'Utilization']}
                contentStyle={{ fontSize: 11, borderRadius: 6, border: '1px solid #E2E8F0' }}
              />
              <Bar dataKey="utilization" fill="#2563EB" radius={[4, 4, 0, 0]} name="Utilization %" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </AdmPanel>
    </div>
  );
}
