'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { supabase } from '@/lib/supabaseClient';
import { DEFAULT_VENDOR_ID, PO_STATUS_DB, PO_STATUS_FILTERS, type PoStatusFilter } from '@/lib/vendor-supabase/constants';
import type { PurchaseOrderRow } from '@/lib/vendor-supabase/types';
import { formatINR } from '@/lib/utils/currency';

type Toast = { type: 'success' | 'error'; message: string } | null;

type DispatchForm = {
  carrier_name: string;
  tracking_number: string;
  driver_contact: string;
};

const emptyDispatch: DispatchForm = { carrier_name: '', tracking_number: '', driver_contact: '' };

function formatMoney(value: number) {
  return formatINR(value, { maximumFractionDigits: 2 });
}

function statusBadgeClass(status: PurchaseOrderRow['status']) {
  switch (status) {
    case 'ISSUED':
      return 'bg-sky-100 text-sky-800';
    case 'ACCEPTED':
      return 'bg-emerald-100 text-emerald-800';
    case 'REJECTED':
      return 'bg-red-100 text-red-800';
    case 'PARTIAL':
      return 'bg-amber-100 text-amber-900';
    case 'COMPLETED':
      return 'bg-teal-100 text-teal-900';
    case 'CANCELLED':
      return 'bg-slate-200 text-slate-700';
    default:
      return 'bg-slate-100 text-slate-700';
  }
}

