'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2, Printer } from 'lucide-react';
import { toast } from 'sonner';

import { computeCheckoutTotal } from '@/lib/billing/invoice-breakdown';
import type { PaymentMethod } from '@/lib/billing/post-consultation-invoice';
import type { BookableDoctorRecord } from '@/lib/hospital/doctors';
import {
  lookupDirectBillingVisit,
  resolveDirectBillingVisit,
  settleDirectBillingVisit,
  type DirectBillingSeed,
  type DirectBillingVisitContext,
} from '@/lib/hospital/direct-billing-visit';
import { OfficialReceiptModal } from '@/components/hospital/OfficialReceiptModal';
import type { PrintableInvoice } from '@/lib/hospital/invoice-receipt';
import { supabase } from '@/lib/supabase';

const NO_NUMBER_SPINNER =
  '[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]';

type InvoiceLike = {
  id: string;
  status: string;
  patient_name: string;
  uhid?: string;
  token_number?: string | number | null;
  doctor_name?: string;
  department?: string;
  consultation_fee?: number;
  appointment_id?: string;
  prescribed_items?: import('@/lib/billing/post-consultation-invoice').PrescribedItem[];
  booking_source?: string;
  patient_id?: string;
};

type QueueLike = {
  id: string;
  token_number?: string;
  token?: string;
  uhid?: string;
  patient_name: string;
  doctor_name?: string;
  department?: string;
  status?: string;
  source?: string;
};

type PharmacyBillingModalProps = {
  open: boolean;
  hospitalId: string;
  seed?: DirectBillingSeed | null;
  queue: QueueLike[];
  invoices: InvoiceLike[];
  doctors?: BookableDoctorRecord[];
  busy?: boolean;
  onClose: () => void;
  onSettled: () => void;
};

function inr(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number.isFinite(amount) ? amount : 0);
}

function formatTokenDisplay(token: string): string {
  if (!token) return '';
  return token.startsWith('#') ? token : token.startsWith('NX-') ? token : `#${token}`;
}

