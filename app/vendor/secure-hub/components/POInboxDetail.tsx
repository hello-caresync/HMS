'use client';

import React, { useEffect, useMemo, useState } from 'react';

import { EnterprisePO, POExtendedStatus } from '../types';
import { computePoLineTotal, getPrimaryLineItem } from '../utils/storageSafe';

const PHARMA_GST_RATE = 0.12;

interface POInboxDetailProps {
  po: EnterprisePO;
  updatePOStatus: (poId: string, nextStatus: POExtendedStatus) => void;
  onBack?: () => void;
}

function parseDeliveryDeadline(dateString: string): Date | null {
  if (!dateString || dateString === '—') return null;

  const parsed = new Date(`${dateString}T23:59:59`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function computeHoursRemaining(deadline: Date | null): number | null {
  if (!deadline) return null;
  const diffMs = deadline.getTime() - Date.now();
  if (diffMs <= 0) return 0;
  return Math.ceil(diffMs / (1000 * 60 * 60));
}

function buildEwayBillCode(poId: string): string {
  const suffix = poId.replace(/[^A-Z0-9]/gi, '').slice(-8).toUpperCase() || '00000000';
  return `EWB-KA29-${suffix.slice(0, 4)}-${suffix.slice(4, 8)}`;
}

export default function POInboxDetail({
  po,
  updatePOStatus,
  onBack,
}: POInboxDetailProps) {
  const [poStatus, setPoStatus] = useState<POExtendedStatus>(po.status);
  const [showQuestions, setShowQuestions] = useState(false);
  const [hoursRemaining, setHoursRemaining] = useState<number | null>(null);

  const primaryItem = getPrimaryLineItem(po);
  const baseAmount = useMemo(() => computePoLineTotal(po), [po]);
  const gstAmount = useMemo(() => baseAmount * PHARMA_GST_RATE, [baseAmount]);
  const totalAmount = useMemo(() => baseAmount + gstAmount, [baseAmount, gstAmount]);

  const deliveryDeadline = useMemo(
    () => parseDeliveryDeadline(po.expectedDeliveryDate),
    [po.expectedDeliveryDate],
  );

  const ewayBillCode = useMemo(() => buildEwayBillCode(po.id), [po.id]);

  useEffect(() => {
    setPoStatus(po.status);
  }, [po.status, po.id]);

  useEffect(() => {
    const tick = () => setHoursRemaining(computeHoursRemaining(deliveryDeadline));

    tick();
    const interval = window.setInterval(tick, 60_000);
    return () => window.clearInterval(interval);
  }, [deliveryDeadline]);

  const handleStatusChange = (nextStatus: POExtendedStatus) => {
    if (!po.id) return;
    setPoStatus(nextStatus);
    updatePOStatus(po.id, nextStatus);
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-amber-500/20 bg-[#0F172A] text-white shadow-lg">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-amber-500/20 bg-[#1E293B] px-6 py-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-wider text-amber-500">
            Contract detail manifest
          </p>
          <h2 className="mt-1 font-mono text-sm font-black text-white">{po.id}</h2>
          <p className="mt-0.5 text-xs font-semibold text-slate-900">{po.hospitalName}</p>
        </div>

        <div className="rounded-xl border border-amber-500/20 bg-[#0F172A] px-4 py-3 text-right">
          <p className="font-mono text-[10px] uppercase tracking-wider text-amber-500">
            Delivery deadline countdown
          </p>
          <p className="mt-1 font-mono text-2xl font-black text-amber-500">
            {hoursRemaining === null
              ? '—'
              : hoursRemaining === 0
                ? 'OVERDUE'
                : `${hoursRemaining}h`}
          </p>
          <p className="mt-0.5 text-[10px] font-medium text-slate-800">
            Required by {po.expectedDeliveryDate ?? '—'}
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-2">
        <div className="space-y-4">
          <article className="rounded-2xl border border-amber-500/20 bg-[#1E293B] p-5">
            <p className="font-mono text-[10px] uppercase tracking-wider text-amber-500">
              Line item summary
            </p>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-amber-500/10 bg-[#0F172A]/60 p-4">
                <p className="font-mono text-[10px] uppercase tracking-wider text-slate-800">
                  Product
                </p>
                <p className="mt-1 text-sm font-black text-white">{primaryItem.name}</p>
                <p className="mt-1 font-mono text-xs text-slate-900">
                  QTY {primaryItem.quantityRequested.toLocaleString('en-IN')}
                </p>
              </div>

              <div className="rounded-xl border border-amber-500/10 bg-[#0F172A]/60 p-4">
                <p className="font-mono text-[10px] uppercase tracking-wider text-slate-800">
                  Unit economics
                </p>
                <p className="mt-1 font-mono text-sm font-black text-amber-500">
                  ₹{primaryItem.unitPrice.toFixed(2)}/unit
                </p>
                <p className="mt-1 text-xs text-slate-900">
                  {po.deliveryLocation ?? 'Delivery location pending'}
                </p>
              </div>
            </div>
          </article>

          <article className="rounded-2xl border border-amber-500/20 bg-[#1E293B] p-5">
            <p className="font-mono text-[10px] uppercase tracking-wider text-amber-500">
              Pharmaceutical tax ledger
            </p>

            <div className="mt-4 space-y-2 font-mono text-xs">
              <div className="flex items-center justify-between text-slate-900">
                <span>Base contract value</span>
                <span>₹{baseAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex items-center justify-between text-amber-500">
                <span>Pharma GST (12%)</span>
                <span>₹{gstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex items-center justify-between border-t border-amber-500/20 pt-2 text-sm font-black text-white">
                <span>Settlement total</span>
                <span>₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </article>

          <article className="rounded-2xl border border-amber-500/20 bg-[#1E293B] p-5">
            <p className="font-mono text-[10px] uppercase tracking-wider text-amber-500">
              Administrative profile
            </p>

            <div className="mt-4 space-y-3 text-xs">
              <div className="flex items-center justify-between border-b border-amber-500/10 pb-2">
                <span className="text-slate-800">Hospital procurement node</span>
                <span className="font-semibold text-white">{po.hospitalName}</span>
              </div>
              <div className="flex items-center justify-between border-b border-amber-500/10 pb-2">
                <span className="text-slate-800">Credit terms window</span>
                <span className="font-mono font-black text-amber-500">
                  NET {po.creditTermsDays ?? 30}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-800">E-Way Bill Authentication Registry Code</span>
                <span className="font-mono font-black text-amber-500">{ewayBillCode}</span>
              </div>
            </div>
          </article>
        </div>

        <aside className="space-y-4">
          <article className="rounded-2xl border border-amber-500/20 bg-[#1E293B] p-5">
            <p className="font-mono text-[10px] uppercase tracking-wider text-amber-500">
              Transaction control deck
            </p>

            <div className="mt-4 flex items-center justify-between rounded-xl border border-amber-500/20 bg-[#0F172A]/60 px-4 py-3">
              <span className="text-xs font-semibold text-slate-900">Current PO status</span>
              <span className="rounded-md border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 font-mono text-[10px] font-black uppercase tracking-wider text-amber-500">
                {poStatus}
              </span>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {poStatus === 'New' && (
                <>
                  <button
                    type="button"
                    onClick={() => handleStatusChange('Rejected')}
                    className="rounded-xl border border-amber-500/20 bg-[#0F172A] px-4 py-2.5 text-xs font-bold text-slate-200 transition-all hover:border-amber-500/40 hover:text-white"
                  >
                    ✕ Decline Contract
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStatusChange('Accepted')}
                    className="rounded-xl border border-amber-500/30 bg-amber-500 px-4 py-2.5 text-xs font-bold text-[#0F172A] transition-all hover:bg-amber-400"
                  >
                    ✓ Accept PO Terms
                  </button>
                </>
              )}

              {poStatus === 'Accepted' && (
                <button
                  type="button"
                  onClick={() => handleStatusChange('Processing')}
                  className="rounded-xl border border-amber-500/30 bg-[#0F172A] px-4 py-2.5 text-xs font-bold text-amber-500 transition-all hover:bg-amber-500/10"
                >
                  🏗️ Route to Fulfillment Floor →
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowQuestions((prev) => !prev)}
              className="mt-4 w-full rounded-xl border border-amber-500/20 bg-[#0F172A] px-4 py-2.5 text-xs font-bold text-amber-500 transition-all hover:border-amber-500/40"
            >
              {showQuestions ? 'Hide contract clarification' : 'Open contract clarification'}
            </button>

            {showQuestions && (
              <div className="mt-3 space-y-2 rounded-xl border border-amber-500/20 bg-[#0F172A]/80 p-4 text-xs text-slate-900">
                <p>
                  <span className="font-bold text-amber-500">Q:</span> Can delivery be
                  expedited under Critical urgency?
                </p>
                <p>
                  <span className="font-bold text-white">A:</span> Critical lane POs receive
                  priority dispatch within 24 hours of acceptance.
                </p>
                <p>
                  <span className="font-bold text-amber-500">Q:</span> Is partial fulfillment
                  permitted?
                </p>
                <p>
                  <span className="font-bold text-white">A:</span> Partial dispatch requires
                  hospital approval via live chat before invoice generation.
                </p>
              </div>
            )}
          </article>

          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="w-full rounded-xl border border-amber-500/20 px-4 py-2.5 text-xs font-bold text-slate-900 transition-all hover:border-amber-500/40 hover:text-white"
            >
              ← Back to inbox list
            </button>
          )}
        </aside>
      </div>
    </section>
  );
}
