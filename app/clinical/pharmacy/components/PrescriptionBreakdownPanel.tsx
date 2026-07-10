'use client';

import { AlertTriangle, ArrowRightLeft, Package } from 'lucide-react';

import {
  STOCK_LEVEL_STYLES,
  findMoleculeAlternatives,
  type PrescriptionLineItem,
} from '../../../lib/clinical';

type PrescriptionBreakdownPanelProps = {
  lines: PrescriptionLineItem[];
  onToggleFulfill: (lineId: string) => void;
  onSwapAlternative: (lineId: string, altDrugName: string) => void;
};

export default function PrescriptionBreakdownPanel({
  lines,
  onToggleFulfill,
  onSwapAlternative,
}: PrescriptionBreakdownPanelProps) {
  return (
    <div className="rounded-xl border border-slate-300 bg-white shadow-sm">
      <div className="border-b-2 border-slate-200 bg-slate-50 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-slate-800" />
          <h2 className="text-sm font-black text-slate-900">Prescription Breakdown</h2>
        </div>
      </div>

      <div className="divide-y divide-slate-100">
        {lines.map((line) => (
          <div key={line.id} className="p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-sm font-bold text-slate-900">{line.drugName}</p>
                <p className="text-[11px] text-slate-800">{line.genericFormula}</p>
                <p className="mt-1 text-xs text-slate-800">{line.dosageInstructions}</p>
              </div>
              <span
                className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ring-1 ${STOCK_LEVEL_STYLES[line.stockLevel]}`}
              >
                {line.stockLevel}
              </span>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-slate-800">
              <span>Qty: <strong className="text-slate-800">{line.quantityOrdered}</strong></span>
              <span>₹ {line.unitPrice.toFixed(2)}/unit</span>
              {line.batch && (
                <span className="font-mono">
                  Batch {line.batch.batchNumberCode} · Exp {line.batch.expiryDate}
                </span>
              )}
            </div>

            {line.stockLevel === 'Out of Stock' && (
              <div className="mt-3 rounded-lg border border-amber-300 bg-amber-50 p-3">
                <p className="flex items-center gap-1 text-[10px] font-bold uppercase text-amber-800">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Alternative Molecule Equivalents
                </p>
                <ul className="mt-2 space-y-1.5">
                  {findMoleculeAlternatives(line.genericFormula).map((alt) => (
                    <li key={alt}>
                      <button
                        type="button"
                        onClick={() => onSwapAlternative(line.id, alt.split(' · ')[0] ?? alt)}
                        className="flex w-full items-center gap-1 rounded border border-amber-200 bg-white px-2 py-1.5 text-left text-[11px] font-medium text-amber-900 hover:bg-amber-100"
                      >
                        <ArrowRightLeft className="h-3 w-3 shrink-0" />
                        {alt}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <label className="mt-3 flex cursor-pointer items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={line.fulfilled}
                disabled={line.stockLevel === 'Out of Stock'}
                onChange={() => onToggleFulfill(line.id)}
                className="rounded border-slate-300"
              />
              <span className="font-semibold text-slate-900">Mark fulfilled for checkout</span>
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}
