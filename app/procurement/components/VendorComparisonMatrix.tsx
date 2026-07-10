'use client';

import { CheckCircle2, Star } from 'lucide-react';

import { formatCurrency } from '../../master-data/lib/seedData';
import { useProcurement } from '../context/ProcurementProvider';
import type { RFQ, VendorBid } from '../types';

type VendorComparisonMatrixProps = {
  rfq: RFQ;
};

export default function VendorComparisonMatrix({ rfq }: VendorComparisonMatrixProps) {
  const { acceptBidAndGeneratePo } = useProcurement();
  const awarded = rfq.status === 'Awarded';

  if (rfq.bids.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-xs text-slate-800">
        Awaiting vendor bids from external Vendor App…
      </div>
    );
  }

  const lowestBid = Math.min(...rfq.bids.map((b) => b.totalBidAmount));

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b-2 border-slate-200 bg-[#0a0e14] px-3 py-2">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-800">
          Vendor Comparison Matrix
        </p>
        <p className="text-xs font-bold text-white">
          {rfq.rfqNumber} · {rfq.itemName}
        </p>
        <p className="font-mono text-[10px] text-slate-800">
          Qty {rfq.quantity} {rfq.unit} · {rfq.department}
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-[11px]">
          <thead>
            <tr className="border-b-2 border-slate-200 bg-slate-100/80 text-[10px] uppercase tracking-wider text-slate-800">
              <th className="px-3 py-2 text-left font-black">Vendor</th>
              <th className="px-3 py-2 text-right font-black">Unit Price</th>
              <th className="px-3 py-2 text-right font-black">Shipping</th>
              <th className="px-3 py-2 text-right font-black">GST</th>
              <th className="px-3 py-2 text-right font-black">Total Bid</th>
              <th className="px-3 py-2 text-center font-black">Rating</th>
              <th className="px-3 py-2 text-right font-black">Action</th>
            </tr>
          </thead>
          <tbody>
            {rfq.bids.map((bid) => (
              <BidRow
                key={bid.vendorId}
                bid={bid}
                isLowest={bid.totalBidAmount === lowestBid}
                isAccepted={rfq.acceptedVendorId === bid.vendorId}
                disabled={awarded}
                onAccept={() => acceptBidAndGeneratePo(rfq.id, bid.vendorId)}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function BidRow({
  bid,
  isLowest,
  isAccepted,
  disabled,
  onAccept,
}: {
  bid: VendorBid;
  isLowest: boolean;
  isAccepted: boolean;
  disabled: boolean;
  onAccept: () => void;
}) {
  return (
    <tr
      className={`border-b border-slate-50 ${
        isAccepted ? 'bg-emerald-50/60' : isLowest ? 'bg-indigo-50/30' : 'hover:bg-slate-50/50'
      }`}
    >
      <td className="px-3 py-2.5">
        <p className="font-semibold text-slate-900">{bid.vendorName}</p>
        {isLowest && !isAccepted && (
          <span className="text-[9px] font-bold uppercase text-indigo-600">Lowest bid</span>
        )}
        {isAccepted && (
          <span className="inline-flex items-center gap-0.5 text-[9px] font-bold uppercase text-emerald-600">
            <CheckCircle2 className="h-3 w-3" />
            Awarded
          </span>
        )}
      </td>
      <td className="px-3 py-2.5 text-right font-mono tabular-nums text-slate-950">
        {formatCurrency(bid.unitPrice)}
      </td>
      <td className="px-3 py-2.5 text-right font-mono tabular-nums text-slate-950">
        {bid.shippingDays}d
      </td>
      <td className="px-3 py-2.5 text-right font-mono tabular-nums text-slate-950">
        {bid.gstPercent}%
      </td>
      <td className="px-3 py-2.5 text-right font-mono font-bold tabular-nums text-slate-900">
        {formatCurrency(bid.totalBidAmount)}
      </td>
      <td className="px-3 py-2.5 text-center">
        <span className="inline-flex items-center gap-0.5 font-mono text-amber-600">
          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
          {bid.rating.toFixed(1)}
        </span>
      </td>
      <td className="px-3 py-2.5 text-right">
        {!disabled && (
          <button
            type="button"
            onClick={onAccept}
            className="rounded bg-emerald-600 px-2.5 py-1 text-[10px] font-bold text-white hover:bg-emerald-700"
          >
            Accept Bid & Generate PO
          </button>
        )}
      </td>
    </tr>
  );
}
