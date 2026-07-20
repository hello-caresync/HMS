'use client';

import { BarChart3, MessageSquare, RefreshCw, Share2 } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import {
  CONSULTATION_TIMELINE,
  DOCTOR_UTILIZATION,
  MOCK_CANCELLATIONS,
  MOCK_REFERRALS,
  MOCK_REMINDER_LOGS,
  PEAK_HOUR_DATA,
} from '../lib/appointmentsMockData';
import { AptPanel, StatusPill } from '../components/appointmentsUi';

export default function LifecycleOutcomesTab() {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
        <AptPanel title="Reschedule & Cancellation Hub" icon={RefreshCw} subtitle="Reasons · auto-reschedule · refund tracking">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-left">
              <thead>
                <tr className="border-b border-slate-100">
                  {['Patient', 'Doctor', 'Original Slot', 'Reason', 'Refund', 'Suggested Reschedule'].map((h) => (
                    <th key={h} className="pb-1.5 pr-2 text-[9px] font-bold uppercase text-slate-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MOCK_CANCELLATIONS.map((c) => (
                  <tr key={c.id} className="border-b border-slate-50">
                    <td className="py-1.5 pr-2 text-[10px] font-semibold text-[#0F172A]">{c.patientName}</td>
                    <td className="py-1.5 pr-2 text-[10px] text-slate-600">{c.doctorName}</td>
                    <td className="py-1.5 pr-2 font-mono text-[9px] text-slate-500">{c.originalSlot}</td>
                    <td className="py-1.5 pr-2 text-[10px] text-slate-600">{c.reason}</td>
                    <td className="py-1.5 pr-2"><StatusPill status={c.refundStatus} /></td>
                    <td className="py-1.5 text-[9px] text-[#2563EB]">{c.suggestedReschedule ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button type="button" className="mt-2 rounded-md border border-[#2563EB]/30 bg-blue-50 px-2.5 py-1 text-[10px] font-semibold text-[#2563EB]">
            Run auto-reschedule suggestions for pending cancellations
          </button>
        </AptPanel>

        <AptPanel title="Referrals Tracking" icon={Share2} subtitle="Internal / external referral documents">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100">
                {['Patient', 'From → To', 'Referred To', 'Status', 'Document'].map((h) => (
                  <th key={h} className="pb-1.5 pr-2 text-[9px] font-bold uppercase text-slate-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MOCK_REFERRALS.map((r) => (
                <tr key={r.id} className="border-b border-slate-50">
                  <td className="py-1.5 pr-2 text-[10px] font-semibold text-[#0F172A]">{r.patientName}</td>
                  <td className="py-1.5 pr-2 text-[9px] text-slate-600">{r.fromDept} → {r.toDept}</td>
                  <td className="py-1.5 pr-2 text-[10px] text-[#2563EB]">{r.referredTo}</td>
                  <td className="py-1.5 pr-2"><StatusPill status={r.status} /></td>
                  <td className="py-1.5 text-[9px] text-slate-500">{r.documentStatus}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </AptPanel>
      </div>

      <AptPanel title="Clinical Communication Feed" icon={MessageSquare} subtitle="SMS · WhatsApp · Email reminder audit">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-100">
              {['Channel', 'Patient', 'Subject', 'Sent', 'Delivery'].map((h) => (
                <th key={h} className="pb-1.5 pr-2 text-[9px] font-bold uppercase text-slate-400">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MOCK_REMINDER_LOGS.map((log) => (
              <tr key={log.id} className="border-b border-slate-50">
                <td className="py-1.5 pr-2 text-[10px] font-bold text-[#0F172A]">{log.channel}</td>
                <td className="py-1.5 pr-2 text-[10px] text-slate-600">{log.patientName}</td>
                <td className="py-1.5 pr-2 text-[10px] text-slate-600">{log.subject}</td>
                <td className="py-1.5 pr-2 font-mono text-[8px] text-slate-400">{log.sentAt.slice(0, 16).replace('T', ' ')}</td>
                <td className="py-1.5"><StatusPill status={log.deliveryStatus} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </AptPanel>

      <AptPanel title="Historical Analytics" icon={BarChart3} subtitle="Doctor utilization · peak hours · consultation duration">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          <div className="h-[160px]">
            <p className="mb-1 text-[9px] font-bold uppercase text-slate-400">Doctor-wise Utilization (%)</p>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={DOCTOR_UTILIZATION} layout="vertical" margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 8, fill: '#64748B' }} />
                <YAxis type="category" dataKey="doctor" width={72} tick={{ fontSize: 7, fill: '#64748B' }} />
                <Tooltip contentStyle={{ fontSize: 10 }} />
                <Bar dataKey="utilization" fill="#0F172A" radius={[0, 2, 2, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="h-[160px]">
            <p className="mb-1 text-[9px] font-bold uppercase text-slate-400">Peak Hour Analysis</p>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={PEAK_HOUR_DATA} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis dataKey="hour" tick={{ fontSize: 8, fill: '#64748B' }} tickFormatter={(h) => `${h}:00`} />
                <YAxis tick={{ fontSize: 8, fill: '#64748B' }} />
                <Tooltip contentStyle={{ fontSize: 10 }} />
                <Bar dataKey="volume" fill="#2563EB" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="h-[160px]">
            <p className="mb-1 text-[9px] font-bold uppercase text-slate-400">Avg Consultation Duration (min)</p>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={CONSULTATION_TIMELINE} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 8, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 8, fill: '#64748B' }} domain={[10, 30]} />
                <Tooltip contentStyle={{ fontSize: 10 }} />
                <Line type="monotone" dataKey="avgMinutes" stroke="#0F172A" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </AptPanel>
    </div>
  );
}
