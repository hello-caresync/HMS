'use client';

import { Printer, X } from 'lucide-react';

import { formatCurrency } from '../../master-data/lib/seedData';
import type { LedgerTransaction } from '../types';

type ReceiptVoucherModalProps = {
  transaction: LedgerTransaction | null;
  onClose: () => void;
};

export default function ReceiptVoucherModal({ transaction, onClose }: ReceiptVoucherModalProps) {
  if (!transaction) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-[1px]"
        onClick={onClose}
        aria-hidden
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="receipt-voucher w-full max-w-sm overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl"
          role="dialog"
          aria-labelledby="receipt-title"
        >
          {/* Toolbar — hidden on print */}
          <div className="flex items-center justify-between border-b-2 border-slate-200 bg-slate-50 px-3 py-2 print:hidden">
            <p className="text-xs font-bold text-slate-900">Print Receipt</p>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-1 rounded-md bg-indigo-600 px-2.5 py-1 text-[10px] font-bold text-white hover:bg-indigo-700"
              >
                <Printer className="h-3 w-3" />
                Print
              </button>
              <button
                type="button"
                onClick={onClose}
                className="rounded-md p-1 text-slate-800 hover:bg-slate-200"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Voucher body */}
          <div className="p-4">
            <div className="border-b border-dashed border-slate-200 pb-3 text-center">
              <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-sm font-bold text-white">
                N
              </div>
              <h2 id="receipt-title" className="text-sm font-bold tracking-tight text-slate-900">
                Nexora Multispeciality Hospital
              </h2>
              <p className="text-[10px] text-slate-800">Payment Receipt · OPD Counter T-04</p>
              <p className="mt-1 font-mono text-[10px] text-slate-800">
                GSTIN: 29AABCN1234F1Z5 · Bengaluru
              </p>
            </div>

            <dl className="mt-3 space-y-1.5 text-[11px]">
              <Row label="Transaction ID" value={transaction.id} mono />
              <Row label="Invoice" value={transaction.invoiceNumber} mono />
              <Row label="Date & Time" value={new Date(transaction.timestamp).toLocaleString('en-IN')} />
              <Row label="Patient" value={transaction.patientName} />
              <Row label="UHID" value={transaction.uhid} mono />
              <Row label="Payment Mode" value={transaction.mode} />
            </dl>

            <div className="mt-3 rounded-md border-2 border-slate-200 bg-slate-50 px-2.5 py-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-800">
                Item Summary
              </p>
              <p className="mt-0.5 text-xs text-slate-900">{transaction.itemsSummary}</p>
            </div>

            <div className="mt-3 flex items-end justify-between border-t border-dashed border-slate-200 pt-3">
              <span className="text-xs font-bold text-slate-800">Amount Paid</span>
              <span className="font-mono text-xl font-bold tabular-nums text-indigo-700">
                {formatCurrency(transaction.amount)}
              </span>
            </div>

            <p
              className={`mt-2 text-center text-[10px] font-bold uppercase tracking-wider ${
                transaction.status === 'Refunded' ? 'text-rose-600' : 'text-emerald-600'
              }`}
            >
              {transaction.status === 'Refunded' ? 'REFUNDED' : 'PAYMENT SETTLED'}
            </p>

            {transaction.refundReason && (
              <p className="mt-1 text-center text-[10px] text-slate-800">
                Refund: {transaction.refundReason}
              </p>
            )}

            <p className="mt-3 text-center text-[9px] text-slate-800">
              This is a computer-generated receipt. No signature required.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

function Row({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex justify-between gap-2">
      <dt className="text-slate-800">{label}</dt>
      <dd className={`font-semibold text-slate-800 ${mono ? 'font-mono text-[10px]' : ''}`}>
        {value}
      </dd>
    </div>
  );
}
