'use client';

import { BarChart3, CalendarClock, Receipt } from 'lucide-react';
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
  CONSULTATION_TIME_ANALYSIS,
  DOCTOR_OPD_REPORT,
  formatInr,
  MOCK_BILLING,
  MOCK_FOLLOWUPS,
  WAITING_TIME_ANALYSIS,
} from '../lib/opdMockData';
import { OpdPanel, StatusPill } from '../components/opdUi';

export default function AccountingAnalyticsTab() {
  return (
    <div className="space-y-3">
      <OpdPanel title="Billing Coordination Grid" subtitle="Consultation · procedures · lab/radiology · outstanding balance" icon={Receipt}>
        <table className="w-full min-w-[800px] text-left">
          <thead>
            <tr className="border-b border-slate-100 bg-[#F8FAFC]">
              {['Visit', 'Patient', 'Consultation', 'Procedures', 'Lab/Rad', 'Outstanding', 'Payment'].map((h) => (
                <th key={h} className="px-2 py-1.5 text-[9px] font-bold uppercase text-slate-500">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MOCK_BILLING.map((b) => (
              <tr key={b.id} className="border-b border-slate-50">
                <td className="px-2 py-1.5">
                  <p className="font-mono text-[9px] font-bold text-[#2563EB]">{b.visitId}</p>
                  <p className="font-mono text-[8px] text-slate-400">{b.uhid}</p>
                </td>
                <td className="px-2 py-1.5 text-[10px] font-semibold text-[#0F172A]">{b.patientName}</td>
                <td className="px-2 py-1.5 text-[10px] tabular-nums">{formatInr(b.consultationCharge)}</td>
                <td className="px-2 py-1.5 text-[10px] tabular-nums">{formatInr(b.procedureFees)}</td>
                <td className="px-2 py-1.5 text-[10px] tabular-nums">{formatInr(b.labRadiologyFees)}</td>
                <td className="px-2 py-1.5 text-[10px] font-bold tabular-nums text-red-600">
                  {b.outstandingBalance > 0 ? formatInr(b.outstandingBalance) : '—'}
                </td>
                <td className="px-2 py-1.5">
                  <StatusPill status={b.paymentStatus} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </OpdPanel>

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-12">
        <OpdPanel title="Patient Follow-Up Log" subtitle="Scheduled reviews and missed appointments" icon={CalendarClock} className="xl:col-span-5">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-[#F8FAFC]">
                {['Patient', 'Doctor', 'Date', 'Reason', 'Status'].map((h) => (
                  <th key={h} className="px-2 py-1.5 text-[9px] font-bold uppercase text-slate-500">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MOCK_FOLLOWUPS.map((f) => (
                <tr key={f.id} className="border-b border-slate-50">
                  <td className="px-2 py-1.5 text-[10px] font-semibold text-[#0F172A]">{f.patientName}</td>
                  <td className="px-2 py-1.5 text-[9px] text-slate-600">{f.doctor}</td>
                  <td className="px-2 py-1.5 text-[9px] text-slate-500">{f.followUpDate}</td>
                  <td className="max-w-[140px] truncate px-2 py-1.5 text-[9px] text-slate-500" title={f.reason}>
                    {f.reason}
                  </td>
                  <td className="px-2 py-1.5">
                    <StatusPill status={f.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </OpdPanel>

        <OpdPanel title="Doctor-wise OPD Report" subtitle="Patients seen · avg consult time · revenue" icon={BarChart3} className="xl:col-span-7">
          <table className="mb-3 w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-[#F8FAFC]">
                {['Doctor', 'Patients', 'Avg Consult (min)', 'Revenue'].map((h) => (
                  <th key={h} className="px-2 py-1.5 text-[9px] font-bold uppercase text-slate-500">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DOCTOR_OPD_REPORT.map((d) => (
                <tr key={d.doctor} className="border-b border-slate-50">
                  <td className="px-2 py-1.5 text-[10px] font-semibold text-[#0F172A]">{d.doctor}</td>
                  <td className="px-2 py-1.5 text-[10px] tabular-nums">{d.patients}</td>
                  <td className="px-2 py-1.5 text-[10px] tabular-nums text-violet-700">{d.avgConsultMin} min</td>
                  <td className="px-2 py-1.5 text-[10px] font-semibold tabular-nums text-emerald-700">{formatInr(d.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </OpdPanel>
      </div>

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
        <OpdPanel title="Consultation Time Analysis" subtitle="Average consult duration by time slot">
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={CONSULTATION_TIME_ANALYSIS} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="slot" tick={{ fontSize: 10, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 10, fill: '#64748B' }} />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 6, border: '1px solid #E2E8F0' }} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Bar dataKey="avgMin" fill="#7C3AED" radius={[4, 4, 0, 0]} name="Avg Minutes" />
                <Bar dataKey="patients" fill="#2563EB" radius={[4, 4, 0, 0]} name="Patients" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </OpdPanel>

        <OpdPanel title="Waiting Time Analysis" subtitle="Hourly average and peak wait times">
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={WAITING_TIME_ANALYSIS} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="hour" tick={{ fontSize: 10, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 10, fill: '#64748B' }} unit="m" />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 6, border: '1px solid #E2E8F0' }} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Line type="monotone" dataKey="avgWait" stroke="#F59E0B" strokeWidth={2} dot={{ r: 3 }} name="Avg Wait (min)" />
                <Line type="monotone" dataKey="peak" stroke="#EF4444" strokeWidth={2} dot={{ r: 3 }} name="Peak Wait (min)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </OpdPanel>
      </div>
    </div>
  );
}
