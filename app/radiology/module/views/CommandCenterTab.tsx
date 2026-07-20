'use client';

import { Calendar, ClipboardList, FileCheck, ScanLine, Upload, UserCheck, Zap } from 'lucide-react';

import type { RadiologyModalType } from '../radiologyNav.types';
import type { ImagingOrder } from '../lib/radiologyMockData';
import { RIS_CENSUS, formatTime } from '../lib/radiologyMockData';
import {
  CriticalFindingBanner,
  ModalityPill,
  PriorityBadge,
  RadPanel,
  ReadinessPill,
  ScanStatusPill,
} from '../components/radiologyUi';

type CommandCenterTabProps = {
  lookupQuery: string;
  orders: ImagingOrder[];
  onAdvancePipeline: (id: string) => void;
  onQuickAction: (action: Exclude<RadiologyModalType, null>) => void;
};

export default function CommandCenterTab({ lookupQuery, orders, onAdvancePipeline, onQuickAction }: CommandCenterTabProps) {
  const census = RIS_CENSUS;
  const q = lookupQuery.trim().toLowerCase();
  const criticalCount = orders.filter((o) => o.criticalFinding && o.pipelineStatus !== 'Report Released').length;

  const filtered = q
    ? orders.filter(
        (o) =>
          o.patientName.toLowerCase().includes(q) ||
          o.uhid.toLowerCase().includes(q) ||
          o.orderNumber.toLowerCase().includes(q) ||
          o.studyDescription.toLowerCase().includes(q) ||
          o.modality.toLowerCase().includes(q),
      )
    : orders;

  return (
    <div className="space-y-2">
      <CriticalFindingBanner count={criticalCount} />

      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4 xl:grid-cols-8">
        {[
          { label: "Today's Imaging Orders", value: census.todayImagingOrders, accent: true },
          { label: 'Scheduled Scans', value: census.scheduledScans, warn: true },
          { label: 'Waiting Patients', value: census.waitingPatients, warn: true },
          { label: 'Ongoing Scans', value: census.ongoingScans, purple: true },
          { label: 'Completed Scans', value: census.completedScans, success: true },
          { label: 'Pending Reports', value: census.pendingReports, warn: true },
          { label: 'Critical Findings', value: census.criticalFindings, danger: true, pulse: true },
          { label: 'Equipment Online', value: census.equipmentOnline, success: true },
        ].map((k) => (
          <div
            key={k.label}
            className={`rounded-md border bg-white p-2 ${k.danger ? 'border-red-200 bg-red-50/40' : 'border-[#E2E8F0]'} ${k.pulse ? 'animate-pulse' : ''}`}
          >
            <p
              className={`text-sm font-bold tabular-nums ${k.purple ? 'text-violet-600' : k.success ? 'text-emerald-600' : k.warn ? 'text-amber-600' : k.danger ? 'text-red-600' : k.accent ? 'text-[#2563EB]' : 'text-[#0F172A]'}`}
            >
              {k.value}
            </p>
            <p className="text-[7px] font-bold uppercase tracking-wide text-slate-500">{k.label}</p>
          </div>
        ))}
      </div>

      <RadPanel title="Imaging Order & Scan Queue" subtitle="Modality · priority · machine allocation · patient readiness" icon={ClipboardList}>
        <table className="w-full min-w-[980px] text-left">
          <thead>
            <tr className="border-b border-slate-100 bg-[#F8FAFC]">
              {['Order', 'Patient', 'Study', 'Modality', 'Priority', 'Machine', 'Readiness', 'Pipeline', 'Scheduled', 'Actions'].map((h) => (
                <th key={h} className="px-1.5 py-1 text-[8px] font-bold uppercase text-slate-500">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((o) => (
              <tr
                key={o.id}
                className={`border-b border-slate-50 ${o.criticalFinding ? 'bg-red-50/40' : 'hover:bg-slate-50/80'} ${o.priority === 'STAT Emergency' ? 'ring-1 ring-inset ring-red-100' : ''}`}
              >
                <td className="px-1.5 py-1 font-mono text-[9px] font-bold text-[#2563EB]">{o.orderNumber}</td>
                <td className="px-1.5 py-1">
                  <p className="text-[9px] font-semibold text-[#0F172A]">{o.patientName}</p>
                  <p className="font-mono text-[7px] text-slate-500">{o.uhid}</p>
                </td>
                <td className="max-w-[140px] truncate px-1.5 py-1 text-[8px] text-slate-600" title={o.studyDescription}>
                  {o.studyDescription}
                </td>
                <td className="px-1.5 py-1">
                  <ModalityPill modality={o.modality} />
                </td>
                <td className="px-1.5 py-1">
                  <PriorityBadge priority={o.priority} />
                </td>
                <td className="max-w-[110px] truncate px-1.5 py-1 text-[7px] text-slate-600" title={o.machineAllocation}>
                  {o.machineAllocation}
                </td>
                <td className="px-1.5 py-1">
                  <ReadinessPill status={o.readiness} />
                </td>
                <td className="px-1.5 py-1">
                  <button type="button" onClick={() => onAdvancePipeline(o.id)} title="Advance scan pipeline">
                    <ScanStatusPill status={o.pipelineStatus} />
                  </button>
                </td>
                <td className="px-1.5 py-1 text-[8px] text-slate-500">{formatTime(o.scheduledAt)}</td>
                <td className="px-1.5 py-1">
                  {o.criticalFinding && o.pipelineStatus !== 'Report Released' && (
                    <span className="rounded bg-red-600 px-1 py-0.5 text-[7px] font-bold uppercase text-white animate-pulse">Critical</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </RadPanel>

      <RadPanel title="Quick Actions" icon={Zap} subtitle="Scheduling · check-in · PACS upload · report release">
        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 xl:grid-cols-6">
          {[
            { id: 'schedule-scan' as const, label: 'Schedule Scan', icon: Calendar },
            { id: 'check-in' as const, label: 'Check-In Patient', icon: UserCheck },
            { id: 'assign-tech' as const, label: 'Assign Technician', icon: ScanLine },
            { id: 'upload-images' as const, label: 'Upload Images', icon: Upload },
            { id: 'verify-report' as const, label: 'Verify Report', icon: FileCheck },
            { id: 'release-report' as const, label: 'Release Report', icon: ClipboardList },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => onQuickAction(id)}
              className="inline-flex flex-col items-center gap-1 rounded-md border border-[#E2E8F0] bg-[#F8FAFC] px-2 py-2 text-center hover:border-[#2563EB]/40 hover:bg-blue-50/50"
            >
              <Icon className="h-4 w-4 text-[#2563EB]" />
              <span className="text-[8px] font-bold uppercase text-[#0F172A]">{label}</span>
            </button>
          ))}
        </div>
      </RadPanel>
    </div>
  );
}
