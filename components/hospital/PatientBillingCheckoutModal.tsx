'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2, Printer, Smartphone, TicketPlus } from 'lucide-react';

import { computeCheckoutTotal } from '@/lib/billing/invoice-breakdown';
import { isPatientAppBooking, isWalkInBooking } from '@/lib/billing/patient-bill-dispatch';
import type { PaymentMethod, PrescribedItem } from '@/lib/billing/post-consultation-invoice';

export type PatientCheckoutTarget = {
  invoiceId: string;
  patientName: string;
  uhid: string;
  doctorName?: string;
  department?: string;
  consultationFee: number;
  pharmacyAmount?: number;
  prescribedItems?: PrescribedItem[];
  bookingSource?: string | null;
  patientId?: string | null;
  tokenNumber?: string | number | null;
};

type PatientBillingCheckoutModalProps = {
  open: boolean;
  target: PatientCheckoutTarget | null;
  busy: boolean;
  onClose: () => void;
  onCollect: (method: PaymentMethod, pharmacyAmount: number) => void;
};

const NO_NUMBER_SPINNER =
  '[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]';

function inr(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number.isFinite(amount) ? amount : 0);
}

export function PatientBillingCheckoutModal({
  open,
  target,
  busy,
  onClose,
  onCollect,
}: PatientBillingCheckoutModalProps) {
  const [pharmacyAmount, setPharmacyAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');

  useEffect(() => {
    if (!target) return;
    setPharmacyAmount(Math.max(0, Number(target.pharmacyAmount) || 0));
    setPaymentMethod('cash');
  }, [target?.invoiceId, target?.pharmacyAmount]);

  const breakdown = useMemo(
    () =>
      computeCheckoutTotal({
        consultationFee: target?.consultationFee ?? 0,
        pharmacyAmount,
      }),
    [target?.consultationFee, pharmacyAmount],
  );

  if (!open || !target) return null;

  const appBooking = isPatientAppBooking(target.bookingSource);
  const walkIn = isWalkInBooking(target.bookingSource);
  const prescribedItems = target.prescribedItems ?? [];
  const tokenLabel = target.tokenNumber ? `#${String(target.tokenNumber).replace(/^#/, '')}` : target.uhid;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="border-b border-slate-100 px-5 py-4">
          <h3 className="text-base font-black text-slate-900">Pharmacy &amp; Billing Settlement</h3>
          <p className="text-[11px] text-slate-500">
            {target.patientName} · Token {tokenLabel}
          </p>
        </div>

        <div className="max-h-[70vh] space-y-3 overflow-y-auto p-5 text-xs">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="mb-2 text-[10px] font-black uppercase tracking-wide text-slate-500">
              Consultation charge
            </div>
            <div className="flex justify-between">
              <span>
                Doctor Consultation Fee
                {target.doctorName ? ` (${target.doctorName}` : ''}
                {target.department ? `${target.doctorName ? ' — ' : ' ('}${target.department}` : ''}
                {target.doctorName || target.department ? ')' : ''}
              </span>
              <span className="font-mono font-bold">{inr(breakdown.consultationFee)}</span>
            </div>
          </div>

          <label className="block font-black uppercase tracking-wide text-slate-600">
            Pharmacy / Dispensed Medicines Total (₹)
            <input
              id="pharmacyAmount"
              type="number"
              min={0}
              value={pharmacyAmount || ''}
              onChange={(e) => setPharmacyAmount(Math.max(0, Number(e.target.value) || 0))}
              className={`mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-mono font-bold normal-case outline-none focus:border-cyan-700 ${NO_NUMBER_SPINNER}`}
              placeholder="Enter dispensed medicine total"
            />
          </label>

          {prescribedItems.length > 0 && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3">
              <div className="mb-2 text-[10px] font-black uppercase tracking-wide text-emerald-800">
                Prescribed medicines (clinical)
              </div>
              <ul className="space-y-1">
                {prescribedItems.map((item) => (
                  <li key={`${item.drug}-${item.quantity}`} className="flex justify-between text-[11px] text-emerald-950">
                    <span>
                      {item.drug}
                      {item.frequency ? ` · ${item.frequency}` : ''}
                      {item.duration ? ` · ${item.duration}` : ''}
                    </span>
                    <span className="font-mono font-bold">Qty: {item.quantity ?? 1}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2.5 flex justify-between text-sm font-black text-emerald-950">
            <span>Grand Total Payable</span>
            <span className="font-mono">{inr(breakdown.totalAmount)}</span>
          </div>

          <div
            className={`flex items-start gap-2 rounded-xl border px-3 py-2 text-[10px] ${
              walkIn
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                : appBooking
                  ? 'border-violet-200 bg-violet-50 text-violet-800'
                  : 'border-slate-200 bg-slate-50 text-slate-600'
            }`}
          >
            {walkIn ? (
              <TicketPlus className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            ) : (
              <Smartphone className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            )}
            <span>
              {walkIn
                ? 'Walk-in — receipt prints at this desk after payment confirmation.'
                : appBooking
                  ? 'App booking — paid receipt will also route to the patient mobile app.'
                  : 'Confirm payment to generate the official hospital receipt.'}
            </span>
          </div>

          <div>
            <div className="mb-1.5 text-[10px] font-black uppercase tracking-wide text-slate-500">
              Payment method
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(['cash', 'upi', 'card'] as const).map((method) => (
                <button
                  key={method}
                  type="button"
                  disabled={busy}
                  onClick={() => setPaymentMethod(method)}
                  className={`rounded-xl py-2 text-[10px] font-black uppercase transition ${
                    paymentMethod === method
                      ? 'bg-cyan-700 text-white'
                      : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {method}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            disabled={busy}
            onClick={() => onCollect(paymentMethod, pharmacyAmount)}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 py-3 text-[11px] font-black uppercase text-white hover:bg-emerald-600 disabled:opacity-50"
          >
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Printer className="h-4 w-4" />
                Confirm Payment &amp; Print Receipt
              </>
            )}
          </button>
        </div>

        <div className="border-t border-slate-100 px-5 py-3">
          <button
            type="button"
            disabled={busy}
            onClick={onClose}
            className="w-full rounded-xl border border-slate-200 py-2 text-[11px] font-bold text-slate-600"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
