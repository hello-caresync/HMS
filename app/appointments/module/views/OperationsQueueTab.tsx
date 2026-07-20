'use client';

import {
  CalendarCheck,
  Clock,
  Printer,
  Ticket,
  UserCheck,
  Users,
  Zap,
} from 'lucide-react';

import type { AppointmentModalType } from '../appointmentsNav.types';
import {
  APPOINTMENT_CENSUS,
  MOCK_QUEUE,
  MOCK_WAITING_ROOMS,
} from '../lib/appointmentsMockData';
import { AptPanel, PriorityBadge, StatusPill } from '../components/appointmentsUi';

type OperationsQueueTabProps = {
  lookupQuery: string;
  onQuickAction: (action: Exclude<AppointmentModalType, null>) => void;
};

export default function OperationsQueueTab({ lookupQuery, onQuickAction }: OperationsQueueTabProps) {
  const census = APPOINTMENT_CENSUS;
  const q = lookupQuery.trim().toLowerCase();
  const filteredQueue = q
    ? MOCK_QUEUE.filter(
        (e) =>
          e.patientName.toLowerCase().includes(q) ||
          e.uhid.toLowerCase().includes(q) ||
          e.token.toLowerCase().includes(q) ||
          e.doctorName.toLowerCase().includes(q) ||
          e.id.toLowerCase().includes(q),
      )
    : MOCK_QUEUE;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-8">
        {[
          { label: "Today's Appointments", value: census.todayTotal },
          { label: 'Upcoming', value: census.upcoming, accent: true },
          { label: 'Waiting', value: census.waiting, warn: true },
          { label: 'Completed', value: census.completed, success: true },
          { label: 'Cancelled', value: census.cancelled, danger: true },
          { label: 'No-Show', value: census.noShow, danger: true },
          { label: 'Walk-ins', value: census.walkIns },
          { label: 'Avg Wait', value: `${census.avgWaitMinutes}m` },
        ].map((k) => (
          <div key={k.label} className="rounded-md border border-[#E2E8F0] bg-white p-2.5">
            <p
              className={`text-lg font-bold tabular-nums leading-none ${
                k.accent ? 'text-[#2563EB]' : k.warn ? 'text-amber-600' : k.success ? 'text-emerald-600' : k.danger ? 'text-red-600' : 'text-[#0F172A]'
              }`}
            >
              {k.value}
            </p>
            <p className="mt-1 text-[8px] font-bold uppercase tracking-wide text-slate-500">{k.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-12">
        <AptPanel title="Live Queue Status" icon={Users} subtitle="Token · consultation · delay flags" className="xl:col-span-8">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-[#F8FAFC]">
                  {['Token', 'Patient', 'Doctor', 'Room', 'Scheduled', 'Status', 'Priority', 'Token Gen', 'Delay'].map((h) => (
                    <th key={h} className="px-2 py-1.5 text-[9px] font-bold uppercase tracking-wider text-slate-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredQueue.map((row) => (
                  <tr key={row.id} className="border-b border-slate-50 hover:bg-slate-50/80">
                    <td className="px-2 py-1.5 font-mono text-[10px] font-bold text-[#2563EB]">{row.token}</td>
                    <td className="px-2 py-1.5">
                      <p className="text-[10px] font-semibold text-[#0F172A]">{row.patientName}</p>
                      <p className="font-mono text-[8px] text-slate-400">{row.uhid}</p>
                    </td>
                    <td className="px-2 py-1.5 text-[10px] text-slate-600">{row.doctorName}</td>
                    <td className="px-2 py-1.5 text-[9px] text-slate-500">{row.room}</td>
                    <td className="px-2 py-1.5 font-mono text-[9px] text-slate-600">{row.scheduledTime}</td>
                    <td className="px-2 py-1.5"><StatusPill status={row.status} /></td>
                    <td className="px-2 py-1.5"><PriorityBadge priority={row.priority} /></td>
                    <td className="px-2 py-1.5">
                      {row.tokenGenerated ? (
                        <span className="text-[9px] font-semibold text-emerald-600">Yes</span>
                      ) : (
                        <span className="text-[9px] text-amber-600">Pending</span>
                      )}
                    </td>
                    <td className="px-2 py-1.5">
                      {row.delayMinutes > 0 ? (
                        <span className="rounded bg-red-50 px-1 py-px text-[9px] font-bold text-red-700">+{row.delayMinutes}m</span>
                      ) : (
                        <span className="text-[9px] text-slate-400">On time</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AptPanel>

        <AptPanel title="Quick Actions" icon={Zap} className="xl:col-span-4">
          <div className="grid grid-cols-1 gap-1.5">
            {[
              { id: 'book' as const, label: 'Book Appointment', icon: CalendarCheck },
              { id: 'check-in' as const, label: 'Check-in Patient', icon: UserCheck },
              { id: 'generate-token' as const, label: 'Generate Token', icon: Ticket },
              { id: 'print-slip' as const, label: 'Print Appointment Slip', icon: Printer },
              { id: 'doctor-schedule' as const, label: 'View Doctor Schedule', icon: Clock },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => onQuickAction(id)}
                className="inline-flex items-center gap-2 rounded-md border border-[#E2E8F0] bg-[#F8FAFC] px-2.5 py-2 text-left text-[10px] font-semibold text-[#0F172A] hover:border-[#2563EB]/40 hover:bg-blue-50/50"
              >
                <Icon className="h-3.5 w-3.5 text-[#2563EB]" />
                {label}
              </button>
            ))}
          </div>
        </AptPanel>
      </div>

      <AptPanel title="Waiting Room Overview" icon={Users} subtitle="Occupancy · average wait by zone">
        <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
          {MOCK_WAITING_ROOMS.map((wr) => {
            const pct = Math.round((wr.seatsOccupied / wr.seatsTotal) * 100);
            return (
              <div key={wr.id} className="rounded-md border border-[#E2E8F0] p-2.5">
                <p className="text-[10px] font-bold text-[#0F172A]">{wr.waitingArea}</p>
                <p className="mt-1 text-[9px] text-slate-500">{wr.seatsOccupied}/{wr.seatsTotal} seats · avg {wr.avgWaitMinutes}m wait</p>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full ${pct > 80 ? 'bg-red-500' : pct > 60 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </AptPanel>
    </div>
  );
}
