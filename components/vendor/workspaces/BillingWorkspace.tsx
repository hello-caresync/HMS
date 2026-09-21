'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { FileText, Loader2, RefreshCw } from 'lucide-react';

import { VendorFeedbackBanner, useVendorFeedback } from '@/components/vendor/ui/useVendorFeedback';
import { VendorModuleHeader } from '@/components/vendor/ui/VendorModuleHeader';
import { VendorModal, vendorFieldClass, vendorLabelClass } from '@/components/vendor/ui/VendorModal';
import { PROCUREMENT_PO_TABLE } from '@/lib/hospital/procurement';
import { supabase } from '@/lib/supabaseClient';
import { vendorClasses } from '@/lib/vendor/theme';
import { useActiveHospitalCode } from '@/lib/vendor/store/vendor-app-store';
import {
  GST_RATE,
  INVOICEABLE_PO_STATUSES,
  VENDOR_ID,
  computeInvoiceTotals,
  formatInr,
  loadInvoices,
  loadPurchaseOrders,
  resolvePoHospitalName,
  subscribeVendorPortal,
  type Invoice,
  type PurchaseOrder,
} from '@/lib/vendor/v0/portal-service';

function defaultDueDate(): string {
  const due = new Date();
  due.setDate(due.getDate() + 30);
  return due.toISOString().slice(0, 10);
}

function generateInvoiceNumber(): string {
  return `INV-${Date.now().toString().slice(-8)}`;
}

