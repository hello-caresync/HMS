'use client';

import { useEffect, useRef } from 'react';
import { Printer, X } from 'lucide-react';

import {
  formatReceiptDoctorLabel,
  formatReceiptInr,
  formatReceiptToken,
  resolveReceiptTotals,
  type PrintableInvoice,
} from '@/lib/hospital/invoice-receipt';

type OfficialReceiptModalProps = {
  open: boolean;
  receipt: PrintableInvoice | null;
  autoPrint?: boolean;
  onClose: () => void;
};

export function OfficialReceiptModal({
  open,
  receipt,
  autoPrint = true,
  onClose,
}: OfficialReceiptModalProps) {
  const hasAutoPrinted = useRef(false);

  useEffect(() => {
    if (!open || !receipt) {
      hasAutoPrinted.current = false;
      return;
    }
    if (!autoPrint || hasAutoPrinted.current) return;

    const timer = window.setTimeout(() => {
      hasAutoPrinted.current = true;
      window.print();
    }, 350);

    return () => window.clearTimeout(timer);
  }, [open, receipt, autoPrint]);

  if (!open || !receipt) return null;

  const { consultation, pharmacyAmount, totalPaid } = resolveReceiptTotals(receipt);
  const paidAt = receipt.paid_at || receipt.created_at || new Date().toISOString();
  const invoiceNumber = receipt.invoice_number || receipt.id;
  const tokenLabel = formatReceiptToken(receipt.token_number, receipt.uhid || receipt.patient_uhid);
  const doctorLabel = formatReceiptDoctorLabel(receipt);
  const paymentMethod = (receipt.payment_method || 'Cash').toUpperCase();
  const prescribedItems = receipt.prescribed_items ?? [];

  return (
    <div className="no-print fixed inset-0 z-[90] flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm">
      <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="no-print flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h3 className="text-base font-black text-slate-900">Official Receipt</h3>
            <p className="text-[11px] text-slate-500">
              Review the invoice below, then print or close to return to the dashboard.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
            aria-label="Close receipt"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto bg-slate-50 p-5">
          <div
            id="printable-receipt"
            className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-8 text-slate-900 shadow-sm"
          >
            <header className="border-b-2 border-slate-900 pb-4 text-center">
              <h2 className="text-xl font-black tracking-tight">Regal Multispeciality Hospital</h2>
              <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-slate-600">
                Node HOSP-01 · Bengaluru
              </p>
              <p className="mt-2 text-[11px] text-slate-500">Official OPD Invoice &amp; Pharmacy Receipt</p>
            </header>

            <section className="mt-5 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wide text-slate-500">Invoice No</span>
                <p className="font-mono font-bold">{invoiceNumber}</p>
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wide text-slate-500">Date &amp; Time</span>
                <p className="font-semibold">
                  {new Date(paidAt).toLocaleString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wide text-slate-500">Patient Name</span>
                <p className="font-bold">{receipt.patient_name}</p>
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wide text-slate-500">Token / UHID</span>
                <p className="font-mono font-semibold">{tokenLabel}</p>
              </div>
              <div className="col-span-2">
                <span className="text-[10px] font-black uppercase tracking-wide text-slate-500">
                  Attending Doctor
                </span>
                <p className="font-semibold">{doctorLabel}</p>
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wide text-slate-500">Payment Method</span>
                <p className="font-semibold">{paymentMethod}</p>
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wide text-slate-500">Status</span>
                <p className="font-black text-emerald-700">PAID IN FULL</p>
              </div>
            </section>

            <table className="mt-6 w-full border-collapse text-sm">
              <thead>
                <tr className="border-b-2 border-slate-200 text-left text-[10px] font-black uppercase tracking-wide text-slate-500">
                  <th className="py-2 pr-2">Description</th>
                  <th className="py-2 text-right">Amount (INR)</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-100">
                  <td className="py-2.5">Consultation Fee</td>
                  <td className="py-2.5 text-right font-mono font-semibold">{formatReceiptInr(consultation)}</td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="py-2.5">Pharmacy / Dispensed Medicines Total</td>
                  <td className="py-2.5 text-right font-mono font-semibold">{formatReceiptInr(pharmacyAmount)}</td>
                </tr>
              </tbody>
              <tfoot>
                <tr>
                  <td className="border-t-2 border-slate-900 pt-3 text-base font-black">Total Paid</td>
                  <td className="border-t-2 border-slate-900 pt-3 text-right font-mono text-base font-black">
                    {formatReceiptInr(totalPaid)}
                  </td>
                </tr>
              </tfoot>
            </table>

            {prescribedItems.length > 0 ? (
              <div className="mt-5">
                <h4 className="text-[10px] font-black uppercase tracking-wide text-slate-500">
                  Prescribed &amp; Dispensed Medicines
                </h4>
                <ul className="mt-2 space-y-1 text-xs text-slate-700">
                  {prescribedItems.map((item) => (
                    <li key={`${item.drug}-${item.quantity}`} className="flex justify-between gap-3">
                      <span>
                        {item.drug}
                        {item.frequency ? ` · ${item.frequency}` : ''}
                        {item.duration ? ` · ${item.duration}` : ''}
                      </span>
                      <span className="font-mono shrink-0">Qty {item.quantity ?? 1}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <footer className="mt-10 border-t border-slate-200 pt-6">
              <div className="grid grid-cols-2 gap-8 text-xs text-slate-600">
                <div>
                  <div className="mb-8 h-14 rounded border border-dashed border-slate-300 bg-slate-50" />
                  <p className="font-bold uppercase tracking-wide text-slate-700">Authorized Hospital Stamp</p>
                </div>
                <div>
                  <div className="mb-8 h-14 border-b border-slate-400" />
                  <p className="font-bold uppercase tracking-wide text-slate-700">Cashier Signature</p>
                </div>
              </div>
              <p className="mt-6 text-center text-[10px] text-slate-500">
                Computer-generated receipt · Regal Multispeciality Hospital Billing Counter
              </p>
            </footer>
          </div>
        </div>

        <div className="no-print flex items-center justify-end gap-3 border-t border-slate-100 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200"
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-500"
          >
            <Printer className="h-3.5 w-3.5" />
            Print Receipt
          </button>
        </div>
      </div>
    </div>
  );
}
