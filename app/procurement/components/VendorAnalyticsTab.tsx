'use client';

import { Star, TrendingUp } from 'lucide-react';

import { formatCurrency } from '../../master-data/lib/seedData';
import { useProcurement } from '../context/ProcurementProvider';

export default function VendorAnalyticsTab() {
  const { vendorAnalytics, rfqs, purchaseOrders } = useProcurement();

  const totalSpend = vendorAnalytics.reduce((s, v) => s + v.totalSpend, 0);
  const openRfqs = rfqs.filter((r) => r.status !== 'Awarded' && r.status !== 'Closed').length;
  const activePos = purchaseOrders.filter((p) => p.status !== 'Matched').length;

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-3">
        <SummaryCard label="Total Vendor Spend (YTD)" value={formatCurrency(totalSpend)} />
        <SummaryCard label="Open RFQs" value={String(openRfqs)} />
        <SummaryCard label="Active POs" value={String(activePos)} />
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b-2 border-slate-200 bg-slate-50/80 px-3 py-2">
          <TrendingUp className="h-4 w-4 text-indigo-600" />
          <p className="text-xs font-bold text-slate-900">Vendor Performance Ledger</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-[11px]">
            <thead>
              <tr className="border-b-2 border-slate-200 bg-[#0a0e14] text-[10px] uppercase tracking-wider text-slate-800">
                <th className="px-3 py-2 text-left font-black">Vendor</th>
                <th className="px-3 py-2 text-right font-black">POs</th>
                <th className="px-3 py-2 text-right font-black">On-Time %</th>
                <th className="px-3 py-2 text-center font-black">Rating</th>
                <th className="px-3 py-2 text-right font-black">Total Spend</th>
                <th className="px-3 py-2 text-right font-black">Active RFQs</th>
              </tr>
            </thead>
            <tbody>
              {vendorAnalytics.map((v) => (
                <tr key={v.vendorId} className="border-b border-slate-50 hover:bg-slate-100/60">
                  <td className="px-3 py-2 font-bold text-slate-900">{v.vendorName}</td>
                  <td className="px-3 py-2 text-right font-mono tabular-nums">{v.totalPOs}</td>
                  <td className="px-3 py-2 text-right font-mono tabular-nums text-slate-900">
                    {v.onTimeDeliveryPct}%
                  </td>
                  <td className="px-3 py-2 text-center">
                    <span className="inline-flex items-center gap-0.5 font-mono text-amber-600">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      {v.avgRating.toFixed(1)}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right font-mono tabular-nums font-bold text-slate-900">
                    {formatCurrency(v.totalSpend)}
                  </td>
                  <td className="px-3 py-2 text-right font-mono tabular-nums text-indigo-700">
                    {v.activeRFQs}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-800">{label}</p>
      <p className="mt-1 font-mono text-lg font-bold tabular-nums text-slate-900">{value}</p>
    </div>
  );
}
