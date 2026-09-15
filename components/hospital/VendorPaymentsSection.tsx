'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  Clock,
  CreditCard,
  Receipt,
  RefreshCw,
  Search,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

import {
  buildSettlementSuccessMessage,
  fetchHospitalVendorInvoices,
  HOSPITAL_SETTLEMENT_PAYMENT_METHODS,
  isCashSettlementMethod,
  normalizeHospitalPaymentStatus,
  resolveSettlementPaymentReference,
  settleHospitalVendorInvoice,
  type HospitalVendorInvoiceRow,
} from '@/lib/hospital/procurement';
import { supabase } from '@/lib/supabase/client';

function formatInr(amount: number): string {
  return `₹${Number(amount || 0).toLocaleString('en-IN')}`;
}

function formatInvoiceDate(value?: string): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

type VendorPaymentsSectionProps = {
  hospitalId: string;
  hospitalName?: string;
};

export function VendorPaymentsSection({ hospitalId, hospitalName }: VendorPaymentsSectionProps) {
  const [invoices, setInvoices] = useState<HospitalVendorInvoiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<HospitalVendorInvoiceRow | null>(null);
  const [utrNumber, setUtrNumber] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<string>(
    HOSPITAL_SETTLEMENT_PAYMENT_METHODS[0].value,
  );
  const isCashPayment = isCashSettlementMethod(paymentMethod);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchInvoices = useCallback(async () => {
    if (!supabase) {
      setInvoices([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const rows = await fetchHospitalVendorInvoices(supabase, hospitalId);
      console.log('Hospital fetched invoices:', rows);
      setInvoices(rows);
    } catch (err) {
      console.error(err);
      toast.error('Unable to load payables');
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  }, [hospitalId]);

  useEffect(() => {
    void fetchInvoices();
  }, [fetchInvoices]);

  useEffect(() => {
    if (!supabase) return;

    const channel = supabase
      .channel(`hospital-vendor-payments-${hospitalId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'vendor_invoices' },
        () => void fetchInvoices(),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'invoices' },
        () => void fetchInvoices(),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'purchase_orders' },
        () => void fetchInvoices(),
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [fetchInvoices, hospitalId]);

  useEffect(() => {
    if (!selectedInvoice) {
      setUtrNumber('');
      setPaymentMethod(HOSPITAL_SETTLEMENT_PAYMENT_METHODS[0].value);
    }
  }, [selectedInvoice]);

  const handleProcessPayment = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedInvoice || !supabase) return;

    setIsProcessing(true);
    try {
      const referenceCode = resolveSettlementPaymentReference(paymentMethod, utrNumber);
      if (!referenceCode) {
        throw new Error('Bank reference / UTR number is required for this payment method');
      }
      const result = await settleHospitalVendorInvoice(supabase, hospitalId, {
        invoiceId: selectedInvoice.id,
        payment_reference: referenceCode,
        payment_method: paymentMethod,
      });

      if (!result.ok) {
        throw new Error(result.error || 'Failed to record payment');
      }

      toast.success(
        buildSettlementSuccessMessage(
          paymentMethod,
          referenceCode,
          selectedInvoice.invoice_number,
        ),
      );

      if (result.invoice) {
        setInvoices((prev) =>
          prev.map((invoice) => (invoice.id === selectedInvoice.id ? result.invoice! : invoice)),
        );
      } else {
        await fetchInvoices();
      }

      setSelectedInvoice(null);
      setUtrNumber('');
    } catch (err: unknown) {
      console.error('Payment processing failed:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to record payment');
    } finally {
      setIsProcessing(false);
    }
  };

  const pendingInvoices = useMemo(
    () => invoices.filter((invoice) => normalizeHospitalPaymentStatus(invoice.payment_status) !== 'PAID'),
    [invoices],
  );

  const settledInvoices = useMemo(
    () => invoices.filter((invoice) => normalizeHospitalPaymentStatus(invoice.payment_status) === 'PAID'),
    [invoices],
  );

  const totalPendingAmount = pendingInvoices.reduce(
    (acc, invoice) => acc + Number(invoice.total_amount || 0),
    0,
  );
  const totalSettledAmount = settledInvoices.reduce(
    (acc, invoice) => acc + Number(invoice.total_amount || 0),
    0,
  );

  const filteredInvoices = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return invoices;
    return invoices.filter((invoice) => {
      return (
        invoice.invoice_number.toLowerCase().includes(query) ||
        invoice.po_number.toLowerCase().includes(query) ||
        invoice.vendor_name.toLowerCase().includes(query) ||
        invoice.vendor_email.toLowerCase().includes(query) ||
        (invoice.item_description ?? '').toLowerCase().includes(query)
      );
    });
  }, [invoices, searchQuery]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Vendor Payments &amp; Settlements</h1>
        <p className="mt-1 text-xs text-slate-500">
          {hospitalName ? `${hospitalName} · ` : ''}
          Review incoming tax invoices, record bank payouts, and reconcile vendor payables.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-amber-200/80 bg-amber-50/60 p-4">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-amber-700">
            <span>Awaiting Settlement</span>
            <Clock className="h-4 w-4 text-amber-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-950">{formatInr(totalPendingAmount)}</div>
          <div className="mt-1 text-xs text-amber-700">
            {pendingInvoices.length} pending vendor invoice{pendingInvoices.length === 1 ? '' : 's'}
          </div>
        </div>

        <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/60 p-4">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-emerald-700">
            <span>Total Settled Payouts</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-950">{formatInr(totalSettledAmount)}</div>
          <div className="mt-1 text-xs text-emerald-700">
            {settledInvoices.length} cleared disbursement{settledInvoices.length === 1 ? '' : 's'}
          </div>
        </div>

        <div className="rounded-xl border border-blue-200/80 bg-blue-50/60 p-4">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-blue-700">
            <span>Reconciliation Mode</span>
            <Receipt className="h-4 w-4 text-blue-600" />
          </div>
          <div className="mt-2 text-lg font-bold text-blue-950">3-Way Matched</div>
          <div className="mt-1 text-xs text-blue-700">PO &amp; Goods Receipt Verified</div>
        </div>
      </div>

      <div className="flex flex-col items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search invoice, PO, or supplier..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-9 pr-3 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <button
          type="button"
          onClick={() => void fetchInvoices()}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Payables
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <th className="px-4 py-3.5">Invoice No &amp; Date</th>
              <th className="px-4 py-3.5">PO Reference</th>
              <th className="px-4 py-3.5">Supplier / Entity</th>
              <th className="px-4 py-3.5">Breakdown (Base + GST)</th>
              <th className="px-4 py-3.5">Gross Payable</th>
              <th className="px-4 py-3.5">Status</th>
              <th className="px-4 py-3.5 text-right">Payment Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {loading ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400">
                  <RefreshCw className="mx-auto mb-2 h-5 w-5 animate-spin text-emerald-600" />
                  Loading vendor payables...
                </td>
              </tr>
            ) : filteredInvoices.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400">
                  No vendor invoices found awaiting payment.
                </td>
              </tr>
            ) : (
              filteredInvoices.map((invoice) => {
                const isPaid = normalizeHospitalPaymentStatus(invoice.payment_status) === 'PAID';

                return (
                  <tr key={invoice.id} className="transition hover:bg-slate-50/60">
                    <td className="px-4 py-3.5">
                      <span className="block font-bold text-slate-900">{invoice.invoice_number}</span>
                      <span className="text-[10px] text-slate-400">{formatInvoiceDate(invoice.created_at)}</span>
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-emerald-700">{invoice.po_number || '—'}</td>
                    <td className="px-4 py-3.5">
                      <span className="block font-medium text-slate-800">{invoice.vendor_name}</span>
                      {invoice.vendor_email ? (
                        <span className="block text-[10px] text-slate-400">{invoice.vendor_email}</span>
                      ) : null}
                      <span className="block max-w-[180px] truncate text-[10px] text-slate-400">
                        {invoice.item_description || 'Hospital Medical Supplies'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-600">
                      <span>Base: {formatInr(invoice.subtotal)}</span>
                      <span className="block text-[10px] text-slate-400">
                        GST 18%: {formatInr(invoice.tax_amount)}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-sm font-bold text-slate-900">
                      {formatInr(invoice.total_amount)}
                    </td>
                    <td className="px-4 py-3.5">
                      {isPaid ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
                          <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                          PAID
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold text-amber-800">
                          <Clock className="h-3 w-3 text-amber-600" />
                          Awaiting Settlement
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      {isPaid ? (
                        <div className="text-right">
                          <span className="block font-mono text-[10px] text-slate-500">
                            {invoice.payment_reference || 'UTR-RECONCILED'}
                          </span>
                          <span className="text-[9px] font-medium text-emerald-600">Bank Cleared</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setSelectedInvoice(invoice)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 font-semibold text-white shadow-sm transition hover:bg-emerald-700"
                        >
                          <CreditCard className="h-3.5 w-3.5" />
                          Pay Vendor
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {selectedInvoice ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-100 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Hospital Vendor Payment</h3>
                <p className="text-xs text-slate-500">Record fund transfer settlement</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedInvoice(null)}
                className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={(event) => void handleProcessPayment(event)} className="mt-4 space-y-4">
              <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Invoice Number:</span>
                  <span className="font-bold text-slate-800">{selectedInvoice.invoice_number}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Purchase Order:</span>
                  <span className="font-semibold text-emerald-700">{selectedInvoice.po_number}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Beneficiary:</span>
                  <span className="font-medium text-slate-800">
                    {selectedInvoice.vendor_name || selectedInvoice.vendor_email || 'Vendor'}
                  </span>
                </div>
                <div className="flex items-baseline justify-between border-t border-slate-200 pt-2">
                  <span className="text-xs font-semibold text-slate-700">Total Settlement:</span>
                  <span className="text-lg font-bold text-emerald-700">
                    {formatInr(selectedInvoice.total_amount)}
                  </span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>Base {formatInr(selectedInvoice.subtotal)}</span>
                  <span>GST {formatInr(selectedInvoice.tax_amount)}</span>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">Payment Mode</label>
                <select
                  value={paymentMethod}
                  onChange={(event) => setPaymentMethod(event.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {HOSPITAL_SETTLEMENT_PAYMENT_METHODS.map((method) => (
                    <option key={method.value} value={method.value}>
                      {method.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-slate-700">
                  {isCashPayment
                    ? 'Cash Receipt / Voucher Number (Optional)'
                    : 'Bank Reference / UTR Number *'}
                </label>
                <input
                  type="text"
                  required={!isCashPayment}
                  placeholder={
                    isCashPayment
                      ? 'Leave blank to auto-generate voucher ID'
                      : 'e.g. UTR-2026-XXXX'
                  }
                  value={utrNumber}
                  onChange={(event) => setUtrNumber(event.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <p className="mt-1 text-[10px] text-slate-400">
                  {isCashPayment
                    ? 'A voucher reference like CASH-REC-123456 is generated automatically when left blank.'
                    : 'Enter bank acknowledgement transaction reference for auditing.'}
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedInvoice(null)}
                  className="rounded-lg px-3.5 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessing || (!isCashPayment && !utrNumber.trim())}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50"
                >
                  {isProcessing ? (
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  )}
                  Confirm &amp; Clear Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default VendorPaymentsSection;
