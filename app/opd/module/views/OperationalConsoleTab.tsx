'use client';

import {
  ArrowDown,
  ArrowUp,
  FileText,
  ListOrdered,
  RotateCcw,
  SkipForward,
  Stethoscope,
  UserCog,
  UserPlus,
  Zap,
} from 'lucide-react';

import type { OpdModalType } from '../opdNav.types';
import type { OpdQueueEntry } from '../lib/opdMockData';
import { formatInr, formatTime, OPD_CENSUS } from '../lib/opdMockData';
import { OpdPanel, PriorityTierBadge, QueueStatusPill } from '../components/opdUi';

type OperationalConsoleTabProps = {
  lookupQuery: string;
  queue: OpdQueueEntry[];
  onQueueChange: (queue: OpdQueueEntry[]) => void;
  onAdvanceStatus: (id: string) => void;
  onQuickAction: (action: Exclude<OpdModalType, null>) => void;
};

export default function OperationalConsoleTab({
  lookupQuery,
  queue,
  onQueueChange,
  onAdvanceStatus,
  onQuickAction,
}: OperationalConsoleTabProps) {
  const census = OPD_CENSUS;
  const q = lookupQuery.trim().toLowerCase();

  const filteredQueue = q
    ? queue.filter(
        (r) =>
          r.patientName.toLowerCase().includes(q) ||
          r.uhid.toLowerCase().includes(q) ||
          r.tokenNumber.toLowerCase().includes(q) ||
          r.assignedDoctor.toLowerCase().includes(q),
      )
    : queue;

  const moveQueue = (id: string, direction: 'up' | 'down') => {
    const index = queue.findIndex((e) => e.id === id);
    if (index === -1) return;
    const next = [...queue];
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    onQueueChange(next);
  };

  const skipPatient = (id: string) => {
    const idx = queue.findIndex((e) => e.id === id);
    if (idx === -1) return;
    const next = [...queue];
    const [item] = next.splice(idx, 1);
    next.push(item);
    onQueueChange(next);
  };

  const recallPatient = (id: string) => {
    const idx = queue.findIndex((e) => e.id === id);
    if (idx === -1) return;
    const next = [...queue];
    const [item] = next.splice(idx, 1);
    next.unshift({ ...item, status: 'Waiting for Consultation', waitMinutes: 0 });
    onQueueChange(next);
  };

  const reassignDoctor = (id: string, doctor: string) => {
    onQueueChange(queue.map((e) => (e.id === id ? { ...e, assignedDoctor: doctor } : e)));
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-8">
        {[
          { label: "Today's OPD Patients", value: census.todayPatients, accent: true },
          { label: 'Waiting Patients', value: census.waiting, warn: true },
          { label: 'In Consultation', value: census.inConsultation, purple: true },
          { label: 'Completed Consultations', value: census.completed, success: true },
          { label: 'No-show Patients', value: census.noShow, danger: true },
          { label: 'Avg Waiting Time', value: `${census.avgWaitMinutes}m`, warn: true },
          { label: 'Doctor Utilization', value: `${census.doctorUtilizationPercent}%`, accent: true },
          { label: 'OPD Revenue', value: formatInr(census.opdRevenue), success: true },
        ].map((k) => (
          <div
            key={k.label}
            className={`rounded-md border bg-white p-2.5 ${k.danger ? 'border-red-200 bg-red-50/30' : 'border-[#E2E8F0]'}`}
          >
            <p
              className={`text-lg font-bold tabular-nums ${
                k.accent
                  ? 'text-[#2563EB]'
                  : k.success
                    ? 'text-emerald-600'
                    : k.warn
                      ? 'text-amber-600'
                      : k.purple
                        ? 'text-violet-600'
                        : k.danger
                          ? 'text-red-600'
                          : 'text-[#0F172A]'
              }`}
            >
              {k.value}
            </p>
            <p className="mt-1 text-[8px] font-bold uppercase tracking-wide text-slate-500">{k.label}</p>
          </div>
        ))}
      </div>

      <OpdPanel
        title="Live Token Stream"
        subtitle="Real-time OPD queue — priority tiers · rooms · status"
        icon={ListOrdered}
        headerRight={
          <span className="rounded bg-violet-100 px-1.5 py-0.5 text-[9px] font-bold text-violet-800">
            {filteredQueue.filter((r) => r.status === 'Consultation in Progress').length} active consults
          </span>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-[#F8FAFC]">
                {['Token', 'Patient', 'Priority', 'Room', 'Doctor', 'Check-in', 'Wait', 'Status', 'Controls'].map((h) => (
                  <th key={h} className="px-2 py-1.5 text-[9px] font-bold uppercase text-slate-500">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredQueue.map((entry) => (
                <tr key={entry.id} className="border-b border-slate-50 hover:bg-slate-50/80">
                  <td className="px-2 py-1.5 font-mono text-[10px] font-bold text-[#2563EB]">{entry.tokenNumber}</td>
                  <td className="px-2 py-1.5">
                    <p className="text-[10px] font-semibold text-[#0F172A]">{entry.patientName}</p>
                    <p className="font-mono text-[8px] text-slate-500">{entry.uhid}</p>
                  </td>
                  <td className="px-2 py-1.5">
                    <PriorityTierBadge tier={entry.priority} />
                  </td>
                  <td className="px-2 py-1.5 text-[9px] text-slate-600">{entry.consultationRoom}</td>
                  <td className="px-2 py-1.5">
                    <select
                      value={entry.assignedDoctor}
                      onChange={(e) => reassignDoctor(entry.id, e.target.value)}
                      className="max-w-[130px] rounded border border-[#E2E8F0] bg-white px-1 py-0.5 text-[9px]"
                    >
                      <option value="Dr. Rajesh Kumar">Dr. Rajesh Kumar</option>
                      <option value="Dr. Meera Iyer">Dr. Meera Iyer</option>
                      <option value="Dr. Anita Roy">Dr. Anita Roy</option>
                      <option value="Dr. Kapoor">Dr. Kapoor</option>
                      <option value="Dr. B. Joseph">Dr. B. Joseph</option>
                    </select>
                  </td>
                  <td className="px-2 py-1.5 text-[9px] text-slate-500">{formatTime(entry.checkInTime)}</td>
                  <td className="px-2 py-1.5 text-[10px] tabular-nums text-amber-700">
                    {entry.status === 'Waiting for Consultation' ? `${entry.waitMinutes}m` : '—'}
                  </td>
                  <td className="px-2 py-1.5">
                    <button type="button" onClick={() => onAdvanceStatus(entry.id)} title="Advance status">
                      <QueueStatusPill status={entry.status} />
                    </button>
                  </td>
                  <td className="px-2 py-1.5">
                    <div className="flex flex-wrap gap-0.5">
                      <button
                        type="button"
                        onClick={() => moveQueue(entry.id, 'up')}
                        className="rounded border border-[#E2E8F0] p-0.5 hover:bg-slate-100"
                        title="Move up"
                      >
                        <ArrowUp className="h-3 w-3 text-slate-500" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveQueue(entry.id, 'down')}
                        className="rounded border border-[#E2E8F0] p-0.5 hover:bg-slate-100"
                        title="Move down"
                      >
                        <ArrowDown className="h-3 w-3 text-slate-500" />
                      </button>
                      <button
                        type="button"
                        onClick={() => skipPatient(entry.id)}
                        className="rounded border border-[#E2E8F0] p-0.5 hover:bg-amber-50"
                        title="Skip patient"
                      >
                        <SkipForward className="h-3 w-3 text-amber-600" />
                      </button>
                      <button
                        type="button"
                        onClick={() => recallPatient(entry.id)}
                        className="rounded border border-[#E2E8F0] p-0.5 hover:bg-blue-50"
                        title="Recall patient"
                      >
                        <RotateCcw className="h-3 w-3 text-[#2563EB]" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </OpdPanel>

      <OpdPanel title="Quick Actions" icon={Zap} subtitle="Front desk operational shortcuts">
        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 xl:grid-cols-6">
          {[
            { id: 'check-in' as const, label: 'Check-in Patient', icon: UserPlus },
            { id: 'generate-token' as const, label: 'Generate Token', icon: ListOrdered },
            { id: 'assign-doctor' as const, label: 'Assign Doctor', icon: UserCog },
            { id: 'refer-patient' as const, label: 'Refer Patient', icon: Stethoscope },
            { id: 'recommend-admission' as const, label: 'Recommend Admission', icon: ArrowUp },
            { id: 'print-slip' as const, label: 'Print OPD Slip', icon: FileText },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => onQuickAction(id)}
              className="inline-flex flex-col items-center gap-1 rounded-md border border-[#E2E8F0] bg-[#F8FAFC] px-2 py-2.5 text-center hover:border-[#2563EB]/40 hover:bg-blue-50/50"
            >
              <Icon className="h-4 w-4 text-[#2563EB]" />
              <span className="text-[9px] font-semibold text-[#0F172A]">{label}</span>
            </button>
          ))}
        </div>
      </OpdPanel>
    </div>
  );
}
