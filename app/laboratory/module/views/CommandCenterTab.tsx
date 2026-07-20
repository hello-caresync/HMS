'use client';

import { Barcode, ClipboardList, Droplets, FileCheck, FlaskConical, Printer, Zap } from 'lucide-react';

import type { LaboratoryModalType } from '../laboratoryNav.types';
import type { SampleOrder } from '../lib/laboratoryMockData';
import { LIMS_CENSUS, formatInr, formatTime } from '../lib/laboratoryMockData';
import {
  BarcodePill,
  CollectionPill,
  CriticalAlertBanner,
  LabPanel,
  PipelineStatusPill,
  PriorityBadge,
} from '../components/laboratoryUi';

type CommandCenterTabProps = {
  lookupQuery: string;
  orders: SampleOrder[];
  onAdvancePipeline: (id: string) => void;
  onToggleRecollection: (id: string) => void;
  onQuickAction: (action: Exclude<LaboratoryModalType, null>) => void;
};

export default function CommandCenterTab({
  lookupQuery,
  orders,
  onAdvancePipeline,
  onToggleRecollection,
  onQuickAction,
}: CommandCenterTabProps) {
  const census = LIMS_CENSUS;
  const q = lookupQuery.trim().toLowerCase();
  const criticalCount = orders.filter((o) => o.criticalResult && o.pipelineStatus !== 'Report Released').length;

  const filtered = q
    ? orders.filter(
        (o) =>
          o.patientName.toLowerCase().includes(q) ||
          o.uhid.toLowerCase().includes(q) ||
          o.orderNumber.toLowerCase().includes(q) ||
          o.testPanel.toLowerCase().includes(q),
      )
    : orders;

  return (
    <div className="space-y-2">
      <CriticalAlertBanner count={criticalCount} />

      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 xl:grid-cols-9">
        {[
          { label: "Today's Test Orders", value: census.todayTestOrders },
          { label: 'Pending Samples', value: census.pendingSamples, warn: true },
          { label: 'Samples Collected', value: census.samplesCollected, accent: true },
          { label: 'In Process', value: census.samplesInProcess, purple: true },
          { label: 'Completed Tests', value: census.completedTests, success: true },
          { label: 'Critical Results', value: census.criticalResults, danger: true, pulse: true },
          { label: 'Delayed Reports', value: census.delayedReports, warn: true },
          { label: 'Lab Revenue', value: formatInr(census.laboratoryRevenue), accent: true },
          { label: 'Active Equipment', value: census.activeEquipment, success: true },
        ].map((k) => (
          <div key={k.label} className={`rounded-md border bg-white p-2 ${k.danger ? 'border-red-200 bg-red-50/40' : 'border-[#E2E8F0]'} ${k.pulse ? 'animate-pulse' : ''}`}>
            <p className={`text-sm font-bold tabular-nums ${k.purple ? 'text-violet-600' : k.success ? 'text-emerald-600' : k.warn ? 'text-amber-600' : k.danger ? 'text-red-600' : k.accent ? 'text-[#2563EB]' : 'text-[#0F172A]'}`}>
              {k.value}
            </p>
            <p className="text-[7px] font-bold uppercase tracking-wide text-slate-500">{k.label}</p>
          </div>
        ))}
      </div>

      <LabPanel title="Test Order & Sample Collection Queue" subtitle="Priority · barcode · collection · pipeline status" icon={ClipboardList}>
        <table className="w-full min-w-[920px] text-left">
          <thead>
            <tr className="border-b border-slate-100 bg-[#F8FAFC]">
              {['Order', 'Patient', 'Test Panel', 'Priority', 'Barcode', 'Collection', 'Pipeline', 'Ordered', 'Actions'].map((h) => (
                <th key={h} className="px-1.5 py-1 text-[8px] font-bold uppercase text-slate-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((o) => (
              <tr key={o.id} className={`border-b border-slate-50 ${o.criticalResult ? 'bg-red-50/40' : 'hover:bg-slate-50/80'} ${o.priority === 'STAT Emergency' ? 'ring-1 ring-inset ring-red-100' : ''}`}>
                <td className="px-1.5 py-1 font-mono text-[9px] font-bold text-[#2563EB]">{o.orderNumber}</td>
                <td className="px-1.5 py-1">
                  <p className="text-[9px] font-semibold text-[#0F172A]">{o.patientName}</p>
                  <p className="font-mono text-[7px] text-slate-500">{o.uhid}</p>
                </td>
                <td className="max-w-[120px] truncate px-1.5 py-1 text-[8px] text-slate-600" title={o.testPanel}>{o.testPanel}</td>
                <td className="px-1.5 py-1"><PriorityBadge priority={o.priority} /></td>
                <td className="px-1.5 py-1"><BarcodePill status={o.barcodeStatus} /></td>
                <td className="px-1.5 py-1"><CollectionPill status={o.collectionStatus} /></td>
                <td className="px-1.5 py-1">
                  <button type="button" onClick={() => onAdvancePipeline(o.id)} title="Advance pipeline">
                    <PipelineStatusPill status={o.pipelineStatus} />
                  </button>
                </td>
                <td className="px-1.5 py-1 text-[8px] text-slate-500">{formatTime(o.orderedAt)}</td>
                <td className="px-1.5 py-1">
                  <div className="flex flex-wrap gap-0.5">
                    <button type="button" onClick={() => onQuickAction('print-barcode')} className="rounded border border-[#E2E8F0] p-0.5 hover:bg-slate-100" title="Print barcode"><Printer className="h-3 w-3 text-slate-500" /></button>
                    <button type="button" onClick={() => onToggleRecollection(o.id)} className="rounded border border-orange-200 bg-orange-50 px-1 py-0.5 text-[7px] font-bold text-orange-800">Recollect</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </LabPanel>

      <LabPanel title="Quick Actions" icon={Zap} subtitle="Sample intake · verification · critical escalation">
        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 xl:grid-cols-6">
          {[
            { id: 'collect-sample' as const, label: 'Collect Sample', icon: Droplets },
            { id: 'print-barcode' as const, label: 'Print Barcode', icon: Barcode },
            { id: 'assign-test' as const, label: 'Assign Test', icon: FlaskConical },
            { id: 'verify-result' as const, label: 'Verify Result', icon: FileCheck },
            { id: 'release-report' as const, label: 'Release Report', icon: ClipboardList },
            { id: 'report-critical' as const, label: 'Report Critical Value', icon: Zap, danger: true },
          ].map(({ id, label, icon: Icon, danger }) => (
            <button key={id} type="button" onClick={() => onQuickAction(id)} className={`inline-flex flex-col items-center gap-1 rounded-md border px-2 py-2 text-center hover:border-[#2563EB]/40 ${danger ? 'border-red-300 bg-red-50 hover:bg-red-100' : 'border-[#E2E8F0] bg-[#F8FAFC] hover:bg-blue-50/50'}`}>
              <Icon className={`h-4 w-4 ${danger ? 'text-red-600' : 'text-[#2563EB]'}`} />
              <span className={`text-[8px] font-semibold ${danger ? 'text-red-800' : 'text-[#0F172A]'}`}>{label}</span>
            </button>
          ))}
        </div>
      </LabPanel>
    </div>
  );
}
