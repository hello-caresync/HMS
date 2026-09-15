'use client';

import { useEffect, useState } from 'react';
import { Loader2, X } from 'lucide-react';

import {
  HOSPITAL_SETTLEMENT_PAYMENT_METHODS,
  isCashSettlementMethod,
  resolveSettlementPaymentReference,
  type HospitalVendorInvoiceRow,
} from '@/lib/hospital/procurement';

type InvoiceSettlementModalProps = {
  isOpen: boolean;
  onClose: () => void;
  invoice: HospitalVendorInvoiceRow | null;
  busy?: boolean;
  onConfirm: (input: { payment_reference: string; payment_method: string }) => Promise<void>;
};

function formatInr(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number.isFinite(amount) ? amount : 0);
}

export function InvoiceSettlementModal({
  isOpen,
  onClose,
  invoice,
  busy = false,
  onConfirm,
}: InvoiceSettlementModalProps) {
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<string>(HOSPITAL_SETTLEMENT_PAYMENT_METHODS[0].value);

  const isCash = isCashSettlementMethod(paymentMethod);

  useEffect(() => {
    if (!isOpen) return;
    setPaymentReference('');
    setPaymentMethod(HOSPITAL_SETTLEMENT_PAYMENT_METHODS[0].value);
  }, [isOpen, invoice?.id]);

  if (!isOpen || !invoice) return null;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const reference = resolveSettlementPaymentReference(paymentMethod, paymentReference);
    if (!reference) return;
    await onConfirm({ payment_reference: reference, payment_method: paymentMethod });
  };

  const canSubmit = isCash || paymentReference.trim().length > 0;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <form
        onSubmit={(event) => void handleSubmit(event)}
        className="w-full max-w-lg space-y-4 rounded-3xl border border-slate-200 bg-white p-6 text-xs shadow-2xl"
      >
        <div className="flex items-start justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Settle Vendor Invoice</h3>
            <p className="mt-0.5 font-mono text-[11px] text-teal-600">{invoice.invoice_number}</p>
          </div>
          <button type="button" disabled={busy} onClick={onClose} className="text-slate-400">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Total Payable</p>
          <p className="mt-1 text-2xl font-black text-emerald-900">{formatInr(invoice.total_amount)}</p>
          <p className="mt-2 text-[11px] text-emerald-800">
            Base {formatInr(invoice.subtotal)} + GST {formatInr(invoice.tax_amount)}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Beneficiary</p>
          <p className="mt-1 text-sm font-bold text-slate-900">{invoice.vendor_name}</p>
          {invoice.vendor_email ? (
            <p className="font-mono text-[11px] text-slate-500">{invoice.vendor_email}</p>
          ) : null}
          <p className="mt-2 text-[11px] text-slate-500">
            Reference PO: <span className="font-mono font-semibold text-teal-700">{invoice.po_number}</span>
          </p>
        </div>

        <label className="block font-bold uppercase text-slate-600">
          Payment Method *
          <select
            required
            disabled={busy}
            value={paymentMethod}
            onChange={(event) => setPaymentMethod(event.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-medium normal-case"
          >
            {HOSPITAL_SETTLEMENT_PAYMENT_METHODS.map((method) => (
              <option key={method.value} value={method.value}>
                {method.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block font-bold uppercase text-slate-600">
          {isCash ? 'Cash Receipt / Voucher Number (Optional)' : 'Bank Reference / UTR Number *'}
          <input
            required={!isCash}
            disabled={busy}
            value={paymentReference}
            onChange={(event) => setPaymentReference(event.target.value)}
            placeholder={isCash ? 'Leave blank to auto-generate voucher ID' : 'e.g. UTR-2026-XXXX'}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-mono font-medium normal-case"
          />
          {isCash ? (
            <p className="mt-1 font-normal normal-case text-[10px] text-slate-400">
              A voucher reference like CASH-REC-123456 is generated automatically when left blank.
            </p>
          ) : null}
        </label>

        <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
          <button
            type="button"
            disabled={busy}
            onClick={onClose}
            className="rounded-lg bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy || !canSubmit}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2 text-xs font-semibold text-white disabled:opacity-60"
          >
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            {busy ? 'Recording…' : 'Confirm & Record Settlement'}
          </button>
        </div>
      </form>
    </div>
  );
}
