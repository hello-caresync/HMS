'use client';

import { IndianRupee, Plus, Printer } from 'lucide-react';

import type { PrescribedItem } from '@/lib/billing/post-consultation-invoice';
import type { PrintableInvoice } from '@/lib/hospital/invoice-receipt';

export type BillingInvoiceRow = {
  id: string;
  patient_name: string;
  service_type: string;
  amount: number;
  status: string;
  uhid?: string;
  invoice_number?: string;
  doctor_name?: string;
  department?: string;
  consultation_fee?: number;
  medicine_fee?: number;
  medicines_total?: number;
  prescribed_items?: PrescribedItem[];
  payment_method?: string;
  paid_at?: string;
  appointment_id?: string;
  token_number?: string | number | null;
};

type BillingCheckoutCommandCenterProps = {
  hospitalNodeId: string;
  invoices: BillingInvoiceRow[];
  collectedTotal: number;
  pendingCheckoutTotal: number;
  openBillsCount: number;
  isProcessingPayment: boolean;
  formatCurrency: (amount: number) => string;
  formatEncounter: (isoDate: string) => string;
  onSettleByToken: () => void;
  onSettleInvoice: (invoice: BillingInvoiceRow) => void;
  onPreviewReceipt: (receipt: PrintableInvoice) => void;
};

function BillingEmptyState({ onSettleByToken }: { onSettleByToken: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-300">
        <IndianRupee className="h-6 w-6" aria-hidden />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-bold text-slate-800">Checkout queue is empty</p>
        <p className="mx-auto max-w-md text-xs text-slate-500">
          Itemized bills appear here when a doctor completes a consultation or a cashier posts a direct invoice.
        </p>
      </div>
      <button
        type="button"
        onClick={onSettleByToken}
        className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-700 px-3.5 py-2 text-xs font-bold text-white hover:bg-cyan-800"
      >
        <Plus className="h-3.5 w-3.5" aria-hidden />
        Settle by Token
      </button>
    </div>
  );
}

export function BillingCheckoutCommandCenter({
  hospitalNodeId,
  invoices,
  collectedTotal,
  pendingCheckoutTotal,
  openBillsCount,
  isProcessingPayment,
  formatCurrency,
  formatEncounter,
  onSettleByToken,
  onSettleInvoice,
  onPreviewReceipt,
}: BillingCheckoutCommandCenterProps) {
  return (
    <section className="mx-auto w-full max-w-[1600px] space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-black text-slate-900">Billing &amp; Checkout Command Center</h3>
          <p className="text-xs text-slate-500">
            Live invoices from Doctor Workspace · Node {hospitalNodeId}
          </p>
        </div>
        <button
          type="button"
          onClick={onSettleByToken}
          className="inline-flex items-center gap-1.5 self-start rounded-xl bg-cyan-700 px-3.5 py-2 text-xs font-bold text-white hover:bg-cyan-800"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden />
          Settle by Token
        </button>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Collected Revenue
          </span>
          <span className="mt-2 text-2xl font-bold text-emerald-700">{formatCurrency(collectedTotal)}</span>
        </div>
        <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Pending Checkout
          </span>
          <span className="mt-2 text-2xl font-bold text-amber-600">{formatCurrency(pendingCheckoutTotal)}</span>
        </div>
        <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Open Invoices</span>
          <span className="mt-2 text-2xl font-bold text-slate-800">{openBillsCount}</span>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        {invoices.length === 0 ? (
          <BillingEmptyState onSettleByToken={onSettleByToken} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">UHID / Bill ID</th>
                  <th className="px-4 py-3">Patient Name</th>
                  <th className="px-4 py-3">Doctor Name</th>
                  <th className="px-4 py-3">Consultation Fee</th>
                  <th className="px-4 py-3">Prescribed Medicines</th>
                  <th className="px-4 py-3">Total Amount</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Collect Payment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.map((inv) => {
                  const pending = /pending|unpaid|unbilled/i.test(inv.status);
                  return (
                    <tr key={inv.id} className="align-top hover:bg-slate-50/60">
                      <td className="px-4 py-3.5 font-mono font-bold text-cyan-800">
                        {inv.uhid || inv.id.slice(0, 8)}
                      </td>
                      <td className="px-4 py-3.5 font-bold text-slate-900">{inv.patient_name}</td>
                      <td className="px-4 py-3.5 text-slate-700">{inv.doctor_name || 'Duty doctor'}</td>
                      <td className="px-4 py-3.5 font-mono text-slate-800">
                        {formatCurrency(inv.consultation_fee ?? 0)}
                      </td>
                      <td className="px-4 py-3.5">
                        {(inv.prescribed_items ?? []).length === 0 ? (
                          <span className="text-slate-400">Settled at counter</span>
                        ) : (
                          <ul className="space-y-1">
                            {(inv.prescribed_items ?? []).map((med) => (
                              <li key={`${inv.id}-${med.drug}`} className="text-slate-600">
                                {med.drug} · Qty {med.quantity ?? 1}
                                {med.frequency ? ` · ${med.frequency}` : ''}
                              </li>
                            ))}
                          </ul>
                        )}
                      </td>
                      <td className="px-4 py-3.5 font-black text-emerald-700">
                        {formatCurrency(pending ? inv.consultation_fee ?? 0 : inv.amount)}
                        {pending ? (
                          <span className="mt-0.5 block text-[9px] font-normal text-slate-400">
                            + pharmacy at checkout
                          </span>
                        ) : null}
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                            pending
                              ? 'border border-amber-200 bg-amber-50 text-amber-700'
                              : 'border border-emerald-200 bg-emerald-50 text-emerald-700'
                          }`}
                        >
                          {pending ? 'Pending' : 'Paid'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        {pending ? (
                          <button
                            type="button"
                            disabled={isProcessingPayment}
                            onClick={() => onSettleInvoice(inv)}
                            className="rounded-lg bg-cyan-700 px-3 py-1.5 text-[10px] font-bold uppercase text-white disabled:opacity-50"
                          >
                            Settle &amp; Print
                          </button>
                        ) : (
                          <div className="inline-flex items-center justify-end gap-2">
                            <span className="font-mono text-[10px] text-slate-500">
                              {inv.paid_at ? formatEncounter(inv.paid_at) : 'Cleared'}
                              {inv.payment_method ? ` · ${inv.payment_method}` : ''}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                onPreviewReceipt({
                                  id: inv.id,
                                  invoice_number: inv.invoice_number,
                                  uhid: inv.uhid,
                                  patient_name: inv.patient_name,
                                  doctor_name: inv.doctor_name,
                                  department: inv.department,
                                  token_number: inv.token_number ?? inv.uhid,
                                  consultation_fee: inv.consultation_fee,
                                  pharmacy_amount: inv.medicine_fee ?? inv.medicines_total ?? 0,
                                  prescribed_items: inv.prescribed_items,
                                  amount: inv.amount,
                                  payment_method: inv.payment_method,
                                  paid_at: inv.paid_at,
                                })
                              }
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-[10px] font-bold uppercase"
                            >
                              <Printer className="h-3 w-3" aria-hidden />
                              Receipt
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
