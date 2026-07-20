'use client';

import type { ApprovalStageName } from '../procurementNav.types';
import type { ProcurementModalType } from '../procurementNav.types';
import type { PurchaseRequest } from '../lib/procurementMockData';
import { MOCK_ACTIVE_POS, PROCUREMENT_CENSUS, formatInr } from '../lib/procurementMockData';
import {
  ApprovalPill,
  BudgetAlertBanner,
  DeliveryPill,
  PaymentPill,
  PriorityBadge,
  PrStatusPill,
  ProcPanel,
  StockPill,
} from '../components/procurementUi';
import { ClipboardList, FileText, ShoppingCart, Zap } from 'lucide-react';

const APPROVAL_STAGES: ApprovalStageName[] = ['Department Head', 'Inventory Manager', 'Finance', 'Admin'];

type P2PCommandCenterTabProps = {
  lookupQuery: string;
  requests: PurchaseRequest[];
  onAdvancePr: (id: string) => void;
  onApproveStage: (id: string, stage: ApprovalStageName) => void;
  onQuickAction: (action: Exclude<ProcurementModalType, null>) => void;
};

export default function P2PCommandCenterTab({
  lookupQuery,
  requests,
  onAdvancePr,
  onApproveStage,
  onQuickAction,
}: P2PCommandCenterTabProps) {
  const census = PROCUREMENT_CENSUS;
  const q = lookupQuery.trim().toLowerCase();

  const filtered = q
    ? requests.filter(
        (r) =>
          r.prNumber.toLowerCase().includes(q) ||
          r.department.toLowerCase().includes(q) ||
          r.items.toLowerCase().includes(q) ||
          r.budgetLine.toLowerCase().includes(q),
      )
    : requests;

  return (
    <div className="space-y-2">
      <BudgetAlertBanner utilizationPct={census.budgetUtilizationPct} />

      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4 xl:grid-cols-8">
        {[
          { label: 'Total Purchase Value', value: formatInr(census.totalPurchaseValue), accent: true },
          { label: 'Monthly Spending', value: formatInr(census.monthlySpending), accent: true },
          { label: 'Pending Requests', value: census.pendingRequests, warn: true },
          { label: 'Pending Approvals', value: census.pendingApprovals, warn: true },
          { label: 'Active POs', value: census.activePos, purple: true },
          { label: 'Pending Deliveries', value: census.pendingDeliveries, warn: true },
          { label: 'Delayed Deliveries', value: census.delayedDeliveries, danger: true, pulse: true },
          { label: 'Payments Due', value: formatInr(census.vendorPaymentsDue), warn: true },
        ].map((k) => (
          <div key={k.label} className={`rounded-md border bg-white p-2 ${k.danger ? 'border-red-200 bg-red-50/40' : 'border-[#E2E8F0]'} ${k.pulse ? 'animate-pulse' : ''}`}>
            <p className={`text-sm font-bold tabular-nums ${k.purple ? 'text-violet-600' : k.warn ? 'text-amber-600' : k.danger ? 'text-red-600' : k.accent ? 'text-[#2563EB]' : 'text-[#0F172A]'}`}>{k.value}</p>
            <p className="text-[7px] font-bold uppercase tracking-wide text-slate-500">{k.label}</p>
          </div>
        ))}
      </div>

      <div className="rounded-md border border-[#E2E8F0] bg-white p-2">
        <div className="mb-1 flex items-center justify-between">
          <p className="text-[9px] font-bold uppercase text-[#0F172A]">Budget Utilization — FY26 Procurement Cap</p>
          <span className={`text-[10px] font-bold tabular-nums ${census.budgetUtilizationPct >= 90 ? 'text-red-600' : 'text-[#2563EB]'}`}>{census.budgetUtilizationPct}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
          <div className={`h-full rounded-full ${census.budgetUtilizationPct >= 90 ? 'bg-red-500' : 'bg-[#2563EB]'}`} style={{ width: `${census.budgetUtilizationPct}%` }} />
        </div>
        <p className="mt-1 text-[8px] text-slate-500">{formatInr(census.budgetConsumed)} consumed of {formatInr(census.budgetAllocated)} allocated</p>
      </div>

      <ProcPanel title="Purchase Requests (PR) Queue" subtitle="ICU · OT · ER · Pharmacy · priority · stock · required date" icon={ClipboardList}>
        <table className="w-full min-w-[980px] text-left">
          <thead>
            <tr className="border-b border-slate-100 bg-[#F8FAFC]">
              {['PR #', 'Dept', 'Items', 'Priority', 'Required', 'Stock', 'Value', 'Budget', 'Status', 'Approvals', ''].map((h) => (
                <th key={h} className="px-1.5 py-1 text-[8px] font-bold uppercase text-slate-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id} className={`border-b border-slate-50 ${r.overBudget ? 'bg-red-50/30' : ''} ${r.priority === 'Emergency' ? 'ring-1 ring-inset ring-red-100' : ''}`}>
                <td className="px-1.5 py-1 font-mono text-[9px] font-bold text-[#2563EB]">{r.prNumber}</td>
                <td className="px-1.5 py-1 text-[9px] font-semibold">{r.department}</td>
                <td className="max-w-[120px] truncate px-1.5 py-1 text-[8px] text-slate-600" title={r.items}>{r.items}</td>
                <td className="px-1.5 py-1"><PriorityBadge priority={r.priority} /></td>
                <td className="px-1.5 py-1 text-[8px] text-slate-500">{r.requiredDate}</td>
                <td className="px-1.5 py-1"><StockPill status={r.stockAvailability} /></td>
                <td className={`px-1.5 py-1 text-[9px] font-bold tabular-nums ${r.overBudget ? 'text-red-600' : ''}`}>{formatInr(r.estimatedValue)}</td>
                <td className="max-w-[80px] truncate px-1.5 py-1 text-[7px] text-slate-500" title={r.budgetLine}>{r.budgetLine}</td>
                <td className="px-1.5 py-1">
                  <button type="button" onClick={() => onAdvancePr(r.id)} disabled={r.status === 'Completed'} title="Advance P2P lifecycle">
                    <PrStatusPill status={r.status} />
                  </button>
                </td>
                <td className="px-1.5 py-1">
                  <div className="flex flex-wrap gap-0.5">
                    {APPROVAL_STAGES.map((stage) => (
                      <button key={stage} type="button" onClick={() => onApproveStage(r.id, stage)} disabled={r.approvals[stage] === 'Approved'} title={stage}>
                        <ApprovalPill status={r.approvals[stage]} />
                      </button>
                    ))}
                  </div>
                </td>
                <td className="px-1.5 py-1">{r.overBudget && <span className="rounded bg-red-600 px-1 py-0.5 text-[7px] font-bold uppercase text-white">Over</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </ProcPanel>

      <ProcPanel title="Active POs — Delivery & Payment Tracking" subtitle="On track · delayed · payment due status" icon={ShoppingCart}>
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-100 bg-[#F8FAFC]">
              {['PO #', 'PR Ref', 'Vendor', 'Value', 'Delivery', 'Expected', 'Payment'].map((h) => (
                <th key={h} className="px-1.5 py-1 text-[8px] font-bold uppercase text-slate-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MOCK_ACTIVE_POS.map((po) => (
              <tr key={po.id} className={`border-b border-slate-50 ${po.deliveryStatus === 'Delayed' ? 'bg-red-50/40' : ''}`}>
                <td className="px-1.5 py-1 font-mono text-[8px] font-bold text-[#2563EB]">{po.poNumber}</td>
                <td className="px-1.5 py-1 font-mono text-[7px] text-slate-500">{po.prReference}</td>
                <td className="max-w-[100px] truncate px-1.5 py-1 text-[8px] text-slate-600" title={po.vendor}>{po.vendor}</td>
                <td className="px-1.5 py-1 text-[9px] font-bold tabular-nums">{formatInr(po.value)}</td>
                <td className="px-1.5 py-1"><DeliveryPill status={po.deliveryStatus} /></td>
                <td className="px-1.5 py-1 text-[8px] text-slate-500">{po.expectedDelivery}</td>
                <td className="px-1.5 py-1"><PaymentPill status={po.paymentStatus} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </ProcPanel>

      <ProcPanel title="Quick Actions" icon={Zap} subtitle="PR · PO · RFQ · invoice · emergency purchase">
        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 xl:grid-cols-5">
          {[
            { id: 'create-pr' as const, label: 'Create PR', icon: FileText },
            { id: 'generate-po' as const, label: 'Generate PO', icon: ShoppingCart },
            { id: 'process-rfq' as const, label: 'Process RFQ', icon: ClipboardList },
            { id: 'upload-invoice' as const, label: 'Upload Invoice', icon: FileText },
            { id: 'emergency-purchase' as const, label: 'Emergency Purchase', icon: Zap, danger: true },
          ].map(({ id, label, icon: Icon, danger }) => (
            <button key={id} type="button" onClick={() => onQuickAction(id)} className={`inline-flex flex-col items-center gap-1 rounded-md border px-2 py-2 text-center hover:border-[#2563EB]/40 ${danger ? 'border-red-300 bg-red-50 hover:bg-red-100' : 'border-[#E2E8F0] bg-[#F8FAFC] hover:bg-blue-50/50'}`}>
              <Icon className={`h-4 w-4 ${danger ? 'text-red-600' : 'text-[#2563EB]'}`} />
              <span className="text-[8px] font-bold uppercase text-[#0F172A]">{label}</span>
            </button>
          ))}
        </div>
      </ProcPanel>
    </div>
  );
}
