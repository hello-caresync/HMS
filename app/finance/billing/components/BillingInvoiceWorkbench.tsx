'use client';

import { useMemo, useState } from 'react';
import { FileText, Send } from 'lucide-react';

import {
  SEED_BILLING_DRAFT,
  computeBillingSummary,
  type PatientBillingDraft,
} from '../../../lib/finance';
import GstSummaryPanel from './GstSummaryPanel';
import InvoiceLineItemsTable from './InvoiceLineItemsTable';

export default function BillingInvoiceWorkbench() {
  const [draft, setDraft] = useState<PatientBillingDraft>(SEED_BILLING_DRAFT);
  const [dispatched, setDispatched] = useState(false);

  const summary = useMemo(
    () => computeBillingSummary(draft.lineItems, draft.authorizedDiscount),
    [draft.lineItems, draft.authorizedDiscount],
  );

  const handleDiscountChange = (value: number) => {
    setDraft((d) => ({ ...d, authorizedDiscount: Math.max(0, value) }));
    setDispatched(false);
  };

  const handleDispatch = () => {
    setDraft((d) => ({ ...d, dispatchedToCashier: true }));
    setDispatched(true);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(
        'curasync:pending-invoice',
        JSON.stringify({
          invoiceRef: draft.invoiceNumber,
          patientName: draft.patientName,
          patientUhid: draft.patientUhid,
          grandTotal: summary.grandTotal,
          lineCount: draft.lineItems.length,
          receivedAt: new Date().toISOString(),
        }),
      );
    }
  };

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <header className="border-b-2 border-slate-200 pb-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-sky-700" />
            <div>
              <h1 className="text-lg font-black text-slate-900">Unified Billing &amp; GST Ledger</h1>
              <p className="text-xs text-slate-800">
                Phase 5 · Module 14 · Invoice builder · Indian GST compliance
              </p>
            </div>
          </div>
          <div className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs">
            <span className="font-mono font-bold text-slate-800">{draft.invoiceNumber}</span>
            <span className="mx-2 text-slate-900">|</span>
            <span>{draft.patientName}</span>
            <span className="ml-2 font-mono text-slate-800">{draft.patientUhid}</span>
          </div>
        </div>
      </header>

      <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
        <InvoiceLineItemsTable lineItems={draft.lineItems} />
        <GstSummaryPanel
          summary={summary}
          discount={draft.authorizedDiscount}
          onDiscountChange={handleDiscountChange}
          onDispatch={handleDispatch}
          dispatched={dispatched || draft.dispatchedToCashier}
        />
      </div>

      {dispatched && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-800">
          <Send className="h-4 w-4" />
          Invoice dispatched to cashier terminal · ₹ {summary.grandTotal.toLocaleString('en-IN')}
        </div>
      )}
    </div>
  );
}
