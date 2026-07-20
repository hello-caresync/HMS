'use client';

import {
  Activity,
  Download,
  FileText,
  Printer,
  Share2,
  ShieldCheck,
  Zap,
} from 'lucide-react';

import type { EmrModalType } from '../emrNav.types';
import type { TimelineEvent } from '../lib/emrMockData';
import { EMR_CENSUS, PATIENT_TIMELINE } from '../lib/emrMockData';
import { EmrPanel, SignOffPill, ViewOnlyBadge } from '../components/emrUi';

const TIMELINE_COLORS: Record<string, string> = {
  Registration: 'bg-slate-500',
  Consultation: 'bg-[#2563EB]',
  Laboratory: 'bg-emerald-500',
  Radiology: 'bg-violet-500',
  Procedure: 'bg-orange-500',
  Pharmacy: 'bg-cyan-500',
  'Financial Clearance': 'bg-indigo-500',
};

type CommandCenterTabProps = {
  onQuickAction: (action: Exclude<EmrModalType, null | 'print-full' | 'export-summary'>) => void;
};

export default function CommandCenterTab({ onQuickAction }: CommandCenterTabProps) {
  const census = EMR_CENSUS;

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
        {[
          { label: 'Recent Records Loaded', value: census.recentRecordsLoaded.toLocaleString('en-IN'), accent: true },
          { label: 'Active Records', value: census.activeRecords },
          { label: 'Pending Sign-offs', value: census.pendingSignOffs, warn: true },
          { label: 'Critical Alerts', value: census.criticalAlerts, danger: true },
        ].map((k) => (
          <div key={k.label} className={`rounded-md border bg-white p-2 ${k.danger ? 'border-red-200 bg-red-50/30' : 'border-[#E2E8F0]'}`}>
            <p className={`text-base font-bold tabular-nums ${k.accent ? 'text-[#2563EB]' : k.warn ? 'text-amber-600' : k.danger ? 'text-red-600' : 'text-[#0F172A]'}`}>
              {k.value}
            </p>
            <p className="text-[7px] font-bold uppercase tracking-wide text-slate-500">{k.label}</p>
          </div>
        ))}
      </div>

      <EmrPanel
        title="Comprehensive Patient Timeline"
        subtitle="Registration → consultations → labs → imaging → procedures → pharmacy → financial clearance"
        icon={Activity}
        headerRight={<ViewOnlyBadge compact />}
      >
        <div className="relative pl-4">
          <div className="absolute bottom-2 left-[7px] top-2 w-0.5 bg-[#E2E8F0]" aria-hidden />
          <ul className="space-y-2">
            {PATIENT_TIMELINE.map((event: TimelineEvent) => (
              <li key={event.id} className="relative pl-4">
                <span
                  className={`absolute left-0 top-1.5 h-3.5 w-3.5 rounded-full border-2 border-white ${TIMELINE_COLORS[event.type] ?? 'bg-slate-400'}`}
                />
                <div className="rounded-md border border-[#E2E8F0] bg-[#F8FAFC] px-2 py-1.5">
                  <div className="flex flex-wrap items-start justify-between gap-1">
                    <div>
                      <p className="text-[9px] font-bold uppercase text-slate-400">{event.type}</p>
                      <p className="text-[10px] font-semibold text-[#0F172A]">{event.title}</p>
                    </div>
                    <SignOffPill status={event.status} />
                  </div>
                  <p className="mt-0.5 text-[9px] text-slate-600">{event.detail}</p>
                  <p className="mt-0.5 text-[8px] text-slate-400">
                    {event.timestamp} · {event.provider}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </EmrPanel>

      <EmrPanel title="Quick Actions" icon={Zap} subtitle="Read-only export & verification — no clinical mutation">
        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 xl:grid-cols-5">
          {[
            { id: 'print-record' as const, label: 'Print Medical Record', icon: Printer },
            { id: 'download-audited' as const, label: 'Download Audited EMR', icon: Download },
            { id: 'share-record' as const, label: 'Share Record (Authorized)', icon: Share2 },
            { id: 'verify-documents' as const, label: 'Verify Documents', icon: ShieldCheck },
            { id: 'patient-summary' as const, label: 'Generate Patient Summary', icon: FileText },
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
      </EmrPanel>
    </div>
  );
}
