'use client';

import { Cpu, Settings, Wrench } from 'lucide-react';

import type { AssetMasterRecord, BreakdownTicket } from '../lib/assetMockData';
import {
  AMC_RECORDS,
  CALIBRATION_RECORDS,
  PREVENTIVE_MAINTENANCE,
  SPARE_PARTS,
  formatTime,
} from '../lib/assetMockData';
import {
  AmcStatusPill,
  AssetPanel,
  AssetStatusPill,
  BreakdownStatusPill,
  CalibrationPill,
  CategoryPill,
  SecureCompliancePlaceholder,
} from '../components/assetUi';

type MaintenanceCalibrationTabProps = {
  assets: AssetMasterRecord[];
  breakdownTickets: BreakdownTicket[];
  onCycleAssetStatus: (id: string) => void;
  onAdvanceBreakdown: (id: string) => void;
  onOpenAssetDetail: (asset: AssetMasterRecord) => void;
};

export default function MaintenanceCalibrationTab({
  assets,
  breakdownTickets,
  onCycleAssetStatus,
  onAdvanceBreakdown,
  onOpenAssetDetail,
}: MaintenanceCalibrationTabProps) {
  return (
    <div className="grid grid-cols-1 gap-2 xl:grid-cols-2">
      <AssetPanel title="Central Asset Master Register" subtitle="Medical equipment · infrastructure · IT · QR/RFID tags" icon={Cpu}>
        <SecureCompliancePlaceholder verified />
        <table className="mt-2 w-full min-w-[480px] text-left">
          <thead>
            <tr className="border-b border-slate-100 bg-[#F8FAFC]">
              {['Tag', 'Name', 'Category', 'Serial', 'QR/RFID', 'Status', 'Dept'].map((h) => (
                <th key={h} className="px-1.5 py-1 text-[8px] font-bold uppercase text-slate-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {assets.map((a) => (
              <tr key={a.id} className={`border-b border-slate-50 ${a.status === 'Recall' || a.status === 'Breakdown' ? 'bg-red-50/30' : 'hover:bg-slate-50/80'}`}>
                <td className="px-1.5 py-1">
                  <button type="button" onClick={() => onOpenAssetDetail(a)} className="font-mono text-[8px] font-bold text-[#2563EB] hover:underline">{a.assetTag}</button>
                </td>
                <td className="max-w-[100px] truncate px-1.5 py-1 text-[9px] font-semibold">{a.name}</td>
                <td className="px-1.5 py-1"><CategoryPill category={a.category} /></td>
                <td className="px-1.5 py-1 text-[7px] italic text-slate-500">{a.serialRef}</td>
                <td className="px-1.5 py-1 font-mono text-[7px] text-violet-600">{a.qrRfidTag}</td>
                <td className="px-1.5 py-1">
                  <button type="button" onClick={() => onCycleAssetStatus(a.id)} title="Cycle status">
                    <AssetStatusPill status={a.status} />
                  </button>
                </td>
                <td className="px-1.5 py-1 text-[8px]">{a.department}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </AssetPanel>

      <div className="space-y-2">
        <AssetPanel title="Preventive Maintenance Matrix" subtitle="Monthly · Quarterly · Yearly routines" icon={Settings}>
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-[#F8FAFC]">
                {['Asset', 'Routine', 'Last', 'Next Due', 'Engineer', 'Status'].map((h) => (
                  <th key={h} className="px-1.5 py-1 text-[8px] font-bold uppercase text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PREVENTIVE_MAINTENANCE.map((pm) => (
                <tr key={pm.id} className={`border-b border-slate-50 ${pm.status === 'Overdue' ? 'bg-amber-50/40' : ''}`}>
                  <td className="px-1.5 py-1">
                    <p className="text-[8px] font-semibold">{pm.assetName}</p>
                    <p className="font-mono text-[7px] text-slate-500">{pm.assetTag}</p>
                  </td>
                  <td className="px-1.5 py-1 text-[8px] font-bold text-[#2563EB]">{pm.routine}</td>
                  <td className="px-1.5 py-1 text-[8px]">{pm.lastCompleted}</td>
                  <td className="px-1.5 py-1 text-[8px] font-semibold text-amber-700">{pm.nextDue}</td>
                  <td className="px-1.5 py-1 text-[8px] text-slate-600">{pm.assignedEngineer}</td>
                  <td className="px-1.5 py-1">
                    <span className={`rounded px-1 text-[7px] font-bold uppercase ${pm.status === 'Overdue' ? 'bg-red-100 text-red-800' : pm.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-sky-100 text-sky-800'}`}>{pm.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </AssetPanel>

        <AssetPanel title="Corrective Breakdown Tickets" subtitle="Downtime tracking · engineer assignment" icon={Wrench} critical>
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-[#F8FAFC]">
                {['Ticket', 'Asset', 'Issue', 'Status', 'Downtime', 'Assigned', 'Opened'].map((h) => (
                  <th key={h} className="px-1.5 py-1 text-[8px] font-bold uppercase text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {breakdownTickets.map((t) => (
                <tr key={t.id} className="border-b border-slate-50 hover:bg-slate-50/80">
                  <td className="px-1.5 py-1 font-mono text-[8px] font-bold text-red-600">{t.id}</td>
                  <td className="px-1.5 py-1 text-[8px] font-semibold">{t.assetName}</td>
                  <td className="max-w-[120px] truncate px-1.5 py-1 text-[8px] text-slate-600">{t.issue}</td>
                  <td className="px-1.5 py-1">
                    <button type="button" onClick={() => onAdvanceBreakdown(t.id)} disabled={t.status === 'Resolved'} title="Advance ticket">
                      <BreakdownStatusPill status={t.status} />
                    </button>
                  </td>
                  <td className="px-1.5 py-1 text-[9px] font-bold tabular-nums text-red-600">{t.downtimeHours}h</td>
                  <td className="px-1.5 py-1 text-[8px]">{t.assignedTo}</td>
                  <td className="px-1.5 py-1 text-[8px] text-slate-500">{formatTime(t.openedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </AssetPanel>

        <AssetPanel title="AMC Service Level Agreements" subtitle="Response · resolution SLA · contract status" icon={Settings}>
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-[#F8FAFC]">
                {['Asset', 'Vendor', 'Resp SLA', 'Res SLA', 'Contract End', 'Status'].map((h) => (
                  <th key={h} className="px-1.5 py-1 text-[8px] font-bold uppercase text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {AMC_RECORDS.map((a) => (
                <tr key={a.id} className={`border-b border-slate-50 ${a.status !== 'Active' ? 'bg-amber-50/30' : ''}`}>
                  <td className="px-1.5 py-1 font-mono text-[8px]">{a.assetTag}</td>
                  <td className="px-1.5 py-1 text-[8px]">{a.vendor}</td>
                  <td className="px-1.5 py-1 text-[8px] tabular-nums">{a.slaResponseHrs}h</td>
                  <td className="px-1.5 py-1 text-[8px] tabular-nums">{a.slaResolutionHrs}h</td>
                  <td className="px-1.5 py-1 text-[8px]">{a.contractEnd}</td>
                  <td className="px-1.5 py-1"><AmcStatusPill status={a.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </AssetPanel>

        <AssetPanel title="Equipment Calibration Register" subtitle="Lab machines · ECGs · monitors · regulatory due dates" icon={Cpu} secure>
          <SecureCompliancePlaceholder verified />
          <table className="mt-2 w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-[#F8FAFC]">
                {['Equipment', 'Regulatory', 'Last Cal.', 'Due', 'Status'].map((h) => (
                  <th key={h} className="px-1.5 py-1 text-[8px] font-bold uppercase text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {CALIBRATION_RECORDS.map((c) => (
                <tr key={c.id} className={`border-b border-slate-50 ${c.status === 'Expired' ? 'bg-red-50/40' : c.status === 'Due Soon' ? 'bg-amber-50/30' : ''}`}>
                  <td className="px-1.5 py-1 text-[8px] font-semibold">{c.equipment}</td>
                  <td className="px-1.5 py-1 text-[7px] text-slate-600">{c.regulatoryBody}</td>
                  <td className="px-1.5 py-1 text-[8px]">{c.lastCalibrated}</td>
                  <td className="px-1.5 py-1 text-[8px] font-semibold">{c.dueDate}</td>
                  <td className="px-1.5 py-1"><CalibrationPill status={c.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </AssetPanel>

        <AssetPanel title="Spare Parts Inventory Reconciliation" subtitle="Linked assets · stock vs reorder levels" icon={Settings}>
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-[#F8FAFC]">
                {['Part Code', 'Description', 'Linked Asset', 'Stock', 'Reorder', 'Last Issued'].map((h) => (
                  <th key={h} className="px-1.5 py-1 text-[8px] font-bold uppercase text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SPARE_PARTS.map((s) => (
                <tr key={s.id} className={`border-b border-slate-50 ${s.stockQty <= s.reorderLevel ? 'bg-amber-50/40' : ''}`}>
                  <td className="px-1.5 py-1 font-mono text-[8px] font-bold text-[#2563EB]">{s.partCode}</td>
                  <td className="max-w-[120px] truncate px-1.5 py-1 text-[8px]">{s.description}</td>
                  <td className="px-1.5 py-1 font-mono text-[7px]">{s.linkedAsset}</td>
                  <td className={`px-1.5 py-1 text-[9px] font-bold tabular-nums ${s.stockQty === 0 ? 'text-red-600' : ''}`}>{s.stockQty}</td>
                  <td className="px-1.5 py-1 text-[8px] tabular-nums">{s.reorderLevel}</td>
                  <td className="px-1.5 py-1 text-[8px] text-slate-500">{s.lastIssued}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </AssetPanel>
      </div>
    </div>
  );
}
