'use client';

import { ClipboardList, Package, ShoppingCart, Truck, Zap } from 'lucide-react';

import type { InventoryModalType } from '../inventoryNav.types';
import type { GrnIntakeRecord, PurchaseRequestOrder } from '../lib/inventoryMockData';
import { INVENTORY_CENSUS, formatInr, formatTime } from '../lib/inventoryMockData';
import { GrnQcPill, InvPanel, PoStatusPill, PriorityBadge, SecureIdentityPlaceholder } from '../components/inventoryUi';

type ProcureToPayTabProps = {
  lookupQuery: string;
  purchaseOrders: PurchaseRequestOrder[];
  grnRecords: GrnIntakeRecord[];
  onAdvancePo: (id: string) => void;
  onQuickAction: (action: Exclude<InventoryModalType, null>) => void;
};

export default function ProcureToPayTab({
  lookupQuery,
  purchaseOrders,
  grnRecords,
  onAdvancePo,
  onQuickAction,
}: ProcureToPayTabProps) {
  const census = INVENTORY_CENSUS;
  const q = lookupQuery.trim().toLowerCase();

  const filtered = q
    ? purchaseOrders.filter(
        (o) =>
          o.prNumber.toLowerCase().includes(q) ||
          o.department.toLowerCase().includes(q) ||
          o.items.toLowerCase().includes(q) ||
          (o.vendor?.toLowerCase().includes(q) ?? false),
      )
    : purchaseOrders;

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 xl:grid-cols-9">
        {[
          { label: 'Total Inventory Value', value: formatInr(census.totalInventoryValue), accent: true },
          { label: 'Total Items Count', value: census.totalItemsCount.toLocaleString('en-IN'), accent: true },
          { label: 'Available Stock', value: census.availableStock.toLocaleString('en-IN'), success: true },
          { label: 'Low Stock Items', value: census.lowStockItems, warn: true },
          { label: 'Expired / Near Expiry', value: census.expiredNearExpiry, danger: true },
          { label: 'Pending PRs', value: census.pendingPurchaseRequests, warn: true },
          { label: 'Pending GRN', value: census.pendingGrn, purple: true },
          { label: "Today's Consumption", value: formatInr(census.todayConsumption), accent: true },
          { label: 'Monthly Consumption', value: formatInr(census.monthlyConsumption), accent: true },
        ].map((k) => (
          <div key={k.label} className={`rounded-md border bg-white p-2 ${k.danger ? 'border-red-200 bg-red-50/40' : 'border-[#E2E8F0]'}`}>
            <p className={`text-sm font-bold tabular-nums ${k.purple ? 'text-violet-600' : k.success ? 'text-emerald-600' : k.warn ? 'text-amber-600' : k.danger ? 'text-red-600' : k.accent ? 'text-[#2563EB]' : 'text-[#0F172A]'}`}>
              {k.value}
            </p>
            <p className="text-[7px] font-bold uppercase tracking-wide text-slate-500">{k.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-2 xl:grid-cols-2">
        <InvPanel title="Active Purchase Requests & Orders Queue" subtitle="Department requisitions · priority · approval workflow" icon={ShoppingCart}>
          <table className="w-full min-w-[520px] text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-[#F8FAFC]">
                {['PR #', 'Dept', 'Items', 'Priority', 'Status', 'Value', 'Time', ''].map((h) => (
                  <th key={h} className="px-1.5 py-1 text-[8px] font-bold uppercase text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => (
                <tr key={o.id} className={`border-b border-slate-50 hover:bg-slate-50/80 ${o.priority === 'Emergency' ? 'bg-red-50/30 ring-1 ring-inset ring-red-100' : ''}`}>
                  <td className="px-1.5 py-1 font-mono text-[9px] font-bold text-[#2563EB]">{o.prNumber}</td>
                  <td className="px-1.5 py-1 text-[9px] font-semibold">{o.department}</td>
                  <td className="max-w-[110px] truncate px-1.5 py-1 text-[8px] text-slate-600" title={o.items}>{o.items}</td>
                  <td className="px-1.5 py-1"><PriorityBadge priority={o.priority} /></td>
                  <td className="px-1.5 py-1">
                    <button type="button" onClick={() => onAdvancePo(o.id)} disabled={o.status === 'PO Issued'} title="Advance PO workflow">
                      <PoStatusPill status={o.status} />
                    </button>
                  </td>
                  <td className="px-1.5 py-1 text-[9px] font-bold tabular-nums">{formatInr(o.value)}</td>
                  <td className="px-1.5 py-1 text-[8px] text-slate-500">{formatTime(o.requestedAt)}</td>
                  <td className="px-1.5 py-1 text-[7px] text-slate-400">{o.vendor ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </InvPanel>

        <InvPanel title="GRN & Inward Intake Console" subtitle="Quantity · batch · expiry · QC validation" icon={Truck}>
          <SecureIdentityPlaceholder verified />
          <table className="mt-2 w-full min-w-[520px] text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-[#F8FAFC]">
                {['GRN #', 'PO Ref', 'Item', 'Ord/Recv', 'Batch', 'Expiry', 'QC'].map((h) => (
                  <th key={h} className="px-1.5 py-1 text-[8px] font-bold uppercase text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {grnRecords.map((g) => (
                <tr key={g.id} className={`border-b border-slate-50 ${g.qcStatus === 'QC Failed' ? 'bg-red-50/50' : g.qcStatus === 'Pending QC' ? 'bg-amber-50/30' : ''}`}>
                  <td className="px-1.5 py-1 font-mono text-[8px] font-bold text-[#2563EB]">{g.grnNumber}</td>
                  <td className="px-1.5 py-1 font-mono text-[7px] text-slate-500">{g.poReference}</td>
                  <td className="max-w-[90px] truncate px-1.5 py-1 text-[8px] text-slate-600" title={g.itemName}>{g.itemName}</td>
                  <td className="px-1.5 py-1 text-[9px] font-bold tabular-nums">{g.quantityReceived}/{g.quantityOrdered}</td>
                  <td className="px-1.5 py-1 font-mono text-[7px] text-slate-600">{g.batchNumber}</td>
                  <td className={`px-1.5 py-1 text-[8px] ${new Date(g.expiryDate) < new Date('2026-08-01') ? 'font-bold text-red-600' : 'text-slate-500'}`}>{g.expiryDate}</td>
                  <td className="px-1.5 py-1"><GrnQcPill status={g.qcStatus} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </InvPanel>
      </div>

      <InvPanel title="Quick Actions" icon={Zap} subtitle="Register · procure · GRN · issue · transfer">
        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 xl:grid-cols-6">
          {[
            { id: 'register-item' as const, label: 'Register Item', icon: Package },
            { id: 'create-pr' as const, label: 'Create Purchase Request', icon: ClipboardList },
            { id: 'generate-po' as const, label: 'Generate PO', icon: ShoppingCart },
            { id: 'log-grn' as const, label: 'Log GRN', icon: Truck },
            { id: 'issue-stock' as const, label: 'Issue Stock', icon: Zap },
            { id: 'transfer-stock' as const, label: 'Transfer Stock', icon: Truck },
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
      </InvPanel>
    </div>
  );
}
