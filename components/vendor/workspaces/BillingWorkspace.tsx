'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { FileText, RefreshCw } from 'lucide-react';

import { VendorFeedbackBanner, useVendorFeedback } from '@/components/vendor/ui/useVendorFeedback';
import { VendorModuleHeader, VendorStatusPill } from '@/components/vendor/ui/VendorModuleHeader';
import { VendorModal, vendorFieldClass, vendorLabelClass } from '@/components/vendor/ui/VendorModal';
import { vendorClasses } from '@/lib/vendor/theme';
import { matchesInvoiceLifecycle } from '@/lib/vendor/lifecycle';
import { useActiveHospitalCode, useVendorAppStore } from '@/lib/vendor/store/vendor-app-store';
import {
  GST_RATE,
  INVOICEABLE_PO_STATUSES,
  computeInvoiceTotals,
  formatDate,
  formatInr,
  invoiceDueDate,
  loadInvoices,
  loadPurchaseOrders,
  nextInvoiceNumber,
  poItemDetails,
  submitInvoice,
  subscribeVendorPortal,
  type Invoice,
  type PurchaseOrder,
} from '@/lib/vendor/v0/portal-service';

/** Nexora Vendor · billing & invoicing engine with GST auto-calc and invoice ledger. */
function BillingWorkspace() {
  const { feedback, showSuccess, showError } = useVendorFeedback();
  const hospitalCode = useActiveHospitalCode();
  const lifecycleStage = useVendorAppStore((s) => s.workflowStage);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedPoId, setSelectedPoId] = useState('');
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

  const visibleInvoices = useMemo(
    () => invoices.filter((invoice) => matchesInvoiceLifecycle(lifecycleStage, invoice.status)),
    [invoices, lifecycleStage],
  );

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
      return match?.hospital_name ?? 'Regal Hospital';
    },
    [orders],
  );

  const openGenerate = () => {
    setSelectedPoId(invoiceableOrders[0]?.id ?? '');
    setOpen(true);
  };

  const generate = async () => {
    if (!selectedPo || !totals) {
      showError('Select an accepted, dispatched, or goods-receipted purchase order.');
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

    showSuccess(`${invoice_number} submitted · PO marked INVOICED.`);
    setOpen(false);
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
              onClick={openGenerate}
              disabled={loading || invoiceableOrders.length === 0}
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
        <div className={vendorClasses.tableWrap}>
          <table className="w-full min-w-[980px] text-left">
            <thead className="bg-vendor-cream/70">
              <tr>
                <th className={`px-4 py-3 ${vendorClasses.label}`}>Invoice</th>
                <th className={`px-4 py-3 ${vendorClasses.label}`}>Hospital</th>
                <th className={`px-4 py-3 ${vendorClasses.label}`}>Purchase order</th>
                <th className={`px-4 py-3 ${vendorClasses.label}`}>Submitted</th>
                <th className={`px-4 py-3 ${vendorClasses.label}`}>Due date</th>
                <th className={`px-4 py-3 ${vendorClasses.label}`}>Subtotal</th>
                <th className={`px-4 py-3 ${vendorClasses.label}`}>GST</th>
                <th className={`px-4 py-3 ${vendorClasses.label}`}>Total</th>
                <th className={`px-4 py-3 ${vendorClasses.label}`}>Payment</th>
              </tr>
            </thead>
            <tbody>
              {visibleInvoices.map((invoice, index) => (
                <tr
                  key={invoice.id || `${invoice.invoice_number}-${index}`}
                  className="border-t border-vendor-accent/15 text-sm"
                >
                  <td className="px-4 py-3 font-mono font-bold text-vendor-charcoal">
                    {invoice.invoice_number}
                  </td>
                  <td className="px-4 py-3 text-vendor-charcoal">{hospitalName(invoice)}</td>
                  <td className="px-4 py-3 font-mono text-vendor-charcoal">{orderLabel(invoice.po_id)}</td>
                  <td className="px-4 py-3 text-vendor-muted">{formatDate(invoice.created_at)}</td>
                  <td className="px-4 py-3 text-vendor-muted">{invoiceDueDate(invoice)}</td>
                  <td className="px-4 py-3 font-mono text-vendor-charcoal">
                    {formatInr(Number(invoice.subtotal ?? invoice.total_amount - invoice.tax_amount))}
                  </td>
                  <td className="px-4 py-3 font-mono text-vendor-charcoal">
                    {formatInr(Number(invoice.tax_amount ?? 0))}
                  </td>
                  <td className="px-4 py-3 font-mono font-bold text-vendor-charcoal">
                    {formatInr(Number(invoice.total_amount))}
                  </td>
                  <td className="px-4 py-3">
                    <VendorStatusPill label={invoice.status} tone={invoice.status === 'PAID' ? 'success' : 'warning'} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <VendorModal
        title="Create invoice"
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
            No purchase orders are ready for invoicing yet (accepted, dispatched, or goods receipt).
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
                    {order.po_number} · {order.hospital_name} · {poItemDetails(order)} · {order.status}
                  </option>
                ))}
              </select>
            </label>

            {totals && selectedPo ? (
              <dl className="space-y-2 rounded-xl border border-vendor-accent/20 bg-vendor-cream/60 p-4 text-sm">
                <div className="flex justify-between">
                  <dt className="font-medium text-vendor-muted">Items</dt>
                  <dd className="font-medium text-vendor-charcoal">{poItemDetails(selectedPo)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="font-medium text-vendor-muted">Subtotal</dt>
                  <dd className="font-mono font-bold text-vendor-charcoal">{formatInr(totals.subtotal)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="font-medium text-vendor-muted">GST @ {Math.round(GST_RATE * 100)}%</dt>
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
              <p className="text-sm font-medium text-vendor-muted">Pick an order to preview the GST breakdown.</p>
            )}
          </div>
        )}
      </VendorModal>
    </div>
  );
}

export default BillingWorkspace;
export { BillingWorkspace };
