'use client';

import { AlertTriangle, ClipboardList, MessageSquare, ShoppingCart, Truck, UserPlus, Zap } from 'lucide-react';

import type { VendorCoordinationModalType } from '../vendorCoordinationNav.types';
import type { PoCoordinationRecord, VendorOnboardingRequest } from '../lib/vendorCoordinationMockData';
import { MOCK_COMPLAINTS, VRM_CENSUS, formatTime } from '../lib/vendorCoordinationMockData';
import {
  CategoryPill,
  ComplaintPill,
  FulfillmentPill,
  OnboardingPhasePill,
  PoCoordPill,
  SecureSupplierPlaceholder,
  VrmPanel,
} from '../components/vendorCoordinationUi';

type VrmCommandCenterTabProps = {
  lookupQuery: string;
  onboarding: VendorOnboardingRequest[];
  poRecords: PoCoordinationRecord[];
  onAdvanceOnboarding: (id: string) => void;
  onAdvanceFulfillment: (id: string) => void;
  onOpenVendorDrawer: (vendorName: string, category: string, rating: number) => void;
  onQuickAction: (action: Exclude<VendorCoordinationModalType, null>) => void;
};

export default function VrmCommandCenterTab({
  lookupQuery,
  onboarding,
  poRecords,
  onAdvanceOnboarding,
  onAdvanceFulfillment,
  onOpenVendorDrawer,
  onQuickAction,
}: VrmCommandCenterTabProps) {
  const census = VRM_CENSUS;
  const q = lookupQuery.trim().toLowerCase();

  const filtered = q
    ? onboarding.filter(
        (v) =>
          v.vendorName.toLowerCase().includes(q) ||
          v.requestId.toLowerCase().includes(q) ||
          v.category.toLowerCase().includes(q) ||
          v.contactPerson.toLowerCase().includes(q),
      )
    : onboarding;

  return (
    <div className="space-y-2">
      {census.delayedDeliveries > 0 && (
        <div className="flex items-center gap-2 rounded-md border-2 border-red-500 bg-red-600 px-3 py-1.5 text-white animate-pulse">
          <AlertTriangle className="h-4 w-4" />
          <span className="text-[10px] font-bold uppercase">{census.delayedDeliveries} Delayed Deliveries — Vendor escalation required</span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 xl:grid-cols-9">
        {[
          { label: 'Active Vendors', value: census.totalActiveVendors, success: true },
          { label: 'New Requests', value: census.newRequests, accent: true },
          { label: 'Pending Approvals', value: census.pendingApprovals, warn: true },
          { label: 'Active POs', value: census.activePos, purple: true },
          { label: 'Pending Responses', value: census.pendingVendorResponses, warn: true },
          { label: 'Delayed Deliveries', value: census.delayedDeliveries, danger: true, pulse: true },
          { label: 'Pending Invoices', value: census.pendingInvoicesPayments, warn: true },
          { label: 'Complaints', value: census.vendorComplaints, danger: true },
          { label: 'Avg Performance', value: census.averagePerformanceScore.toFixed(1), accent: true },
        ].map((k) => (
          <div key={k.label} className={`rounded-md border bg-white p-2 ${k.danger ? 'border-red-200 bg-red-50/40' : 'border-[#E2E8F0]'} ${k.pulse ? 'animate-pulse' : ''}`}>
            <p className={`text-sm font-bold tabular-nums ${k.purple ? 'text-violet-600' : k.success ? 'text-emerald-600' : k.warn ? 'text-amber-600' : k.danger ? 'text-red-600' : k.accent ? 'text-[#2563EB]' : 'text-[#0F172A]'}`}>{k.value}</p>
            <p className="text-[7px] font-bold uppercase tracking-wide text-slate-500">{k.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-2 xl:grid-cols-2">
        <VrmPanel title="Vendor Registration & Onboarding Pipeline" subtitle="Registration → document verification → quality review → activated" icon={UserPlus}>
          <SecureSupplierPlaceholder verified />
          <table className="mt-2 w-full min-w-[520px] text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-[#F8FAFC]">
                {['Request', 'Vendor', 'Category', 'Contact', 'Phase', 'Docs', 'Quality', 'Action'].map((h) => (
                  <th key={h} className="px-1.5 py-1 text-[8px] font-bold uppercase text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((v) => (
                <tr key={v.id} className="border-b border-slate-50 hover:bg-slate-50/80">
                  <td className="px-1.5 py-1 font-mono text-[8px] font-bold text-[#2563EB]">{v.requestId}</td>
                  <td className="px-1.5 py-1">
                    <button type="button" onClick={() => onOpenVendorDrawer(v.vendorName, v.category, v.performanceScore ?? 4.0)} className="text-[9px] font-semibold text-[#2563EB] hover:underline">
                      {v.vendorName}
                    </button>
                  </td>
                  <td className="px-1.5 py-1"><CategoryPill category={v.category} /></td>
                  <td className="px-1.5 py-1 text-[8px] text-slate-600">{v.contactPerson}</td>
                  <td className="px-1.5 py-1">
                    <button type="button" onClick={() => onAdvanceOnboarding(v.id)} disabled={v.phase === 'Activated'} title="Advance onboarding">
                      <OnboardingPhasePill phase={v.phase} />
                    </button>
                  </td>
                  <td className="px-1.5 py-1 text-[8px] italic text-slate-500">{v.documentsVerified ? '[Verified]' : '[Pending]'}</td>
                  <td className="px-1.5 py-1 text-[8px] font-bold uppercase text-slate-600">{v.qualityReview}</td>
                  <td className="px-1.5 py-1 text-[8px] text-slate-400">{formatTime(v.submittedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </VrmPanel>

        <VrmPanel title="Active PO Coordination Grid" subtitle="Live order updates · quantity confirmations · response clocks" icon={ShoppingCart}>
          <table className="w-full min-w-[520px] text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-[#F8FAFC]">
                {['PO #', 'Vendor', 'Items', 'Status', 'Response', 'Fulfillment', 'Update'].map((h) => (
                  <th key={h} className="px-1.5 py-1 text-[8px] font-bold uppercase text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {poRecords.map((p) => (
                <tr key={p.id} className={`border-b border-slate-50 ${p.status === 'Delayed' ? 'bg-red-50/40' : ''}`}>
                  <td className="px-1.5 py-1 font-mono text-[8px] font-bold text-[#2563EB]">{p.poNumber}</td>
                  <td className="max-w-[90px] truncate px-1.5 py-1 text-[8px] font-semibold" title={p.vendorName}>{p.vendorName}</td>
                  <td className="max-w-[100px] truncate px-1.5 py-1 text-[8px] text-slate-600" title={p.items}>{p.items}</td>
                  <td className="px-1.5 py-1"><PoCoordPill status={p.status} /></td>
                  <td className={`px-1.5 py-1 text-[9px] font-bold tabular-nums ${p.responseTimeHrs > 24 ? 'text-red-600' : 'text-emerald-600'}`}>{p.responseTimeHrs}h</td>
                  <td className="px-1.5 py-1">
                    <button type="button" onClick={() => onAdvanceFulfillment(p.id)} disabled={p.fulfillmentStage === 'Delivered'}>
                      <FulfillmentPill stage={p.fulfillmentStage} />
                    </button>
                  </td>
                  <td className="px-1.5 py-1 text-[8px] text-slate-400">{p.lastUpdate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </VrmPanel>
      </div>

      <VrmPanel title="Open Vendor Complaints" icon={AlertTriangle} critical={MOCK_COMPLAINTS.some((c) => c.status !== 'Resolved')}>
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-100 bg-[#F8FAFC]">
              {['ID', 'Vendor', 'Category', 'Description', 'Status', 'Logged'].map((h) => (
                <th key={h} className="px-1.5 py-1 text-[8px] font-bold uppercase text-slate-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MOCK_COMPLAINTS.map((c) => (
              <tr key={c.id} className={`border-b border-slate-50 ${c.status === 'Open' ? 'bg-red-50/30' : ''}`}>
                <td className="px-1.5 py-1 font-mono text-[8px] text-[#2563EB]">{c.complaintId}</td>
                <td className="px-1.5 py-1 text-[9px] font-semibold">{c.vendorName}</td>
                <td className="px-1.5 py-1 text-[8px] text-slate-600">{c.category}</td>
                <td className="max-w-[160px] truncate px-1.5 py-1 text-[8px] text-slate-500" title={c.description}>{c.description}</td>
                <td className="px-1.5 py-1"><ComplaintPill status={c.status} /></td>
                <td className="px-1.5 py-1 text-[8px] text-slate-400">{c.loggedAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </VrmPanel>

      <VrmPanel title="Quick Actions" icon={Zap} subtitle="Vendor lifecycle · communication · fulfillment">
        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4 xl:grid-cols-7">
          {[
            { id: 'add-vendor' as const, label: 'Add Vendor', icon: UserPlus },
            { id: 'process-approval' as const, label: 'Process Approval', icon: ClipboardList },
            { id: 'open-chat' as const, label: 'Open Chat', icon: MessageSquare },
            { id: 'issue-rfq' as const, label: 'Issue RFQ', icon: ShoppingCart },
            { id: 'dispatch-po' as const, label: 'Dispatch PO', icon: Truck },
            { id: 'track-shipment' as const, label: 'Track Shipment', icon: Truck },
            { id: 'log-complaint' as const, label: 'Log Complaint', icon: AlertTriangle, danger: true },
          ].map(({ id, label, icon: Icon, danger }) => (
            <button key={id} type="button" onClick={() => onQuickAction(id)} className={`inline-flex flex-col items-center gap-1 rounded-md border px-2 py-2 text-center hover:border-[#2563EB]/40 ${danger ? 'border-red-300 bg-red-50 hover:bg-red-100' : 'border-[#E2E8F0] bg-[#F8FAFC] hover:bg-blue-50/50'}`}>
              <Icon className={`h-4 w-4 ${danger ? 'text-red-600' : 'text-[#2563EB]'}`} />
              <span className="text-[8px] font-bold uppercase text-[#0F172A]">{label}</span>
            </button>
          ))}
        </div>
      </VrmPanel>
    </div>
  );
}