/** Regal Vendor · billing & invoicing engine with GST auto-calc and invoice ledger. */
function BillingWorkspace() {
  const { feedback, showSuccess, showError } = useVendorFeedback();
  const hospitalCode = useActiveHospitalCode();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedPoId, setSelectedPoId] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [dueDate, setDueDate] = useState(defaultDueDate);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [invoiceResult, poResult] = await Promise.all([
        loadInvoices(60, hospitalCode),
        loadPurchaseOrders(60, hospitalCode),
      ]);
      setInvoices(invoiceResult.rows);
      setOrders(poResult.rows);
      setLoadError(invoiceResult.error ?? poResult.error ?? null);
    } catch (error) {
      console.error('[BillingWorkspace] Load error:', error);
      setInvoices([]);
      setOrders([]);
      setLoadError(error instanceof Error ? error.message : 'Could not load invoices.');
    }
  }, [hospitalCode]);

  useEffect(() => {
    setLoading(true);
    void (async () => {
      await load();
      setLoading(false);
    })();
  }, [load]);

  useEffect(
    () => subscribeVendorPortal(() => void load(), undefined, { hospitalCode }),
    [load, hospitalCode],
  );

  const invoiceableOrders = useMemo(
    () =>
      orders.filter((order) =>
        INVOICEABLE_PO_STATUSES.includes(String(order.status ?? '').toUpperCase()),
      ),
    [orders],
  );

  const selectedPo = useMemo(
    () => invoiceableOrders.find((order) => order.id === selectedPoId) ?? null,
    [invoiceableOrders, selectedPoId],
  );

  const totals = useMemo(
    () => (selectedPo ? computeInvoiceTotals(Number(selectedPo.total_amount)) : null),
    [selectedPo],
  );

  const selectedHospitalName = selectedPo
    ? resolvePoHospitalName(selectedPo) || 'Regal Hospital'
    : 'Regal Hospital';

  const outstanding = useMemo(
    () =>
      invoices
        .filter((invoice) => invoice.status.toUpperCase() !== 'PAID')
        .reduce((sum, invoice) => sum + Number(invoice.total_amount ?? 0), 0),
    [invoices],
  );

  const visibleInvoices = invoices;

  const orderLabel = useCallback(
    (poId: string | null) => {
      if (!poId) return '—';
      const match = orders.find((order) => order.id === poId);
      return match ? match.po_number : poId.slice(0, 8);
    },
    [orders],
  );

  const hospitalName = useCallback(
    (invoice: Invoice) => {
      if (invoice.hospital_name) return invoice.hospital_name;
      const match = orders.find((order) => order.id === invoice.po_id);
      return match ? resolvePoHospitalName(match) : 'Regal Hospital';
    },
    [orders],
  );

  const openCreateInvoiceModal = () => {
    setSelectedPoId(invoiceableOrders[0]?.id ?? '');
    setInvoiceNumber(generateInvoiceNumber());
    setDueDate(defaultDueDate());
    setIsModalOpen(true);
  };

  const handleSubmitInvoice = async () => {
    if (!selectedPo || !totals) {
      showError('Select an accepted, dispatched, or goods-receipted purchase order.');
      return;
    }

    if (!invoiceNumber.trim()) {
      showError('Invoice number is required.');
      return;
    }

    setSubmitting(true);

    const subtotal = totals.subtotal;
    const taxAmount = totals.tax_amount;
    const totalAmount = totals.total_amount;
    const hospital = resolvePoHospitalName(selectedPo) || 'Regal Hospital';
    const timestamp = new Date().toISOString();

    const invoicePayload: Record<string, unknown> = {
      invoice_number: invoiceNumber.trim(),
      vendor_id: VENDOR_ID,
      po_id: selectedPo.id,
      po_number: selectedPo.po_number,
      hospital_name: hospital,
      subtotal,
      tax_amount: taxAmount,
      total_amount: totalAmount,
      due_date: dueDate,
      status: 'SUBMITTED',
      created_at: timestamp,
      updated_at: timestamp,
    };

    let { error: invError } = await supabase.from('invoices').insert(invoicePayload);

    if (invError && /column|does not exist/i.test(invError.message)) {
      const trimmed = { ...invoicePayload };
      for (const key of ['po_number', 'hospital_name', 'due_date', 'created_at', 'updated_at']) {
        delete trimmed[key];
        const retry = await supabase.from('invoices').insert(trimmed);
        if (!retry.error) {
          invError = null;
          break;
        }
        invError = retry.error;
      }
    }

    if (invError) {
      console.error('[BillingWorkspace] Invoice insert failed:', invError);
      setSubmitting(false);
      showError(invError.message || 'Failed to create invoice.');
      return;
    }

    let { data: poData, error: poError } = await supabase
      .from(PROCUREMENT_PO_TABLE)
      .update({ status: 'INVOICED', updated_at: timestamp })
      .eq('id', selectedPo.id)
      .select();

    if (poError && /updated_at|column/i.test(poError.message)) {
      ({ data: poData, error: poError } = await supabase
        .from(PROCUREMENT_PO_TABLE)
        .update({ status: 'INVOICED' })
        .eq('id', selectedPo.id)
        .select());
    }

    if (!poError && (!poData || poData.length === 0)) {
      const legacy = await supabase
        .from('purchase_orders')
        .update({ status: 'INVOICED', updated_at: timestamp })
        .eq('id', selectedPo.id)
        .eq('vendor_id', VENDOR_ID)
        .select();
      if (legacy.error) {
        console.warn('[BillingWorkspace] PO status update fallback failed:', legacy.error);
      }
    } else if (poError) {
      console.warn('[BillingWorkspace] Procurement PO status update failed:', poError);
    }

    setSubmitting(false);
    setIsModalOpen(false);
    showSuccess(`Invoice ${invoiceNumber.trim()} submitted successfully.`);
    await load();
  };

  return (
    <div className="space-y-6">
      <VendorModuleHeader
        title="Billing & Payments"
        description={`${formatInr(outstanding)} awaiting hospital settlement · GST @ ${Math.round(GST_RATE * 100)}%.`}
        actions={
          <>
            <button
              type="button"
              onClick={openCreateInvoiceModal}
              disabled={loading}
              className={vendorClasses.btnPrimary}
            >
              <FileText className="h-4 w-4" aria-hidden />
              Create Invoice
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => void load()}
              className={vendorClasses.btnGhost}
            >
              <RefreshCw className="h-4 w-4" aria-hidden />
              Refresh
            </button>
          </>
        }
      />

      <VendorFeedbackBanner feedback={feedback} />

      {loadError ? (
        <p className="rounded-lg border border-vendor-danger/30 bg-vendor-danger/5 px-4 py-2 text-sm font-medium text-vendor-danger">
          {loadError}
        </p>
      ) : null}

      {loading ? (
        <p className="text-sm font-medium text-vendor-muted">Loading invoice ledger…</p>
      ) : visibleInvoices.length === 0 ? (
        <p className="rounded-xl border border-dashed border-vendor-accent/40 px-4 py-10 text-center text-sm font-medium text-vendor-muted">
          No invoices match the selected lifecycle stage.
        </p>
      ) : (
        <div className="w-full overflow-hidden rounded-xl border border-amber-200/70 bg-white shadow-sm">
          <div className="grid grid-cols-12 items-center gap-3 border-b border-amber-100 bg-[#FFF9ED] px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-600">
            <div className="col-span-2">Invoice #</div>
            <div className="col-span-2">Hospital</div>
            <div className="col-span-2">Purchase Order</div>
            <div className="col-span-1">Submitted</div>
            <div className="col-span-1">Due Date</div>
            <div className="col-span-1 text-right">Subtotal</div>
            <div className="col-span-1 text-right">GST (18%)</div>
            <div className="col-span-1 text-right">Total</div>
            <div className="col-span-1 text-center">Status</div>
          </div>

          <div className="divide-y divide-amber-100/60">
            {visibleInvoices.map((inv, index) => (
              <div
                key={inv.id || `${inv.invoice_number}-${index}`}
                className="grid grid-cols-12 items-center gap-3 px-6 py-4 text-xs transition-colors hover:bg-amber-50/40"
              >
                <div className="col-span-2 font-bold text-slate-900">{inv.invoice_number}</div>
                <div className="col-span-2 text-slate-700">{hospitalName(inv)}</div>
                <div className="col-span-2 font-mono text-slate-500">
                  {inv.po_number || orderLabel(inv.po_id)}
                </div>
                <div className="col-span-1 text-slate-500">
                  {new Date(inv.created_at).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                  })}
                </div>
                <div className="col-span-1 text-slate-500">
                  {inv.due_date
                    ? new Date(inv.due_date).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                      })
                    : '-'}
                </div>
                <div className="col-span-1 text-right font-medium text-slate-700">
                  ₹
                  {Number(inv.subtotal ?? inv.total_amount - inv.tax_amount).toLocaleString('en-IN')}
                </div>
                <div className="col-span-1 text-right text-amber-700">
                  ₹{Number(inv.tax_amount ?? 0).toLocaleString('en-IN')}
                </div>
                <div className="col-span-1 text-right font-bold text-slate-900">
                  ₹{Number(inv.total_amount).toLocaleString('en-IN')}
                </div>
                <div className="col-span-1 text-center">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                      inv.status === 'PAID'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {inv.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <VendorModal
        title="Create Invoice"
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        footer={
          invoiceableOrders.length > 0 ? (
            <>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className={vendorClasses.btnGhost}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting || !selectedPo || !totals}
                onClick={() => void handleSubmitInvoice()}
                className={vendorClasses.btnPrimary}
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    Submitting…
                  </>
                ) : (
                  'Submit Invoice'
                )}
              </button>
            </>
          ) : (
            <button type="button" onClick={() => setIsModalOpen(false)} className={vendorClasses.btnGhost}>
              Close
            </button>
          )
        }
      >
        {invoiceableOrders.length === 0 ? (
          <p className="rounded-lg border border-amber-200/60 bg-amber-50/60 px-4 py-3 text-sm font-medium text-amber-900">
            No accepted or dispatched orders available to invoice. Accept a purchase order first.
          </p>
        ) : (
          <div className="space-y-4">
            <label className={vendorLabelClass}>
              Purchase Order
              <select
                required
                value={selectedPoId}
                onChange={(event) => {
                  setSelectedPoId(event.target.value);
                  setInvoiceNumber(generateInvoiceNumber());
                }}
                className={vendorFieldClass}
              >
                <option value="">Select a purchase order…</option>
                {invoiceableOrders.map((order, index) => (
                  <option key={order.id || `${order.po_number}-${index}`} value={order.id}>
                    {order.po_number} · {formatInr(Number(order.total_amount))}
                  </option>
                ))}
              </select>
            </label>

            <label className={vendorLabelClass}>
              Hospital Name
              <input
                readOnly
                value={selectedHospitalName}
                className={`${vendorFieldClass} bg-vendor-cream/60`}
              />
            </label>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <label className={vendorLabelClass}>
                Subtotal
                <input
                  readOnly
                  value={totals ? formatInr(totals.subtotal) : '—'}
                  className={`${vendorFieldClass} bg-vendor-cream/60 font-mono`}
                />
              </label>
              <label className={vendorLabelClass}>
                GST Tax (18%)
                <input
                  readOnly
                  value={totals ? formatInr(totals.tax_amount) : '—'}
                  className={`${vendorFieldClass} bg-vendor-cream/60 font-mono text-amber-800`}
                />
              </label>
              <label className={vendorLabelClass}>
                Total Amount
                <input
                  readOnly
                  value={totals ? formatInr(totals.total_amount) : '—'}
                  className={`${vendorFieldClass} bg-vendor-cream/60 font-mono font-bold`}
                />
              </label>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className={vendorLabelClass}>
                Invoice Number
                <input
                  readOnly
                  value={invoiceNumber}
                  className={`${vendorFieldClass} bg-vendor-cream/60 font-mono`}
                />
              </label>
              <label className={vendorLabelClass}>
                Due Date
                <input
                  type="date"
                  value={dueDate}
                  onChange={(event) => setDueDate(event.target.value)}
                  className={vendorFieldClass}
                />
              </label>
            </div>
          </div>
        )}
      </VendorModal>
    </div>
  );
}

export default BillingWorkspace;
export { BillingWorkspace };
