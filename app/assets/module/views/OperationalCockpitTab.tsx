'use client';

import {
  ClipboardList,
  MapPin,
  Package,
  Printer,
  RefreshCw,
  Tag,
  Wrench,
  Zap,
} from 'lucide-react';

import type { AssetModalType } from '../assetNav.types';
import type { AssetLocation, AssetRequest } from '../lib/assetMockData';
import { ASSET_CENSUS, formatInrCr, formatTime } from '../lib/assetMockData';
import {
  AssetPanel,
  AssetStatusPill,
  PriorityPill,
  RecallAlertBanner,
  RequestStagePill,
  SecureCompliancePlaceholder,
} from '../components/assetUi';

type OperationalCockpitTabProps = {
  lookupQuery: string;
  requests: AssetRequest[];
  locations: AssetLocation[];
  onAdvanceRequest: (id: string) => void;
  onCycleLocationStatus: (id: string) => void;
  onOpenAssetDetail: (assetTag: string) => void;
  onQuickAction: (action: Exclude<AssetModalType, null>) => void;
};

export default function OperationalCockpitTab({
  lookupQuery,
  requests,
  locations,
  onAdvanceRequest,
  onCycleLocationStatus,
  onOpenAssetDetail,
  onQuickAction,
}: OperationalCockpitTabProps) {
  const census = ASSET_CENSUS;
  const q = lookupQuery.trim().toLowerCase();
  const recallCount = locations.filter((l) => l.status === 'Recall' || l.status === 'Breakdown').length;

  const filteredRequests = q
    ? requests.filter(
        (r) =>
          r.id.toLowerCase().includes(q) ||
          r.itemDescription.toLowerCase().includes(q) ||
          r.department.toLowerCase().includes(q),
      )
    : requests;

  const filteredLocations = q
    ? locations.filter(
        (l) =>
          l.assetTag.toLowerCase().includes(q) ||
          l.assetName.toLowerCase().includes(q) ||
          l.department.toLowerCase().includes(q),
      )
    : locations;

  return (
    <div className="space-y-2">
      <RecallAlertBanner count={recallCount} />

      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 xl:grid-cols-5 2xl:grid-cols-10">
        {[
          { label: 'Total Assets', value: census.totalAssets.toLocaleString(), accent: true },
          { label: 'Total Value', value: formatInrCr(census.totalAssetValue), accent: true },
          { label: 'Active', value: census.activeAssets.toLocaleString(), success: true },
          { label: 'Under Maint.', value: census.underMaintenance, warn: true },
          { label: 'Damaged/Idle', value: census.damagedIdle, warn: true },
          { label: 'Warranty Exp.', value: census.expiringWarranties, warn: true },
          { label: 'AMC Expiring', value: census.amcExpiringSoon, purple: true },
          { label: 'Calib. Due', value: census.calibrationDue, purple: true },
          { label: 'Pending Req.', value: census.pendingRequests, accent: true },
          { label: 'Disposed', value: census.disposedAssets, muted: true },
        ].map((k) => (
          <div key={k.label} className="rounded-md border border-[#E2E8F0] bg-white p-2">
            <p className={`text-sm font-bold tabular-nums ${k.success ? 'text-emerald-600' : k.warn ? 'text-amber-600' : k.purple ? 'text-violet-600' : k.muted ? 'text-slate-500' : k.accent ? 'text-[#2563EB]' : 'text-[#0F172A]'}`}>{k.value}</p>
            <p className="text-[7px] font-bold uppercase tracking-wide text-slate-500">{k.label}</p>
          </div>
        ))}
      </div>

      <AssetPanel
        title="Asset Requests & Procurement Integration Queue"
        subtitle="Request → Manager Review → Finance → Procurement → Approved"
        icon={ClipboardList}
      >
        <SecureCompliancePlaceholder verified />
        <table className="mt-2 w-full min-w-[920px] text-left">
          <thead>
            <tr className="border-b border-slate-100 bg-[#F8FAFC]">
              {['Request #', 'Department', 'Description', 'Priority', 'Stage', 'Requester', 'Est. Cost', 'Submitted'].map((h) => (
                <th key={h} className="px-1.5 py-1 text-[8px] font-bold uppercase text-slate-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredRequests.map((r) => (
              <tr key={r.id} className={`border-b border-slate-50 ${r.priority === 'Emergency' ? 'bg-red-50/30' : 'hover:bg-slate-50/80'}`}>
                <td className="px-1.5 py-1 font-mono text-[8px] font-bold text-[#2563EB]">{r.id}</td>
                <td className="px-1.5 py-1 text-[9px]">{r.department}</td>
                <td className="max-w-[180px] truncate px-1.5 py-1 text-[8px] text-slate-700" title={r.itemDescription}>{r.itemDescription}</td>
                <td className="px-1.5 py-1"><PriorityPill priority={r.priority} /></td>
                <td className="px-1.5 py-1">
                  <button type="button" onClick={() => onAdvanceRequest(r.id)} disabled={r.stage === 'Approved'} title="Advance approval">
                    <RequestStagePill stage={r.stage} />
                  </button>
                </td>
                <td className="px-1.5 py-1 text-[8px]">{r.requester}</td>
                <td className="px-1.5 py-1 text-[9px] tabular-nums font-semibold">{formatInrCr(r.estimatedCost)}</td>
                <td className="px-1.5 py-1 text-[8px] text-slate-500">{formatTime(r.submittedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </AssetPanel>

      <AssetPanel title="Asset Allocation & Dynamic Location Tracker" subtitle="Building · Floor · Department · Room · Bed" icon={MapPin}>
        <table className="w-full min-w-[920px] text-left">
          <thead>
            <tr className="border-b border-slate-100 bg-[#F8FAFC]">
              {['Tag', 'Asset', 'Building', 'Floor', 'Dept', 'Room', 'Bed', 'Status', 'Moved'].map((h) => (
                <th key={h} className="px-1.5 py-1 text-[8px] font-bold uppercase text-slate-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredLocations.map((l) => (
              <tr key={l.id} className={`border-b border-slate-50 ${l.status === 'Breakdown' || l.status === 'Recall' ? 'bg-red-50/30' : 'hover:bg-slate-50/80'}`}>
                <td className="px-1.5 py-1">
                  <button type="button" onClick={() => onOpenAssetDetail(l.assetTag)} className="font-mono text-[8px] font-bold text-[#2563EB] hover:underline">{l.assetTag}</button>
                </td>
                <td className="px-1.5 py-1 text-[9px] font-semibold">{l.assetName}</td>
                <td className="px-1.5 py-1 text-[8px]">{l.building}</td>
                <td className="px-1.5 py-1 text-[8px]">{l.floor}</td>
                <td className="px-1.5 py-1 text-[8px]">{l.department}</td>
                <td className="px-1.5 py-1 text-[8px]">{l.room}</td>
                <td className="px-1.5 py-1 text-[8px]">{l.bedLocation}</td>
                <td className="px-1.5 py-1">
                  <button type="button" onClick={() => onCycleLocationStatus(l.id)} title="Cycle status">
                    <AssetStatusPill status={l.status} />
                  </button>
                </td>
                <td className="px-1.5 py-1 text-[8px] text-slate-500">{l.lastMovedAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </AssetPanel>

      <AssetPanel title="Quick Actions Matrix" subtitle="Register · assign · breakdown · spare parts · AMC · labels · audit" icon={Zap}>
        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4 lg:grid-cols-7">
          {[
            { label: 'Register Asset', icon: Tag, action: 'register-asset' as const },
            { label: 'Assign Asset', icon: MapPin, action: 'assign-asset' as const },
            { label: 'Log Breakdown', icon: Wrench, action: 'log-breakdown' as const },
            { label: 'Spare Parts', icon: Package, action: 'allocate-spare-parts' as const },
            { label: 'Renew AMC', icon: RefreshCw, action: 'renew-amc' as const },
            { label: 'Print Tags', icon: Printer, action: 'print-tag-labels' as const },
            { label: 'Schedule Audit', icon: ClipboardList, action: 'schedule-audit' as const },
          ].map(({ label, icon: Icon, action }) => (
            <button
              key={action}
              type="button"
              onClick={() => onQuickAction(action)}
              className="flex flex-col items-center gap-1 rounded-md border border-[#E2E8F0] bg-[#F8FAFC] px-2 py-2 transition-colors hover:border-[#2563EB] hover:bg-blue-50"
            >
              <Icon className="h-4 w-4 text-[#2563EB]" />
              <span className="text-[8px] font-bold uppercase text-[#0F172A]">{label}</span>
            </button>
          ))}
        </div>
      </AssetPanel>
    </div>
  );
}
