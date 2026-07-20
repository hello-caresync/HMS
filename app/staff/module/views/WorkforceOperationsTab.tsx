'use client';

import { CalendarClock, Clock, CreditCard, KeyRound, Shield, Zap } from 'lucide-react';

import type { StaffModalType } from '../staffNav.types';
import {
  MOCK_ATTENDANCE,
  MOCK_LEAVE_REQUESTS,
  MOCK_SHIFT_ROSTER,
  STAFF_CENSUS,
} from '../lib/staffMockData';
import { StaffPanel, StatusPill } from '../components/staffUi';

type WorkforceOperationsTabProps = {
  lookupQuery: string;
  onQuickAction: (action: Exclude<StaffModalType, null>) => void;
};

export default function WorkforceOperationsTab({ lookupQuery, onQuickAction }: WorkforceOperationsTabProps) {
  const census = STAFF_CENSUS;
  const q = lookupQuery.trim().toLowerCase();

  const filteredRoster = q
    ? MOCK_SHIFT_ROSTER.filter((r) => r.employeeName.toLowerCase().includes(q) || r.department.toLowerCase().includes(q))
    : MOCK_SHIFT_ROSTER;

  const filteredAttendance = q
    ? MOCK_ATTENDANCE.filter((a) => a.employeeName.toLowerCase().includes(q) || a.employeeCode.toLowerCase().includes(q))
    : MOCK_ATTENDANCE;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-7">
        {[
          { label: 'Total Employees', value: census.totalEmployees },
          { label: 'Active', value: census.active, accent: true },
          { label: 'On Duty', value: census.onDuty, success: true },
          { label: 'Off Duty', value: census.offDuty },
          { label: 'On Leave', value: census.onLeave, warn: true },
          { label: 'New Joiners', value: census.newJoiners },
          { label: 'Expiring Licenses', value: census.expiringLicenses, danger: true },
        ].map((k) => (
          <div key={k.label} className={`rounded-md border bg-white p-2.5 ${k.danger ? 'border-red-200 bg-red-50/30' : 'border-[#E2E8F0]'}`}>
            <p className={`text-lg font-bold tabular-nums ${k.accent ? 'text-[#2563EB]' : k.success ? 'text-emerald-600' : k.warn ? 'text-amber-600' : k.danger ? 'text-red-600' : 'text-[#0F172A]'}`}>
              {k.value}
            </p>
            <p className="mt-1 text-[8px] font-bold uppercase tracking-wide text-slate-500">{k.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-12">
        <StaffPanel title="Shift & Duty Roster" icon={CalendarClock} subtitle="Today · weekly · on-call status" className="xl:col-span-6">
          <table className="w-full min-w-[480px] text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-[#F8FAFC]">
                {['Employee', 'Department', 'Shift', 'Schedule', 'On-Call', 'Location'].map((h) => (
                  <th key={h} className="px-2 py-1.5 text-[9px] font-bold uppercase text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredRoster.map((r) => (
                <tr key={r.id} className="border-b border-slate-50">
                  <td className="px-2 py-1.5 text-[10px] font-semibold text-[#0F172A]">{r.employeeName}</td>
                  <td className="px-2 py-1.5 text-[10px] text-slate-600">{r.department}</td>
                  <td className="px-2 py-1.5 text-[10px] text-slate-600">{r.shift}</td>
                  <td className="px-2 py-1.5 text-[9px] text-slate-500">{r.schedule}</td>
                  <td className="px-2 py-1.5">{r.onCall ? <span className="text-[9px] font-bold text-violet-600">On-Call</span> : <span className="text-[9px] text-slate-400">—</span>}</td>
                  <td className="px-2 py-1.5 text-[9px] text-slate-500">{r.roomOrWard}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </StaffPanel>

        <StaffPanel title="Biometric / Manual Attendance" icon={Clock} subtitle="Check-in · late markers · leave pending" className="xl:col-span-6">
          <table className="w-full min-w-[480px] text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-[#F8FAFC]">
                {['Employee', 'Code', 'Check-in', 'Method', 'Late', 'Notes'].map((h) => (
                  <th key={h} className="px-2 py-1.5 text-[9px] font-bold uppercase text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredAttendance.map((a) => (
                <tr key={a.id} className="border-b border-slate-50">
                  <td className="px-2 py-1.5 text-[10px] font-semibold text-[#0F172A]">{a.employeeName}</td>
                  <td className="px-2 py-1.5 font-mono text-[9px] text-[#2563EB]">{a.employeeCode}</td>
                  <td className="px-2 py-1.5 font-mono text-[10px]">{a.checkIn}</td>
                  <td className="px-2 py-1.5 text-[9px] text-slate-500">{a.method}</td>
                  <td className="px-2 py-1.5">
                    {a.lateMinutes > 0 ? <span className="rounded bg-red-50 px-1 text-[9px] font-bold text-red-700">+{a.lateMinutes}m</span> : <span className="text-[9px] text-emerald-600">On time</span>}
                  </td>
                  <td className="px-2 py-1.5 text-[9px] text-amber-700">{a.leavePending ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </StaffPanel>
      </div>

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-12">
        <StaffPanel title="Pending Leave Approvals" icon={Shield} className="xl:col-span-8">
          <ul className="space-y-1">
            {MOCK_LEAVE_REQUESTS.filter((l) => l.status === 'Pending').map((l) => (
              <li key={l.id} className="flex items-center justify-between rounded border border-[#E2E8F0] px-2 py-1.5">
                <span className="text-[10px] text-[#0F172A]"><strong>{l.employeeName}</strong> — {l.type} · {l.from} to {l.to}</span>
                <StatusPill status={l.status} />
              </li>
            ))}
          </ul>
        </StaffPanel>

        <StaffPanel title="Quick Actions" icon={Zap} className="xl:col-span-4">
          <div className="grid grid-cols-1 gap-1.5">
            {[
              { id: 'assign-shift' as const, label: 'Assign Shift', icon: CalendarClock },
              { id: 'approve-leave' as const, label: 'Approve Leave', icon: Shield },
              { id: 'reset-password' as const, label: 'Reset Password', icon: KeyRound },
              { id: 'generate-id' as const, label: 'Generate ID Card', icon: CreditCard },
            ].map(({ id, label, icon: Icon }) => (
              <button key={id} type="button" onClick={() => onQuickAction(id)} className="inline-flex items-center gap-2 rounded-md border border-[#E2E8F0] bg-[#F8FAFC] px-2.5 py-2 text-[10px] font-semibold text-[#0F172A] hover:border-[#2563EB]/40 hover:bg-blue-50/50">
                <Icon className="h-3.5 w-3.5 text-[#2563EB]" />{label}
              </button>
            ))}
          </div>
        </StaffPanel>
      </div>
    </div>
  );
}
