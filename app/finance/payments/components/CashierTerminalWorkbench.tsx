'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Banknote, CreditCard, Smartphone, Shield } from 'lucide-react';

import {
  SEED_BILLING_DRAFT,
  SEED_PAYMENT_HISTORY,
  computeBillingSummary,
  generateTransactionToken,
  type PaymentHistoryLog,
  type PendingCashierInvoice,
  type SplitPaymentAllocation,
} from '../../../lib/finance';
import PaymentHistoryTable from './PaymentHistoryTable';
import SplitPaymentPanel from './SplitPaymentPanel';

const EMPTY_SPLIT: SplitPaymentAllocation = {
  cash: 0,
  card: 0,
  upi: 0,
  insuranceCover: 0,
};

export default function CashierTerminalWorkbench() {
  const defaultSummary = computeBillingSummary(
    SEED_BILLING_DRAFT.lineItems,
    SEED_BILLING_DRAFT.authorizedDiscount,
  );

  const [pendingInvoice, setPendingInvoice] = useState<PendingCashierInvoice>({
    invoiceRef: SEED_BILLING_DRAFT.invoiceNumber,
    patientName: SEED_BILLING_DRAFT.patientName,
    patientUhid: SEED_BILLING_DRAFT.patientUhid,
    grandTotal: defaultSummary.grandTotal,
    lineCount: SEED_BILLING_DRAFT.lineItems.length,
    receivedAt: new Date().toISOString(),
  });

  const [split, setSplit] = useState<SplitPaymentAllocation>(EMPTY_SPLIT);
  const [history, setHistory] = useState<PaymentHistoryLog[]>(SEED_PAYMENT_HISTORY);

  useEffect(() => {
    const raw = sessionStorage.getItem('curasync:pending-invoice');
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as PendingCashierInvoice;
      setPendingInvoice(parsed);
      setSplit(EMPTY_SPLIT);
    } catch {
      /* ignore malformed payload */
    }
  }, []);

  const splitTotal = useMemo(
    () => split.cash + split.card + split.upi + split.insuranceCover,
    [split],
  );

  const balanceDue = Math.round((pendingInvoice.grandTotal - splitTotal) * 100) / 100;
  const isBalanced = Math.abs(balanceDue) < 0.01;

  const handleCollect = useCallback(() => {
    if (!isBalanced) return;

    const methods: string[] = [];
    if (split.cash > 0) methods.push(`Cash ₹${split.cash.toLocaleString('en-IN')}`);
    if (split.card > 0) methods.push(`Card ₹${split.card.toLocaleString('en-IN')}`);
    if (split.upi > 0) methods.push(`UPI ₹${split.upi.toLocaleString('en-IN')}`);
    if (split.insuranceCover > 0)
      methods.push(`Insurance ₹${split.insuranceCover.toLocaleString('en-IN')}`);

    const entry: PaymentHistoryLog = {
      transactionToken: generateTransactionToken(),
      invoiceRef: pendingInvoice.invoiceRef,
      patientName: pendingInvoice.patientName,
      totalAmount: pendingInvoice.grandTotal,
      methodsSummary: methods.join(' · '),
      status: 'Completed',
      processedAt: new Date().toISOString(),
    };

    setHistory((prev) => [entry, ...prev]);
    setSplit(EMPTY_SPLIT);
    sessionStorage.removeItem('curasync:pending-invoice');
  }, [isBalanced, split, pendingInvoice]);

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <header className="border-b-2 border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <Banknote className="h-5 w-5 text-emerald-700" />
          <div>
            <h1 className="text-lg font-black text-slate-900">Cashier Terminal &amp; Split-Payment</h1>
            <p className="text-xs text-slate-800">
              Phase 5 · Module 15 · High-volume payment collection desk
            </p>
          </div>
        </div>
      </header>

      <div className="grid gap-4 xl:grid-cols-[300px_1fr]">
        <div className="rounded-xl border border-slate-300 bg-white p-4 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-800">
            Pending Invoice
          </p>
          <p className="mt-1 font-mono text-xs font-bold text-slate-800">{pendingInvoice.invoiceRef}</p>
          <p className="mt-2 text-sm font-semibold text-slate-900">{pendingInvoice.patientName}</p>
          <p className="font-mono text-[10px] text-slate-800">{pendingInvoice.patientUhid}</p>
          <p className="mt-3 text-[10px] text-slate-800">{pendingInvoice.lineCount} line items</p>
          <p className="mt-4 font-mono text-2xl font-black tabular-nums text-emerald-700">
            ₹ {pendingInvoice.grandTotal.toLocaleString('en-IN')}
          </p>
          <div className="mt-4 flex flex-wrap gap-2 text-[10px] text-slate-800">
            <span className="inline-flex items-center gap-1">
              <Banknote className="h-3 w-3" /> Cash
            </span>
            <span className="inline-flex items-center gap-1">
              <CreditCard className="h-3 w-3" /> Card
            </span>
            <span className="inline-flex items-center gap-1">
              <Smartphone className="h-3 w-3" /> UPI
            </span>
            <span className="inline-flex items-center gap-1">
              <Shield className="h-3 w-3" /> Insurance
            </span>
          </div>
        </div>

        <SplitPaymentPanel
          split={split}
          grandTotal={pendingInvoice.grandTotal}
          splitTotal={splitTotal}
          balanceDue={balanceDue}
          isBalanced={isBalanced}
          onChange={setSplit}
          onCollect={handleCollect}
        />
      </div>

      <PaymentHistoryTable logs={history} />
    </div>
  );
}
