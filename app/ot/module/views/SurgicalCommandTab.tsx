'use client';

import {
  BedDouble,
  ClipboardCheck,
  Droplets,
  Printer,
  Users,
  Zap,
} from 'lucide-react';

import type { OtModalType } from '../otNav.types';
import type { SurgeryCase } from '../lib/otMockData';
import { OT_CENSUS, formatTime } from '../lib/otMockData';
import { AnesthesiaPill, OtPanel, TimelineStepPill } from '../components/otUi';

type SurgicalCommandTabProps = {
  lookupQuery: string;
  surgeries: SurgeryCase[];
  onAdvanceTimeline: (id: string) => void;
  onQuickAction: (action: Exclude<OtModalType, null>) => void;
};

export default function SurgicalCommandTab({
  lookupQuery,
  surgeries,
  onAdvanceTimeline,
  onQuickAction,
}: SurgicalCommandTabProps) {
  const census = OT_CENSUS;
  const q = lookupQuery.trim().toLowerCase();

  const filtered = q
    ? surgeries.filter(
        (s) =>
          s.patientName.toLowerCase().includes(q) ||
          s.uhid.toLowerCase().includes(q) ||
          s.caseNumber.toLowerCase().includes(q) ||
          s.procedure.toLowerCase().includes(q) ||
          s.scheduledSurgeon.toLowerCase().includes(q),
      )
    : surgeries;

  const activeCases = filtered.filter((s) => !['Completed', 'Cancelled'].includes(s.timelineStep));

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4 xl:grid-cols-8">
        {[
          { label: "Today's Surgeries", value: census.todaySurgeries },
          { label: 'Ongoing', value: census.ongoing, purple: true },
          { label: 'Upcoming', value: census.upcoming, accent: true },
          { label: 'Completed', value: census.completed, success: true },
          { label: 'Delayed', value: census.delayed, warn: true },
          { label: 'Cancelled', value: census.cancelled, danger: true },
          { label: 'Available OT Rooms', value: census.availableRooms, success: true },
          { label: 'OT Utilization', value: `${census.utilizationPercent}%`, accent: true },
        ].map((k) => (
          <div key={k.label} className={`rounded-md border bg-white p-2 ${k.danger ? 'border-red-200' : 'border-[#E2E8F0]'}`}>
            <p className={`text-base font-bold tabular-nums ${k.purple ? 'text-violet-600' : k.success ? 'text-emerald-600' : k.warn ? 'text-amber-600' : k.danger ? 'text-red-600' : k.accent ? 'text-[#2563EB]' : 'text-[#0F172A]'}`}>
              {k.value}
            </p>
            <p className="text-[7px] font-bold uppercase tracking-wide text-slate-500">{k.label}</p>
          </div>
        ))}
      </div>

      <OtPanel
        title="Live Surgery Workflow & Tracking Board"
        subtitle="Timeline steps · anesthesia · emergency OT flags"
        icon={ClipboardCheck}
        headerRight={<span className="text-[8px] font-bold text-violet-700">{activeCases.length} active</span>}
      >
        <table className="w-full min-w-[900px] text-left">
          <thead>
            <tr className="border-b border-slate-100 bg-[#F8FAFC]">
              {['Case', 'Patient', 'Procedure', 'Surgeon', 'OT Room', 'Schedule', 'Anesthesia', 'Timeline Step', 'Advance'].map((h) => (
                <th key={h} className="px-1.5 py-1 text-[8px] font-bold uppercase text-slate-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => (
              <tr
                key={s.id}
                className={`border-b border-slate-50 ${s.emergencyOt ? 'bg-red-50/50' : s.timelineStep === 'In Progress' ? 'bg-violet-50/40' : 'hover:bg-slate-50/80'}`}
              >
                <td className="px-1.5 py-1">
                  <p className="font-mono text-[9px] font-bold text-[#2563EB]">{s.caseNumber}</p>
                  {s.emergencyOt && <span className="text-[7px] font-bold uppercase text-red-600">Emergency OT</span>}
                </td>
                <td className="px-1.5 py-1">
                  <p className="text-[9px] font-semibold text-[#0F172A]">{s.patientName}</p>
                  <p className="font-mono text-[7px] text-slate-500">{s.uhid}</p>
                </td>
                <td className="max-w-[120px] truncate px-1.5 py-1 text-[8px] text-slate-600" title={s.procedure}>{s.procedure}</td>
                <td className="px-1.5 py-1 text-[8px] text-slate-600">{s.scheduledSurgeon}</td>
                <td className="px-1.5 py-1 text-[8px] font-medium text-[#0F172A]">{s.otRoom}</td>
                <td className="px-1.5 py-1 text-[8px] text-slate-500">{formatTime(s.scheduledTime)}</td>
                <td className="px-1.5 py-1"><AnesthesiaPill status={s.anesthesiaClearance} /></td>
                <td className="px-1.5 py-1">
                  <button type="button" onClick={() => onAdvanceTimeline(s.id)} title="Advance timeline">
                    <TimelineStepPill step={s.timelineStep} />
                  </button>
                </td>
                <td className="px-1.5 py-1">
                  {!['Completed', 'Cancelled', 'Delayed'].includes(s.timelineStep) && (
                    <button
                      type="button"
                      onClick={() => onAdvanceTimeline(s.id)}
                      className="rounded bg-[#2563EB] px-1.5 py-0.5 text-[8px] font-bold text-white hover:bg-blue-700"
                    >
                      Next →
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </OtPanel>

      <OtPanel title="Quick Actions" icon={Zap} subtitle="Surgical coordination shortcuts">
        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 xl:grid-cols-6">
          {[
            { id: 'schedule-surgery' as const, label: 'Schedule Surgery', icon: ClipboardCheck },
            { id: 'assign-room' as const, label: 'Assign OT Room', icon: BedDouble },
            { id: 'assign-team' as const, label: 'Assign Surgical Team', icon: Users },
            { id: 'verify-checklist' as const, label: 'Verify Checklist', icon: ClipboardCheck },
            { id: 'request-blood' as const, label: 'Request Blood', icon: Droplets },
            { id: 'print-schedule' as const, label: 'Print OT Schedule', icon: Printer },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => onQuickAction(id)}
              className="inline-flex flex-col items-center gap-1 rounded-md border border-[#E2E8F0] bg-[#F8FAFC] px-2 py-2 text-center hover:border-[#2563EB]/40 hover:bg-blue-50/50"
            >
              <Icon className="h-4 w-4 text-[#2563EB]" />
              <span className="text-[8px] font-semibold text-[#0F172A]">{label}</span>
            </button>
          ))}
        </div>
      </OtPanel>
    </div>
  );
}