export default function PurchaseOrdersPage() {
  const [orders, setOrders] = useState<PurchaseOrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<PoStatusFilter>('All');
  const [toast, setToast] = useState<Toast>(null);
  const [actionId, setActionId] = useState<string | null>(null);

  const [dispatchPo, setDispatchPo] = useState<PurchaseOrderRow | null>(null);
  const [dispatchForm, setDispatchForm] = useState<DispatchForm>(emptyDispatch);
  const [dispatchSaving, setDispatchSaving] = useState(false);

  const [invoicePo, setInvoicePo] = useState<PurchaseOrderRow | null>(null);
  const [invoiceSaving, setInvoiceSaving] = useState(false);

  const [selectedPoIds, setSelectedPoIds] = useState<string[]>([]);
  const [bulkSubmitting, setBulkSubmitting] = useState(false);

  const showToast = (next: Toast) => {
    setToast(next);
    if (next) window.setTimeout(() => setToast(null), 4000);
  };

  const loadOrders = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('purchase_orders')
      .select('*')
      .eq('vendor_id', DEFAULT_VENDOR_ID)
      .order('created_at', { ascending: false });

    if (error) {
      showToast({ type: 'error', message: error.message });
      setOrders([]);
    } else {
      setOrders((data as PurchaseOrderRow[]) ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  const filtered = useMemo(() => {
    if (filter === 'All') return orders;
    const dbStatus = PO_STATUS_DB[filter];
    return orders.filter((o) => o.status === dbStatus);
  }, [filter, orders]);

  const updateStatus = async (poId: string, status: PurchaseOrderRow['status']) => {
    setActionId(poId);
    setOrders((prev) => prev.map((o) => (o.id === poId ? { ...o, status } : o)));

    const { error } = await supabase.from('purchase_orders').update({ status }).eq('id', poId);

    setActionId(null);

    if (error) {
      showToast({ type: 'error', message: error.message });
      await loadOrders();
      return;
    }

    showToast({ type: 'success', message: `Order marked as ${status}.` });
  };

  const toggleSelectPo = (id: string) => {
    setSelectedPoIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleBulkAccept = async () => {
    if (selectedPoIds.length === 0) {
      window.alert('Please select at least one item.');
      return;
    }
    setBulkSubmitting(true);
    const { error } = await supabase
      .from('purchase_orders')
      .update({ status: 'ACCEPTED' })
      .in('id', selectedPoIds);

    setBulkSubmitting(false);

    if (error) {
      window.alert(`Error: ${error.message}`);
      return;
    }

    window.alert('Selected orders accepted successfully!');
    setSelectedPoIds([]);
    await loadOrders();
  };

  const handleDispatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dispatchPo) return;
    setDispatchSaving(true);

    const dispatchedAt = new Date().toISOString();
    const { error: shipError } = await supabase.from('shipments').insert([
      {
        po_id: dispatchPo.id,
        tracking_number: dispatchForm.tracking_number.trim(),
        carrier_name: dispatchForm.carrier_name.trim(),
        driver_contact: dispatchForm.driver_contact.trim(),
        status: 'DISPATCHED',
        dispatched_at: dispatchedAt,
      },
    ]);

    if (shipError) {
      setDispatchSaving(false);
      showToast({ type: 'error', message: shipError.message });
      return;
    }

    const nextStatus: PurchaseOrderRow['status'] = 'PARTIAL';
    const { error: poError } = await supabase
      .from('purchase_orders')
      .update({ status: nextStatus })
      .eq('id', dispatchPo.id);

    setDispatchSaving(false);

    if (poError) {
      showToast({ type: 'error', message: poError.message });
      await loadOrders();
      return;
    }

    setOrders((prev) => prev.map((o) => (o.id === dispatchPo.id ? { ...o, status: nextStatus } : o)));
    showToast({ type: 'success', message: 'Shipment dispatched and PO updated.' });
    setDispatchPo(null);
    setDispatchForm(emptyDispatch);
    await loadOrders();
  };

  const invoicePreview = useMemo(() => {
    if (!invoicePo) return null;
    const subtotal = Number(invoicePo.total_amount);
    const tax_amount = subtotal * 0.18;
    const total_amount = subtotal + tax_amount;
    return { subtotal, tax_amount, total_amount };
  }, [invoicePo]);

  const handleInvoiceSubmit = async () => {
    if (!invoicePo || !invoicePreview) return;
    setInvoiceSaving(true);

    const due = new Date();
    due.setDate(due.getDate() + 30);

    const { error } = await supabase.from('invoices').insert([
      {
        invoice_number: `INV-${Date.now()}`,
        po_id: invoicePo.id,
        vendor_id: DEFAULT_VENDOR_ID,
        subtotal: invoicePreview.subtotal,
        tax_amount: invoicePreview.tax_amount,
        total_amount: invoicePreview.total_amount,
        status: 'SUBMITTED',
        due_date: due.toISOString().slice(0, 10),
      },
    ]);

    setInvoiceSaving(false);

    if (error) {
      showToast({ type: 'error', message: error.message });
      return;
    }

    showToast({ type: 'success', message: 'Invoice submitted to hospital billing.' });
    setInvoicePo(null);
    await loadOrders();
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 font-sans text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-black">Purchase Orders</h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Accept/reject, dispatch logistics, and generate invoices · Supabase live
            </p>
          </div>
          <button
            type="button"
            disabled={bulkSubmitting || loading}
            onClick={() => void handleBulkAccept()}
            className="rounded-xl bg-teal-700 px-4 py-2 text-xs font-bold text-white hover:bg-teal-800 disabled:opacity-60"
          >
            {bulkSubmitting ? 'Accepting…' : 'Bulk accept selected'}
          </button>
        </header>

        {toast ? (
          <div
            role="status"
            className={`rounded-lg border px-4 py-3 text-sm font-medium ${
              toast.type === 'success'
                ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
                : 'border-red-300 bg-red-50 text-red-800'
            }`}
          >
            {toast.message}
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2">
          {PO_STATUS_FILTERS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setFilter(tab)}
              className={`rounded-full px-4 py-1.5 text-xs font-bold ${
                filter === tab
                  ? 'bg-slate-900 text-white dark:bg-teal-600'
                  : 'bg-white text-slate-600 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-sm text-slate-500">Loading purchase orders…</p>
        ) : (
          <ul className="space-y-4">
            {filtered.length === 0 ? (
              <li className="rounded-xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500">
                No orders in this filter.
              </li>
            ) : (
              filtered.map((po) => (
                <li
                  key={po.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        className="mt-1"
                        checked={selectedPoIds.includes(po.id)}
                        onChange={() => toggleSelectPo(po.id)}
                        aria-label={`Select ${po.po_number}`}
                      />
                      <div>
                      <p className="font-mono text-sm font-black">{po.po_number}</p>
                      <p className="mt-1 text-sm font-semibold">{po.hospital_name}</p>
                      <p className="mt-2 text-xs text-slate-500">
                        Deadline: {po.delivery_deadline} · Total {formatMoney(Number(po.total_amount))}
                      </p>
                      </div>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase ${statusBadgeClass(po.status)}`}>
                      {po.status}
                    </span>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {po.status === 'ISSUED' ? (
                      <>
                        <button
                          type="button"
                          disabled={actionId === po.id}
                          onClick={() => void updateStatus(po.id, 'ACCEPTED')}
                          className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
                        >
                          Accept Order
                        </button>
                        <button
                          type="button"
                          disabled={actionId === po.id}
                          onClick={() => void updateStatus(po.id, 'REJECTED')}
                          className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-60"
                        >
                          Reject Order
                        </button>
                      </>
                    ) : null}

                    {po.status === 'ACCEPTED' ? (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setDispatchPo(po);
                            setDispatchForm(emptyDispatch);
                          }}
                          className="rounded-lg bg-teal-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-teal-800"
                        >
                          Dispatch Shipment
                        </button>
                        <button
                          type="button"
                          onClick={() => setInvoicePo(po)}
                          className="rounded-lg border border-teal-600 px-3 py-1.5 text-xs font-bold text-teal-800 dark:text-teal-300"
                        >
                          Generate Invoice
                        </button>
                      </>
                    ) : null}

                    {po.status === 'PARTIAL' ? (
                      <button
                        type="button"
                        onClick={() => setInvoicePo(po)}
                        className="rounded-lg border border-teal-600 px-3 py-1.5 text-xs font-bold text-teal-800 dark:text-teal-300"
                      >
                        Generate Invoice
                      </button>
                    ) : null}
                  </div>
                </li>
              ))
            )}
          </ul>
        )}
      </div>

      {dispatchPo ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-900">
            <h2 className="text-lg font-black">Dispatch shipment</h2>
            <p className="mt-1 text-xs text-slate-500">{dispatchPo.po_number}</p>
            <form onSubmit={handleDispatchSubmit} className="mt-4 space-y-3">
              <label className="block text-xs font-bold uppercase text-slate-500">
                Carrier name
                <input
                  required
                  value={dispatchForm.carrier_name}
                  onChange={(e) => setDispatchForm((f) => ({ ...f, carrier_name: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950"
                />
              </label>
              <label className="block text-xs font-bold uppercase text-slate-500">
                Tracking / AWB
                <input
                  required
                  value={dispatchForm.tracking_number}
                  onChange={(e) => setDispatchForm((f) => ({ ...f, tracking_number: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950"
                />
              </label>
              <label className="block text-xs font-bold uppercase text-slate-500">
                Driver contact
                <input
                  required
                  value={dispatchForm.driver_contact}
                  onChange={(e) => setDispatchForm((f) => ({ ...f, driver_contact: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-950"
                />
              </label>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setDispatchPo(null)} className="rounded-lg border px-4 py-2 text-sm font-bold">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={dispatchSaving}
                  className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
                >
                  {dispatchSaving ? 'Dispatching…' : 'Confirm dispatch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {invoicePo && invoicePreview ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-900">
            <h2 className="text-lg font-black">Generate invoice</h2>
            <p className="mt-1 text-xs text-slate-500">{invoicePo.po_number} · {invoicePo.hospital_name}</p>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-500">Subtotal</dt>
                <dd className="font-mono font-bold">{formatMoney(invoicePreview.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">GST (18%)</dt>
                <dd className="font-mono font-bold">{formatMoney(invoicePreview.tax_amount)}</dd>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2 dark:border-slate-700">
                <dt className="font-bold">Total</dt>
                <dd className="font-mono font-black text-teal-800 dark:text-teal-300">
                  {formatMoney(invoicePreview.total_amount)}
                </dd>
              </div>
              <p className="text-xs text-slate-500">Due date: 30 days from submission · Status SUBMITTED</p>
            </dl>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setInvoicePo(null)} className="rounded-lg border px-4 py-2 text-sm font-bold">
                Cancel
              </button>
              <button
                type="button"
                disabled={invoiceSaving}
                onClick={() => void handleInvoiceSubmit()}
                className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
              >
                {invoiceSaving ? 'Submitting…' : 'Submit invoice'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
