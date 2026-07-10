'use client';

import { Truck } from 'lucide-react';

import { useVendorHub } from '../context/VendorHubProvider';
import { DELIVERY_STATUS_STYLES, transitProgressForStatus } from '../types';

export default function POTrackingFeed() {
  const { trackedPOs, livePulse, lastLiveUpdate } = useVendorHub();

  const activeCount = trackedPOs.filter(
    (p) => p.deliveryStatus !== 'Delivered' && p.deliveryStatus !== 'Return Initiated',
  ).length;

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-slate-200 bg-slate-50/80 px-3 py-2">
        <div className="flex items-center gap-2">
          <Truck className="h-4 w-4 text-violet-600" />
          <p className="text-xs font-bold text-slate-900">Live PO Tracking Feed</p>
        </div>
        <div className="flex items-center gap-2 text-[10px]">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-semibold ${
              livePulse ? 'animate-pulse bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-800'
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${livePulse ? 'bg-emerald-500' : 'bg-slate-400'}`}
            />
            Live sync
          </span>
          <span className="font-mono text-slate-800">
            {new Date(lastLiveUpdate).toLocaleTimeString('en-IN')}
          </span>
          <span className="rounded-full bg-violet-100 px-2 py-0.5 font-bold text-violet-800">
            {activeCount} active
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-[11px]">
          <thead>
            <tr className="border-b-2 border-slate-200 bg-[#0a0e14] text-[10px] uppercase tracking-wider text-slate-800">
              <th className="px-3 py-2 text-left font-black">PO Number</th>
              <th className="px-3 py-2 text-left font-black">Vendor</th>
              <th className="px-3 py-2 text-left font-black">Item</th>
              <th className="px-3 py-2 text-left font-black">Delivery Status</th>
              <th className="px-3 py-2 font-black">Shipment Progress</th>
            </tr>
          </thead>
          <tbody>
            {trackedPOs.map((po) => {
              const progress = transitProgressForStatus(po.deliveryStatus, po.transitProgress);
              const showBar =
                po.deliveryStatus === 'In-Transit' ||
                po.deliveryStatus === 'At Loading Dock' ||
                po.deliveryStatus === 'PO Dispatched';

              return (
                <tr
                  key={po.id}
                  className={`border-b border-slate-50 transition-colors hover:bg-slate-50/60 ${
                    livePulse && po.deliveryStatus === 'In-Transit' ? 'animate-fadeIn' : ''
                  }`}
                >
                  <td className="px-3 py-2 font-mono font-bold text-indigo-700">
                    {po.poNumber}
                  </td>
                  <td className="px-3 py-2 font-bold text-slate-900">{po.vendorName}</td>
                  <td className="max-w-[160px] truncate px-3 py-2 text-slate-950">
                    {po.itemSummary}
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ring-inset ${DELIVERY_STATUS_STYLES[po.deliveryStatus]}`}
                    >
                      {po.deliveryStatus}
                    </span>
                    {po.eta && po.deliveryStatus === 'In-Transit' && (
                      <p className="mt-0.5 text-[9px] text-slate-800">
                        ETA {new Date(po.eta).toLocaleDateString('en-IN')}
                      </p>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    {showBar ? (
                      <div>
                        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ${
                              po.deliveryStatus === 'In-Transit'
                                ? 'bg-violet-500'
                                : po.deliveryStatus === 'At Loading Dock'
                                  ? 'bg-amber-500'
                                  : 'bg-sky-400'
                            }`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <p className="mt-0.5 text-right font-mono text-[9px] tabular-nums text-slate-800">
                          {progress}%
                        </p>
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-800">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
