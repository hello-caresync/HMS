'use client';

import { useMemo, useState } from 'react';
import { Handshake, Search } from 'lucide-react';

import { SEED_VENDOR_PROFILES, VENDOR_PAYMENT_STATUS_STYLES } from '../../../lib/supplychain';

export default function VendorCoordinationConsole() {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return SEED_VENDOR_PROFILES;
    return SEED_VENDOR_PROFILES.filter(
      (v) =>
        v.vendorId.toLowerCase().includes(q) ||
        v.supplierName.toLowerCase().includes(q) ||
        v.contactEmail.toLowerCase().includes(q),
    );
  }, [search]);

  const totals = useMemo(
    () => ({
      active: SEED_VENDOR_PROFILES.filter((v) => v.activeContract).length,
      outstanding: SEED_VENDOR_PROFILES.reduce((s, v) => s + v.outstandingAmount, 0),
      overdue: SEED_VENDOR_PROFILES.filter((v) => v.pendingInvoiceStatus === 'Overdue').length,
    }),
    [],
  );

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <header className="border-b-2 border-slate-200 pb-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <Handshake className="h-5 w-5 text-sky-700" />
            <div>
              <h1 className="text-lg font-black text-slate-900">Vendor Coordination Console</h1>
              <p className="text-xs text-slate-800">
                Phase 6 · Module 19 · Supplier agreements &amp; invoice settlement
              </p>
            </div>
          </div>
          <div className="flex gap-3 text-xs">
            <span className="rounded border border-slate-300 bg-slate-50 px-2 py-1">
              <strong>{totals.active}</strong> active contracts
            </span>
            <span className="rounded border border-amber-300 bg-amber-50 px-2 py-1 text-amber-900">
              ₹ {totals.outstanding.toLocaleString('en-IN')} outstanding
            </span>
            {totals.overdue > 0 && (
              <span className="rounded border border-rose-300 bg-rose-50 px-2 py-1 text-rose-800">
                {totals.overdue} overdue
              </span>
            )}
          </div>
        </div>
      </header>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-800" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search vendor ID, supplier name…"
          className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100"
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-300 bg-white shadow-sm">
        <table className="w-full min-w-[880px] border-collapse text-sm">
          <thead>
            <tr className="border-b-2 border-slate-200 bg-slate-800 text-white">
              <th className="px-3 py-2 text-left text-[10px] font-black uppercase">Vendor ID</th>
              <th className="px-3 py-2 text-left text-[10px] font-black uppercase">Supplier</th>
              <th className="px-3 py-2 text-left text-[10px] font-black uppercase">Contact</th>
              <th className="px-3 py-2 text-left text-[10px] font-black uppercase">Contract</th>
              <th className="px-3 py-2 text-center text-[10px] font-black uppercase">Active</th>
              <th className="px-3 py-2 text-left text-[10px] font-black uppercase">Invoice Status</th>
              <th className="px-3 py-2 text-right text-[10px] font-black uppercase">Outstanding</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((vendor, index) => (
              <tr
                key={vendor.vendorId}
                className={`border-b-2 border-slate-200 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}`}
              >
                <td className="px-3 py-2 font-mono text-xs font-black">{vendor.vendorId}</td>
                <td className="px-3 py-2 text-xs font-bold text-slate-900">{vendor.supplierName}</td>
                <td className="px-3 py-2 text-[10px] text-slate-950">{vendor.contactEmail}</td>
                <td className="px-3 py-2 font-mono text-[10px] text-slate-950">
                  {vendor.contractStart} → {vendor.contractEnd}
                </td>
                <td className="px-3 py-2 text-center">
                  <span
                    className={`inline-flex h-2 w-2 rounded-full ${
                      vendor.activeContract ? 'bg-emerald-500' : 'bg-slate-300'
                    }`}
                  />
                </td>
                <td className="px-3 py-2">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ring-1 ${VENDOR_PAYMENT_STATUS_STYLES[vendor.pendingInvoiceStatus]}`}
                  >
                    {vendor.pendingInvoiceStatus}
                  </span>
                </td>
                <td className="px-3 py-2 text-right font-mono text-xs font-bold tabular-nums">
                  ₹ {vendor.outstandingAmount.toLocaleString('en-IN')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
