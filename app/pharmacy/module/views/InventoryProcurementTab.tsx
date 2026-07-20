'use client';

import { Package, ShoppingCart, Truck } from 'lucide-react';

import {
  MOCK_BATCH_STOCK,
  MOCK_GRN_RECORDS,
  MOCK_PURCHASE_REQUESTS,
  MOCK_VENDOR_SCORES,
  formatInr,
} from '../lib/pharmacyMockData';
import { GrnPill, PharmPanel, StatusPill } from '../components/pharmacyUi';

export default function InventoryProcurementTab() {
  const fefoSorted = [...MOCK_BATCH_STOCK].sort((a, b) => a.fefoRank - b.fefoRank);

  return (
    <div className="grid grid-cols-1 gap-2 xl:grid-cols-2">
      <div className="space-y-2">
        <PharmPanel title="Stock & Batch Vault" subtitle="Medicine master · lot quantities · FEFO · expiry · recall" icon={Package}>
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-[#F8FAFC]">
                {['Medicine', 'Batch', 'Store', 'Qty', 'Expiry', 'FEFO', 'Alerts'].map((h) => (
                  <th key={h} className="px-1.5 py-1 text-[8px] font-bold uppercase text-slate-500">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {fefoSorted.map((b) => (
                <tr
                  key={b.id}
                  className={`border-b border-slate-50 ${b.outOfStock ? 'bg-red-50/50' : b.nearExpiry ? 'bg-amber-50/40' : ''} ${b.recallTriggered ? 'ring-1 ring-inset ring-red-200' : ''}`}
                >
                  <td className="px-1.5 py-1">
                    <p className="text-[9px] font-semibold text-[#0F172A]">{b.medicineName}</p>
                    <p className="text-[7px] text-slate-500">{b.genericName}</p>
                  </td>
                  <td className="px-1.5 py-1 font-mono text-[8px] text-slate-600">{b.batchNumber}</td>
                  <td className="max-w-[80px] truncate px-1.5 py-1 text-[7px] text-slate-500" title={b.store}>
                    {b.store}
                  </td>
                  <td className={`px-1.5 py-1 text-[9px] font-bold tabular-nums ${b.outOfStock ? 'text-red-600' : b.quantity < b.reorderLevel ? 'text-amber-600' : 'text-emerald-700'}`}>
                    {b.quantity} {b.unit}
                  </td>
                  <td className={`px-1.5 py-1 text-[8px] ${b.nearExpiry ? 'font-bold text-amber-700' : 'text-slate-500'}`}>{b.expiryDate}</td>
                  <td className="px-1.5 py-1 text-center text-[9px] font-bold tabular-nums text-[#2563EB]">{b.fefoRank}</td>
                  <td className="px-1.5 py-1">
                    <div className="flex flex-wrap gap-0.5">
                      {b.outOfStock && <span className="rounded bg-red-600 px-1 py-0.5 text-[7px] font-bold uppercase text-white">OOS</span>}
                      {b.nearExpiry && !b.outOfStock && <span className="rounded bg-amber-100 px-1 py-0.5 text-[7px] font-bold uppercase text-amber-800">Expiring</span>}
                      {b.recallTriggered && <span className="rounded bg-red-100 px-1 py-0.5 text-[7px] font-bold uppercase text-red-800">Recall</span>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </PharmPanel>

        <PharmPanel title="FEFO Pick List — Auto-Sorted" subtitle="First Expire First Out dispensing priority">
          <ol className="space-y-1">
            {fefoSorted
              .filter((b) => !b.outOfStock && b.fefoRank <= 2)
              .slice(0, 5)
              .map((b, i) => (
                <li key={b.id} className="flex items-center justify-between rounded border border-[#E2E8F0] px-2 py-1">
                  <span className="text-[9px] font-semibold">
                    {i + 1}. {b.medicineName}
                  </span>
                  <span className="font-mono text-[8px] text-slate-500">
                    {b.batchNumber} · Exp {b.expiryDate}
                  </span>
                </li>
              ))}
          </ol>
        </PharmPanel>
      </div>

      <div className="space-y-2">
        <PharmPanel title="Purchase Requests" subtitle="Active PRs · approval workflow" icon={ShoppingCart}>
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-[#F8FAFC]">
                {['PR #', 'Vendor', 'Items', 'Value', 'Status', 'Requested'].map((h) => (
                  <th key={h} className="px-1.5 py-1 text-[8px] font-bold uppercase text-slate-500">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MOCK_PURCHASE_REQUESTS.map((pr) => (
                <tr key={pr.id} className="border-b border-slate-50 hover:bg-slate-50/80">
                  <td className="px-1.5 py-1 font-mono text-[8px] font-bold text-[#2563EB]">{pr.prNumber}</td>
                  <td className="max-w-[90px] truncate px-1.5 py-1 text-[8px] text-slate-600" title={pr.vendor}>
                    {pr.vendor}
                  </td>
                  <td className="max-w-[100px] truncate px-1.5 py-1 text-[8px] text-slate-600" title={pr.items}>
                    {pr.items}
                  </td>
                  <td className="px-1.5 py-1 text-[9px] font-bold tabular-nums">{formatInr(pr.totalValue)}</td>
                  <td className="px-1.5 py-1">
                    <StatusPill status={pr.status} />
                  </td>
                  <td className="px-1.5 py-1 text-[8px] text-slate-400">{pr.requestedAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </PharmPanel>

        <PharmPanel title="Vendor Performance Scoring" subtitle="On-time delivery · quality · active POs">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-[#F8FAFC]">
                {['Vendor', 'OTD %', 'Quality', 'Active POs', 'Last Delivery'].map((h) => (
                  <th key={h} className="px-1.5 py-1 text-[8px] font-bold uppercase text-slate-500">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MOCK_VENDOR_SCORES.map((v) => (
                <tr key={v.id} className="border-b border-slate-50">
                  <td className="px-1.5 py-1 text-[9px] font-semibold">{v.vendorName}</td>
                  <td className={`px-1.5 py-1 text-[9px] font-bold tabular-nums ${v.onTimeDeliveryPct >= 90 ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {v.onTimeDeliveryPct}%
                  </td>
                  <td className="px-1.5 py-1 text-[9px] font-bold tabular-nums text-[#2563EB]">{v.qualityScore}/5</td>
                  <td className="px-1.5 py-1 text-[9px] tabular-nums">{v.activePos}</td>
                  <td className="px-1.5 py-1 text-[8px] text-slate-400">{v.lastDelivery}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </PharmPanel>

        <PharmPanel title="Goods Receipt Notes (GRN)" subtitle="PO verification · QC clearance fields" icon={Truck}>
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-[#F8FAFC]">
                {['GRN #', 'PO Ref', 'Vendor', 'Items', 'Status', 'Received'].map((h) => (
                  <th key={h} className="px-1.5 py-1 text-[8px] font-bold uppercase text-slate-500">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MOCK_GRN_RECORDS.map((g) => (
                <tr key={g.id} className={`border-b border-slate-50 ${g.status === 'Rejected' ? 'bg-red-50/40' : ''}`}>
                  <td className="px-1.5 py-1 font-mono text-[8px] font-bold text-[#2563EB]">{g.grnNumber}</td>
                  <td className="px-1.5 py-1 font-mono text-[8px] text-slate-500">{g.poReference}</td>
                  <td className="max-w-[90px] truncate px-1.5 py-1 text-[8px] text-slate-600" title={g.vendor}>
                    {g.vendor}
                  </td>
                  <td className="px-1.5 py-1 text-[9px] font-bold tabular-nums">{g.itemsReceived}</td>
                  <td className="px-1.5 py-1">
                    <GrnPill status={g.status} />
                  </td>
                  <td className="px-1.5 py-1 text-[8px] text-slate-400">{g.receivedAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </PharmPanel>
      </div>
    </div>
  );
}
