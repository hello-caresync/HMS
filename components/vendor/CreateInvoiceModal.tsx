'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2, X } from 'lucide-react';

import { supabase } from '@/lib/supabaseClient';
import {
  computeVendorInvoiceTotals,
  defaultInvoiceDueDate,
  fetchBillablePurchaseOrdersDirect,
  generateVendorInvoiceNumber,
  mergeBillablePurchaseOrders,
  type BillablePurchaseOrder,
  type VendorBillingIdentity,
} from '@/lib/vendor/billing';
import { formatInr } from '@/lib/vendor/v0/portal-service';

type CreateInvoiceModalProps = {
  isOpen: boolean;
  onClose: () => void;
  billableOrders?: BillablePurchaseOrder[];
  vendor?: VendorBillingIdentity;
  busy?: boolean;
  onSubmit: (input: {
    po_id: string;
    invoice_number: string;
    subtotal: number;
    tax_amount: number;
    total_amount: number;
    hospital_name: string;
    item_description: string;
    po_number: string;
    due_date: string;
    order: BillablePurchaseOrder;
  }) => Promise<void>;
};

function formatOrderOptionLabel(order: BillablePurchaseOrder): string {
  return `${order.po_number} - ${order.item_description} (${formatInr(order.total_amount)})`;
}

function resolveSelectedOrder(
  orders: BillablePurchaseOrder[],
  poId: string,
): BillablePurchaseOrder | null {
  if (!poId) return null;
  return (
    orders.find((order) => order.id === poId) ??
    orders.find((order) => order.po_number === poId) ??
    null
  );
}

export function CreateInvoiceModal({
  isOpen,
  onClose,
  billableOrders = [],
  vendor,
  busy = false,
  onSubmit,
}: CreateInvoiceModalProps) {
  const [poId, setPoId] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState(generateVendorInvoiceNumber());
  const [dueDate, setDueDate] = useState(defaultInvoiceDueDate());
  const [localOrders, setLocalOrders] = useState<BillablePurchaseOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  const availableOrders = useMemo(
    () => mergeBillablePurchaseOrders(billableOrders, localOrders),
    [billableOrders, localOrders],
  );

  const selectedOrder = useMemo(
    () => resolveSelectedOrder(availableOrders, poId),
    [availableOrders, poId],
  );

  const totals = useMemo(() => {
    const subtotal = Number(selectedOrder?.total_amount ?? 0);
    return computeVendorInvoiceTotals(subtotal);
  }, [selectedOrder]);

  useEffect(() => {
    if (!isOpen) return;

    setInvoiceNumber(generateVendorInvoiceNumber());
    setDueDate(defaultInvoiceDueDate());

    if (!supabase) return;

    setLoadingOrders(true);
    void fetchBillablePurchaseOrdersDirect(vendor ?? {}, supabase)
      .then((orders) => {
        setLocalOrders(orders);
        setPoId(orders[0]?.id ?? orders[0]?.po_number ?? '');
      })
      .catch(() => {
        setLocalOrders([]);
        setPoId('');
      })
      .finally(() => {
        setLoadingOrders(false);
      });
  }, [isOpen, vendor?.id, vendor?.email, vendor?.company_name]);

  if (!isOpen) return null;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedOrder) return;

    await onSubmit({
      po_id: selectedOrder.id,
      invoice_number: invoiceNumber,
      subtotal: totals.subtotal,
      tax_amount: totals.tax_amount,
      total_amount: totals.total_amount,
      hospital_name: selectedOrder.hospital_name,
      item_description: selectedOrder.item_description,
      po_number: selectedOrder.po_number,
      due_date: dueDate,
      order: selectedOrder,
    });
  };

  const showEmptyWarning = !loadingOrders && availableOrders.length === 0;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <form
        onSubmit={(event) => void handleSubmit(event)}
        className="w-full max-w-lg space-y-3 rounded-3xl border border-slate-200 bg-white p-6 text-xs shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-sm font-bold text-slate-900">Create Invoice</h3>
          <button type="button" disabled={busy} onClick={onClose} className="text-slate-400">
            <X className="h-5 w-5" />
          </button>
        </div>

        {loadingOrders ? (
          <div className="flex items-center justify-center gap-2 rounded-xl border border-slate-100 bg-slate-50 py-8 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin text-amber-500" aria-hidden />
            Loading billable purchase orders…
          </div>
        ) : showEmptyWarning ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[11px] text-amber-900">
            No accepted, dispatched, in-transit, or delivered orders are available to invoice yet.
          </div>
        ) : (
          <>
            <label className="block font-bold uppercase text-slate-600">
              Purchase order *
              <select
                required
                disabled={busy}
                value={poId}
                onChange={(event) => setPoId(event.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-medium normal-case"
              >
                <option value="">Select purchase order</option>
                {availableOrders.map((order) => (
                  <option key={order.id || order.po_number} value={order.id || order.po_number}>
                    {formatOrderOptionLabel(order)}
                  </option>
                ))}
              </select>
            </label>

            {selectedOrder ? (
              <div className="rounded-xl border border-amber-100 bg-amber-50/60 p-3 text-[11px] text-slate-700">
                <p>
                  <span className="font-semibold">PO Number:</span> {selectedOrder.po_number}
                </p>
                <p>
                  <span className="font-semibold">Hospital:</span> {selectedOrder.hospital_name}
                </p>
                <p>
                  <span className="font-semibold">Item:</span> {selectedOrder.item_description}
                </p>
              </div>
            ) : null}

            <label className="block font-bold uppercase text-slate-600">
              Invoice number
              <input
                required
                disabled={busy}
                value={invoiceNumber}
                onChange={(event) => setInvoiceNumber(event.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-mono font-medium normal-case"
              />
            </label>

            <label className="block font-bold uppercase text-slate-600">
              Due date
              <input
                type="date"
                required
                disabled={busy}
                value={dueDate}
                onChange={(event) => setDueDate(event.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-medium normal-case"
              />
            </label>

            <div className="grid grid-cols-2 gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3 sm:grid-cols-4">
              <div>
                <p className="text-[10px] font-bold uppercase text-slate-500">Subtotal</p>
                <p className="mt-1 font-semibold text-slate-900">{formatInr(totals.subtotal)}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase text-slate-500">GST @ 18%</p>
                <p className="mt-1 font-semibold text-slate-900">{formatInr(totals.tax_amount)}</p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-[10px] font-bold uppercase text-slate-500">Final Payable Amount</p>
                <p className="mt-1 text-base font-black text-slate-900">{formatInr(totals.total_amount)}</p>
              </div>
            </div>
          </>
        )}

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
            disabled={busy || loadingOrders || !selectedOrder}
            className="rounded-lg bg-amber-500 px-5 py-2 text-xs font-semibold text-white disabled:opacity-60"
          >
            {busy ? 'Submitting…' : 'Submit Invoice to Hospital'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default CreateInvoiceModal;