export function PharmacyBillingModal({
  open,
  hospitalId,
  seed,
  queue,
  invoices,
  doctors = [],
  busy = false,
  onClose,
  onSettled,
}: PharmacyBillingModalProps) {
  const [tokenInput, setTokenInput] = useState('');
  const [visit, setVisit] = useState<DirectBillingVisitContext | null>(null);
  const [pharmacyAmount, setPharmacyAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [printedReceiptData, setPrintedReceiptData] = useState<PrintableInvoice | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  const isLinked = Boolean(visit?.isLinked && visit.patientName);

  const grandTotal = useMemo(
    () =>
      computeCheckoutTotal({
        consultationFee: visit?.consultationFee ?? 0,
        pharmacyAmount,
      }).totalAmount,
    [visit?.consultationFee, pharmacyAmount],
  );

  useEffect(() => {
    if (!open) return;

    const local = resolveDirectBillingVisit({
      token: seed?.token,
      invoiceId: seed?.invoiceId,
      appointmentId: seed?.appointmentId,
      queue,
      invoices,
      doctors,
    });

    if (local) {
      setVisit(local);
      setTokenInput(formatTokenDisplay(local.token));
      setPharmacyAmount(0);
      setPaymentMethod('cash');
      return;
    }

    setVisit(null);
    setTokenInput(seed?.token ? formatTokenDisplay(seed.token) : '');
    setPharmacyAmount(0);
    setPaymentMethod('cash');
  }, [open, seed, queue, invoices, doctors]);

  useEffect(() => {
    if (!open || !tokenInput.trim() || seed?.invoiceId || seed?.appointmentId) return;

    const normalized = tokenInput.trim().replace(/^#/, '');
    if (normalized.length < 4) return;

    const local = resolveDirectBillingVisit({
      token: normalized,
      queue,
      invoices,
      doctors,
    });
    if (local?.patientName) {
      setVisit(local);
      return;
    }

    let cancelled = false;
    setIsLookingUp(true);
    void lookupDirectBillingVisit(supabase, normalized, doctors)
      .then((remote) => {
        if (cancelled) return;
        if (remote?.patientName) {
          const pendingInvoice = invoices.find(
            (inv) =>
              /pending|unpaid|unbilled/i.test(inv.status) &&
              (inv.appointment_id === remote.appointmentId ||
                inv.patient_name.trim().toLowerCase() === remote.patientName.trim().toLowerCase()),
          );
          setVisit({
            ...remote,
            invoiceId: pendingInvoice?.id ?? remote.invoiceId,
            consultationFee: pendingInvoice?.consultation_fee ?? remote.consultationFee,
            prescribedItems: pendingInvoice?.prescribed_items ?? remote.prescribedItems,
            doctorName: pendingInvoice?.doctor_name ?? remote.doctorName,
          });
        }
      })
      .finally(() => {
        if (!cancelled) setIsLookingUp(false);
      });

    return () => {
      cancelled = true;
    };
  }, [tokenInput, open, queue, invoices, doctors, seed?.invoiceId, seed?.appointmentId]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!visit?.patientName) {
      toast.error('Enter a valid token to load the patient visit.');
      return;
    }
    if (isSubmitting || busy) return;

    setIsSubmitting(true);
    try {
      const result = await settleDirectBillingVisit(supabase, {
        hospitalId,
        visit,
        pharmacyAmount,
        paymentMethod,
      });
      if (!result.ok) throw new Error(result.error || 'Settlement failed.');

      toast.success(`Bill settled — ${inr(result.grandTotal ?? grandTotal)} paid via ${paymentMethod.toUpperCase()}.`);
      onSettled();
      onClose();

      if (result.receipt) {
        setPrintedReceiptData(result.receipt);
        setIsReceiptOpen(true);
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Could not settle bill.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitting = isSubmitting || busy;

  const closeReceipt = () => {
    setIsReceiptOpen(false);
    setPrintedReceiptData(null);
  };

  return (
    <>
      <OfficialReceiptModal
        open={isReceiptOpen}
        receipt={printedReceiptData}
        onClose={closeReceipt}
      />

      {!open ? null : (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <form
        onSubmit={(event) => void handleSubmit(event)}
        className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl"
      >
        <div className="border-b border-slate-100 px-5 py-4">
          <h3 className="text-base font-black text-slate-900">Direct Billing &amp; Pharmacy Invoice</h3>
          <p className="text-[11px] text-slate-500">
            Load visit by token, enter pharmacy charges, settle and print the official receipt.
          </p>
        </div>

        <div className="max-h-[70vh] space-y-3 overflow-y-auto p-5 text-xs">
          <label className="block font-bold uppercase text-slate-700">
            UHID / Token
            <div className="relative mt-1">
              <input
                disabled={submitting || Boolean(seed?.invoiceId)}
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="NX-WLK-001"
                className={`w-full rounded-xl border border-slate-200 px-3 py-2.5 font-mono font-medium normal-case outline-none focus:border-cyan-700 ${
                  isLinked ? 'cursor-not-allowed bg-slate-100' : 'bg-white'
                }`}
                readOnly={isLinked}
              />
              {isLookingUp ? (
                <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-slate-400" />
              ) : null}
            </div>
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block font-bold uppercase text-slate-700">
              Patient full name
              <input
                required
                readOnly={isLinked}
                disabled={submitting}
                value={visit?.patientName ?? ''}
                onChange={() => undefined}
                placeholder="Auto-filled from token"
                className={`mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-medium normal-case outline-none ${
                  isLinked ? 'cursor-not-allowed bg-slate-100 text-slate-800' : 'bg-white'
                }`}
              />
            </label>
            <label className="block font-bold uppercase text-slate-700">
              Attending doctor
              <input
                readOnly={isLinked}
                disabled={submitting}
                value={visit?.doctorName ?? ''}
                onChange={() => undefined}
                placeholder="Dr. Suriraju V"
                className={`mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-medium normal-case outline-none ${
                  isLinked ? 'cursor-not-allowed bg-slate-100 text-slate-800' : 'bg-white'
                }`}
              />
            </label>
          </div>

          <label className="block font-bold uppercase text-slate-700">
            Consultation fee (₹)
            <input
              type="number"
              min={0}
              readOnly={isLinked}
              disabled={submitting}
              value={visit?.consultationFee ?? 0}
              onChange={() => undefined}
              className={`mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-mono outline-none ${
                isLinked ? 'cursor-not-allowed bg-slate-100 text-slate-800' : 'bg-white'
              }`}
            />
          </label>

          <label className="block font-bold uppercase text-slate-700">
            Pharmacy / Dispensed Medicines Total (₹)
            <input
              id="pharmacyAmount"
              type="number"
              min={0}
              disabled={submitting}
              value={pharmacyAmount || ''}
              onChange={(e) => setPharmacyAmount(Math.max(0, Number(e.target.value) || 0))}
              placeholder="Enter dispensed medicine total"
              className={`mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-mono font-bold normal-case outline-none focus:border-emerald-600 ${NO_NUMBER_SPINNER}`}
            />
          </label>

          {visit?.prescribedItems && visit.prescribedItems.length > 0 ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3">
              <div className="mb-1.5 text-[10px] font-black uppercase tracking-wide text-emerald-800">
                Prescribed medicines
              </div>
              <ul className="space-y-1">
                {visit.prescribedItems.map((item) => (
                  <li key={`${item.drug}-${item.quantity}`} className="flex justify-between text-[11px] text-emerald-950">
                    <span>{item.drug}</span>
                    <span className="font-mono">Qty {item.quantity ?? 1}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div>
            <div className="mb-1.5 text-[10px] font-black uppercase tracking-wide text-slate-500">
              Payment method
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(['cash', 'upi', 'card'] as const).map((method) => (
                <button
                  key={method}
                  type="button"
                  disabled={submitting}
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

          <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs font-black text-emerald-900">
            <span>Grand Total Payable</span>
            <span className="font-mono text-sm">{inr(grandTotal)}</span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-slate-100 px-5 py-4">
          <button
            type="button"
            disabled={submitting}
            onClick={onClose}
            className="rounded-lg bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || !visit?.patientName}
            className="flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-500 disabled:opacity-60"
          >
            {submitting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Settling...
              </>
            ) : (
              <>
                <Printer className="h-3.5 w-3.5" />
                Settle Bill &amp; Print Official Receipt
              </>
            )}
          </button>
        </div>
      </form>
    </div>
      )}
    </>
  );
}

export type { DirectBillingSeed };
