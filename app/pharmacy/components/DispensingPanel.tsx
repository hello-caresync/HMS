'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  ArrowRightLeft,
  Barcode,
  CheckCircle2,
  Loader2,
  Pill,
  ShieldCheck,
} from 'lucide-react';

import { usePharmacy } from '../context/PharmacyProvider';
import type { PharmacyDispatchOrder } from '../types';
import SmartSubstitutionPanel from './SmartSubstitutionPanel';

type DispensingPanelProps = {
  order: PharmacyDispatchOrder;
};

type ScanState = Record<string, 'idle' | 'scanning'>;

export default function DispensingPanel({ order }: DispensingPanelProps) {
  const { getInventoryForLine, verifyLineItem, finalizeAndDispense } = usePharmacy();
  const [scanState, setScanState] = useState<ScanState>({});
  const [substitutionLineId, setSubstitutionLineId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isCompleted = order.status === 'Completed';
  const verifiedCount = order.lineItems.filter((l) => l.verified).length;
  const allVerified = verifiedCount === order.lineItems.length;

  useEffect(() => {
    setScanState({});
    setSubstitutionLineId(null);
    setError(null);
  }, [order.id]);

  const handleScan = useCallback(
    (lineId: string) => {
      if (isCompleted) return;
      const line = order.lineItems.find((l) => l.id === lineId);
      if (!line || line.verified) return;

      setScanState((prev) => ({ ...prev, [lineId]: 'scanning' }));

      window.setTimeout(() => {
        const ok = verifyLineItem(order.id, lineId);
        setScanState((prev) => ({ ...prev, [lineId]: 'idle' }));
        if (!ok) setError(`Scan failed — check stock for ${line.brandName}`);
        else setError(null);
      }, 700);
    },
    [isCompleted, order.id, order.lineItems, verifyLineItem],
  );

  const handleFinalize = () => {
    setSubmitting(true);
    setError(null);
    const result = finalizeAndDispense(order.id);
    setSubmitting(false);
    if (!result.success) setError(result.error ?? 'Dispense failed');
  };

  return (
    <div className="flex h-full flex-col">
      <div className="border-b-2 border-slate-200 bg-white px-3 py-2.5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-800">
              Active Prescription
            </p>
            <h2 className="text-sm font-bold text-slate-900">{order.patientName}</h2>
            <p className="font-mono text-[10px] text-slate-800">
              {order.uhid} · {order.prescribingDoctor}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-slate-800">Verified</p>
            <p className="text-lg font-bold tabular-nums text-slate-900">
              {verifiedCount}
              <span className="text-sm font-normal text-slate-800">/{order.lineItems.length}</span>
            </p>
          </div>
        </div>
      </div>

      <div className="custom-scrollbar flex-1 space-y-2 overflow-y-auto p-3">
        {order.lineItems.map((line) => {
          const inv = getInventoryForLine(line);
          const scanning = scanState[line.id] === 'scanning';
          const lowStock = inv ? inv.stockCount < inv.safetyThreshold : false;
          const insufficient = inv ? inv.stockCount < line.quantity : true;

          return (
            <div
              key={line.id}
              className={`rounded-lg border p-2.5 transition ${
                line.verified
                  ? 'border-emerald-200 bg-emerald-50/60'
                  : insufficient
                    ? 'border-rose-200 bg-rose-50/40'
                    : 'border-slate-200 bg-white'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                    <Pill className="h-3.5 w-3.5 shrink-0 text-teal-600" />
                    {line.brandName}
                    <span className="font-normal text-slate-800">({line.genericName})</span>
                  </p>
                  <p className="mt-0.5 text-[10px] text-slate-800">
                    {line.dosage} · {line.frequency} · {line.duration} · Qty{' '}
                    <span className="font-semibold">{line.quantity}</span>
                  </p>
                </div>
                {line.verified ? (
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white">
                    <CheckCircle2 className="h-3 w-3" />
                    Verified
                  </span>
                ) : scanning ? (
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Scanning…
                  </span>
                ) : null}
              </div>

              {inv && (
                <div className="mt-2 grid grid-cols-3 gap-1.5 rounded-md bg-slate-50 px-2 py-1.5 text-[10px]">
                  <div>
                    <p className="text-slate-800">Batch</p>
                    <p className="font-mono font-semibold text-slate-900">{inv.batchNumber}</p>
                  </div>
                  <div>
                    <p className="text-slate-800">Expiry</p>
                    <p className="font-mono font-semibold text-slate-900">{inv.expiryDate}</p>
                  </div>
                  <div>
                    <p className="text-slate-800">Stock</p>
                    <p
                      className={`font-mono font-semibold ${
                        insufficient ? 'text-rose-600' : lowStock ? 'text-amber-600' : 'text-slate-900'
                      }`}
                    >
                      {inv.stockCount} {inv.unit}
                    </p>
                  </div>
                </div>
              )}

              {inv && (
                <p className="mt-1 font-mono text-[9px] text-slate-800">Barcode: {inv.barcode}</p>
              )}

              {insufficient && !line.verified && (
                <p className="mt-1.5 flex items-center gap-1 text-[10px] font-semibold text-rose-600">
                  <AlertTriangle className="h-3 w-3" />
                  Insufficient stock — try Smart Substitution
                </p>
              )}

              {!isCompleted && !line.verified && (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleScan(line.id)}
                    disabled={scanning || insufficient}
                    className={`inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-[10px] font-bold transition ${
                      scanning
                        ? 'bg-amber-500 text-white'
                        : 'bg-[#0a0e14] text-teal-300 hover:bg-slate-800 disabled:opacity-40'
                    }`}
                  >
                    <Barcode className="h-3.5 w-3.5" />
                    {scanning ? 'Matching…' : 'Scan Pack Barcode'}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setSubstitutionLineId((prev) => (prev === line.id ? null : line.id))
                    }
                    className="inline-flex items-center gap-1 text-[10px] font-semibold text-violet-600 hover:text-violet-800"
                  >
                    <ArrowRightLeft className="h-3 w-3" />
                    Smart Substitution
                  </button>
                </div>
              )}

              {substitutionLineId === line.id && (
                <SmartSubstitutionPanel
                  orderId={order.id}
                  line={line}
                  onClose={() => setSubstitutionLineId(null)}
                />
              )}
            </div>
          );
        })}
      </div>

      <div className="border-t border-slate-200 bg-slate-50 p-3">
        {error && (
          <p className="mb-2 flex items-center gap-1.5 rounded-md border border-rose-200 bg-rose-50 px-2 py-1.5 text-[11px] font-medium text-rose-700">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            {error}
          </p>
        )}

        {isCompleted ? (
          <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <div>
              <p className="text-xs font-bold text-emerald-800">Dispensed & locked</p>
              <p className="text-[10px] text-emerald-600">
                EMR updated · {order.dispensedAt ? new Date(order.dispensedAt).toLocaleString() : '—'}
              </p>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleFinalize}
            disabled={!allVerified || submitting}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-teal-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-teal-600/25 hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ShieldCheck className="h-4 w-4" />
            )}
            Finalize & Dispense
          </button>
        )}
      </div>
    </div>
  );
}
