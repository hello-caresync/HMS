'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { FileText, RefreshCw } from 'lucide-react';

import { VendorFeedbackBanner, useVendorFeedback } from '@/components/vendor/ui/useVendorFeedback';
import { VendorModuleHeader, VendorStatusPill } from '@/components/vendor/ui/VendorModuleHeader';
import { VendorModal, vendorFieldClass, vendorLabelClass } from '@/components/vendor/ui/VendorModal';
import { vendorClasses } from '@/lib/vendor/theme';
import {
  GST_RATE,
  INVOICEABLE_PO_STATUSES,
  computeInvoiceTotals,
  formatDate,
  formatInr,
  invoiceStatusTone,
  loadInvoices,
  loadPurchaseOrders,
  nextInvoiceNumber,
  submitInvoice,
  subscribeVendorPortal,
  type Invoice,
  type PurchaseOrder,
} from '@/lib/vendor/v0/portal-service';

/** Nexora Vendor · V0 billing workspace: raise GST invoices and track payouts. */
function InvoicesWorkspace() {
  const { feedback, showSuccess, showError } = useVendorFeedback();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedPoId, setSelectedPoId] = useState('');

  const load = useCallback(async () => {
    const [invoiceResult, poResult] = await Promise.all([loadInvoices(), loadPurchaseOrders()]);
    setInvoices(invoiceResult.rows);
    setOrders(poResult.rows);
    if (invoiceResult.error) showError(invoiceResult.error);
    if (poResult.error) showError(poResult.error);
  }, [showError]);

  useEffect(() => {
    void (async () => {
      await load();
      setLoading(false);
    })();
  }, [load]);

  useEffect(() => subscribeVendorPortal(() => void load()), [load]);

  const invoiceableOrders = useMemo(
    () => orders.filter((order) => INVOICEABLE_PO_STATUSES.includes(order.status.toUpperCase())),
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

  const outstanding = useMemo(
    () =>
      invoices
        .filter((invoice) => invoice.status.toUpperCase() !== 'PAID')
        .reduce((sum, invoice) => sum + Number(invoice.total_amount ?? 0), 0),
    [invoices],
  );

  const orderLabel = useCallback(
    (poId: string | null) => {
      if (!poId) return '—';
      const match = orders.find((order) => order.id === poId);
      return match ? match.po_number : poId.slice(0, 8);
    },
    [orders],
  );

  const openGenerate = () => {
    setSelectedPoId(invoiceableOrders[0]?.id ?? '');
    setOpen(true);
  };

  const generate = async () => {
    if (!selectedPo || !totals) {
      showError('Select a dispatched or received purchase order.');
      return;
    }

    const invoice_number = nextInvoiceNumber();
    setSubmitting(true);
    const result = await submitInvoice({
      po_id: selectedPo.id,
      invoice_number,
      subtotal: totals.subtotal,
      tax_amount: totals.tax_amount,
      total_amount: totals.total_amount,
    });
    setSubmitting(false);

    if (!result.ok) {
      showError(result.error ?? 'Invoice submission failed.');
      return;
    }

    showSuccess(`${invoice_number} submitted for payout.`);
    setOpen(false);
    await load();
  };

  return (
    <div className="space-y-6">
      <VendorModuleHeader
        title="Invoices & Payouts"
        description={`${formatInr(outstanding)} awaiting hospital settlement · GST charged at ${Math.round(GST_RATE * 100)}%.`}
        actions={
          <>
            <button
              type="button"
              onClick={openGenerate}
              disabled={loading || invoiceableOrders.length === 0}
              className={vendorClasses.btnPrimary}
            >
              <FileText className="h-4 w-4" aria-hidden />
              Generate Invoice
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

      {loading ? (
        <p className="text-sm font-medium text-vendor-muted">Loading invoices…</p>
      ) : invoices.length === 0 ? (
        <p className="rounded-xl border border-dashed border-vendor-accent/40 px-4 py-10 text-center text-sm font-medium text-vendor-muted">
          No invoices submitted yet. Dispatch an order, then raise its invoice here.
        </p>
      ) : (
        <div className={vendorClasses.tableWrap}>
          <table className="w-full min-w-[820px] text-left">
            <thead className="bg-vendor-cream/70">
              <tr>
                <th className={`px-4 py-3 ${vendorClasses.label}`}>Invoice</th>
                <th className={`px-4 py-3 ${vendorClasses.label}`}>Purchase order</th>
                <th className={`px-4 py-3 ${vendorClasses.label}`}>Submitted</th>
                <th className={`px-4 py-3 ${vendorClasses.label}`}>GST</th>
                <th className={`px-4 py-3 ${vendorClasses.label}`}>Total payable</th>
                <th className={`px-4 py-3 ${vendorClasses.label}`}>Payout</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice, index) => (
                <tr
                  key={invoice.id || `${invoice.invoice_number}-${index}`}
                  className="border-t border-vendor-accent/15 text-sm"
                >
                  <td className="px-4 py-3 font-mono font-bold text-vendor-charcoal">
                    {invoice.invoice_number}
                  </td>
                  <td className="px-4 py-3 text-vendor-charcoal">{orderLabel(invoice.po_id)}</td>
                  <td className="px-4 py-3 text-vendor-muted">{formatDate(invoice.created_at)}</td>
                  <td className="px-4 py-3 font-mono text-vendor-charcoal">
                    {formatInr(Number(invoice.tax_amount ?? 0))}
                  </td>
                  <td className="px-4 py-3 font-mono font-bold text-vendor-charcoal">
                    {formatInr(Number(invoice.total_amount))}
                  </td>
                  <td className="px-4 py-3">
                    <VendorStatusPill label={invoice.status} tone={invoiceStatusTone(invoice.status)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <VendorModal
        title="Generate invoice"
        open={open}
        onClose={() => setOpen(false)}
        footer={
          <>
            <button type="button" onClick={() => setOpen(false)} className={vendorClasses.btnGhost}>
              Cancel
            </button>
            <button
              type="button"
              disabled={submitting || !totals}
              onClick={() => void generate()}
              className={vendorClasses.btnPrimary}
            >
              {submitting ? 'Submitting…' : 'Submit invoice'}
            </button>
          </>
        }
      >
        {invoiceableOrders.length === 0 ? (
          <p className="text-sm font-medium text-vendor-muted">
            No purchase orders are dispatched or goods-receipted yet.
          </p>
        ) : (
          <div className="space-y-4">
            <label className={vendorLabelClass}>
              Purchase order
              <select
                value={selectedPoId}
                onChange={(event) => setSelectedPoId(event.target.value)}
                className={vendorFieldClass}
              >
                <option value="">Select a purchase order…</option>
                {invoiceableOrders.map((order, index) => (
                  <option key={order.id || `${order.po_number}-${index}`} value={order.id}>
                    {order.po_number} · {order.hospital_name} · {order.status}
                  </option>
                ))}
              </select>
            </label>

            {totals ? (
              <dl className="space-y-2 rounded-xl border border-vendor-accent/20 bg-vendor-cream/60 p-4 text-sm">
                <div className="flex justify-between">
                  <dt className="font-medium text-vendor-muted">Order subtotal</dt>
                  <dd className="font-mono font-bold text-vendor-charcoal">{formatInr(totals.subtotal)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="font-medium text-vendor-muted">
                    GST @ {Math.round(GST_RATE * 100)}%
                  </dt>
                  <dd className="font-mono font-bold text-vendor-charcoal">{formatInr(totals.tax_amount)}</dd>
                </div>
                <div className="flex justify-between border-t border-vendor-accent/30 pt-2">
                  <dt className="font-black text-vendor-charcoal">Total payable</dt>
                  <dd className="font-mono font-black text-vendor-secondary">
                    {formatInr(totals.total_amount)}
                  </dd>
                </div>
              </dl>
            ) : (
              <p className="text-sm font-medium text-vendor-muted">
                Pick an order to preview the GST breakdown.
              </p>
            )}
          </div>
        )}
      </VendorModal>
    </div>
  );
}

export default InvoicesWorkspace;
export { InvoicesWorkspace };
