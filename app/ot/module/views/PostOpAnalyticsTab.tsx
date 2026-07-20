'use client';

import { BarChart3, Receipt, Route } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  ComposedChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import {
  CANCELLATION_REPORT,
  DELAY_ANALYSIS,
  MOCK_BILLING,
  MOCK_POSTOP_FLOWS,
  SURGEON_UTILIZATION,
  formatInr,
} from '../lib/otMockData';
import { OtPanel, StatusPill } from '../components/otUi';

export default function PostOpAnalyticsTab() {
  return (
    <div className="space-y-2">
      <OtPanel title="Post-Operative & Discharge Flow Tracker" subtitle="Recovery · ICU transfer · ward handover" icon={Route}>
        <table className="w-full min-w-[680px] text-left">
          <thead>
            <tr className="border-b border-slate-100 bg-[#F8FAFC]">
              {['Patient', 'Procedure', 'Recovery Room', 'ICU Transfer', 'Ward Handover', 'Notes'].map((h) => (
                <th key={h} className="px-1.5 py-1 text-[8px] font-bold uppercase text-slate-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MOCK_POSTOP_FLOWS.map((p) => (
              <tr key={p.id} className="border-b border-slate-50">
                <td className="px-1.5 py-1">
                  <p className="text-[9px] font-semibold text-[#0F172A]">{p.patientName}</p>
                  <p className="font-mono text-[7px] text-slate-500">{p.uhid}</p>
                </td>
                <td className="px-1.5 py-1 text-[8px] text-slate-600">{p.procedure}</td>
                <td className="px-1.5 py-1 text-[8px] font-medium text-indigo-700">{p.recoveryRoom}</td>
                <td className="px-1.5 py-1"><StatusPill status={p.icuTransfer} /></td>
                <td className="px-1.5 py-1"><StatusPill status={p.wardHandover} /></td>
                <td className="max-w-[160px] truncate px-1.5 py-1 text-[8px] text-slate-500" title={p.notes}>{p.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </OtPanel>

      <OtPanel title="OT Accounting Summary" subtitle="Surgery · anesthesia · implant ledger" icon={Receipt}>
        <table className="w-full min-w-[640px] text-left">
          <thead>
            <tr className="border-b border-slate-100 bg-[#F8FAFC]">
              {['Ledger', 'Patient', 'Surgery', 'Anesthesia', 'Implants', 'Total', 'Payment'].map((h) => (
                <th key={h} className="px-1.5 py-1 text-[8px] font-bold uppercase text-slate-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MOCK_BILLING.map((b) => (
              <tr key={b.id} className="border-b border-slate-50">
                <td className="px-1.5 py-1 font-mono text-[8px] font-bold text-[#2563EB]">{b.id}</td>
                <td className="px-1.5 py-1 text-[9px] font-semibold">{b.patientName}</td>
                <td className="px-1.5 py-1 text-[9px] tabular-nums">{formatInr(b.surgeryCharges)}</td>
                <td className="px-1.5 py-1 text-[9px] tabular-nums">{formatInr(b.anesthesiaFees)}</td>
                <td className="px-1.5 py-1 text-[9px] tabular-nums">{formatInr(b.implantLedger)}</td>
                <td className="px-1.5 py-1 text-[9px] font-bold tabular-nums">{formatInr(b.total)}</td>
                <td className="px-1.5 py-1"><StatusPill status={b.paymentStatus} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </OtPanel>

      <div className="grid grid-cols-1 gap-2 xl:grid-cols-3">
        <OtPanel title="OT Delay Analysis" icon={BarChart3}>
          <div className="h-36">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={DELAY_ANALYSIS} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="reason" tick={{ fontSize: 7, fill: '#64748B' }} interval={0} angle={-15} textAnchor="end" height={50} />
                <YAxis tick={{ fontSize: 8, fill: '#64748B' }} />
                <Tooltip contentStyle={{ fontSize: 10, borderRadius: 6, border: '1px solid #E2E8F0' }} />
                <Bar dataKey="count" fill="#F59E0B" radius={[3, 3, 0, 0]} name="Incidents" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </OtPanel>

        <OtPanel title="Cancellation Report" icon={BarChart3}>
          <div className="h-36">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={CANCELLATION_REPORT} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="month" tick={{ fontSize: 8, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 8, fill: '#64748B' }} />
                <Tooltip contentStyle={{ fontSize: 10, borderRadius: 6, border: '1px solid #E2E8F0' }} />
                <Legend wrapperStyle={{ fontSize: 8 }} />
                <Bar dataKey="scheduled" fill="#2563EB" name="Scheduled" />
                <Line type="monotone" dataKey="cancelled" stroke="#EF4444" strokeWidth={2} dot={{ r: 2 }} name="Cancelled" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </OtPanel>

        <OtPanel title="Surgeon-wise Utilization" icon={BarChart3}>
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-[#F8FAFC]">
                {['Surgeon', 'Cases', 'Util %', 'Avg Min'].map((h) => (
                  <th key={h} className="px-1.5 py-1 text-[8px] font-bold uppercase text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SURGEON_UTILIZATION.map((s) => (
                <tr key={s.surgeon} className="border-b border-slate-50">
                  <td className="px-1.5 py-1 text-[9px] font-semibold">{s.surgeon}</td>
                  <td className="px-1.5 py-1 text-[9px] tabular-nums">{s.cases}</td>
                  <td className="px-1.5 py-1 text-[9px] font-bold tabular-nums text-[#2563EB]">{s.utilization}%</td>
                  <td className="px-1.5 py-1 text-[9px] tabular-nums text-violet-700">{s.avgDurationMin}m</td>
                </tr>
              ))}
            </tbody>
          </table>
        </OtPanel>
      </div>
    </div>
  );
}
