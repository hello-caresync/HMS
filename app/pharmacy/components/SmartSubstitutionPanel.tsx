'use client';

import { ArrowRightLeft, Package } from 'lucide-react';

import { usePharmacy } from '../context/PharmacyProvider';
import type { DispenseLineItem } from '../types';

type SmartSubstitutionPanelProps = {
  orderId: string;
  line: DispenseLineItem;
  onClose: () => void;
};

export default function SmartSubstitutionPanel({ orderId, line, onClose }: SmartSubstitutionPanelProps) {
  const { getAlternatives, applySubstitution, getInventoryForLine } = usePharmacy();
  const alternatives = getAlternatives(line.genericName, line.medicineId);
  const current = getInventoryForLine(line);

  if (alternatives.length === 0) {
    return (
      <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] text-slate-800">
        No brand alternatives found for {line.genericName}.
      </div>
    );
  }

  return (
    <div className="mt-2 overflow-hidden rounded-lg border border-violet-200 bg-violet-50/80">
      <div className="flex items-center justify-between border-b border-violet-100 px-3 py-1.5">
        <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-violet-700">
          <ArrowRightLeft className="h-3 w-3" />
          Smart Substitution · {line.genericName}
        </p>
        <button
          type="button"
          onClick={onClose}
          className="text-[10px] font-semibold text-violet-600 hover:text-violet-800"
        >
          Close
        </button>
      </div>
      <p className="px-3 py-1.5 text-[10px] text-violet-600">
        Same generic · different brand — select to swap line item
      </p>
      <ul className="divide-y divide-violet-100">
        {alternatives.map((alt) => {
          const low = alt.stockCount < alt.safetyThreshold;
          return (
            <li key={alt.medicineId}>
              <button
                type="button"
                onClick={() => {
                  applySubstitution(orderId, line.id, alt.medicineId);
                  onClose();
                }}
                className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-violet-100/60"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-white text-violet-600 shadow-sm">
                  <Package className="h-3.5 w-3.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-slate-900">{alt.brandName}</p>
                  <p className="font-mono text-[10px] text-slate-800">
                    Batch {alt.batchNumber} · Exp {alt.expiryDate} · {alt.stockCount} {alt.unit}
                  </p>
                </div>
                {low && (
                  <span className="shrink-0 rounded bg-rose-100 px-1.5 py-0.5 text-[9px] font-bold uppercase text-rose-700">
                    Low
                  </span>
                )}
                {current && alt.stockCount >= line.quantity && (
                  <span className="shrink-0 text-[10px] font-semibold text-emerald-600">In stock</span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
