'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Download, Eye, Plus, RefreshCw, Receipt } from 'lucide-react';
import { toast } from 'sonner';

import { CreateInvoiceModal } from '@/components/vendor/CreateInvoiceModal';
import { VendorModuleHeader } from '@/components/vendor/ui/VendorModuleHeader';
import { getVendorSession, type VendorSession } from '@/lib/auth/ecosystem-sessions';
import { extractSupabaseErrorMessage, logSupabaseQueryError } from '@/lib/hospital/procurement';
import { supabase } from '@/lib/supabaseClient';
import {
  createVendorInvoice,
  downloadVendorInvoiceReceipt,
  fetchVendorBillingSnapshot,
  paymentStatusBadgeClass,
  paymentStatusLabel,
  PROCUREMENT_PO_TABLE,
  type BillablePurchaseOrder,
  type VendorInvoiceRow,
} from '@/lib/vendor/billing';
import { vendorClasses } from '@/lib/vendor/theme';
import { formatDate, formatInr } from '@/lib/vendor/v0/portal-service';

function readVendorSession(): VendorSession | null {
  if (typeof window === 'undefined') return null;
  return getVendorSession();
}

export function BillingPaymentsWorkspace() {
  const [invoices, setInvoices] = useState<VendorInvoiceRow[]>([]);
  const [billableOrders, setBillableOrders] = useState<BillablePurchaseOrder[]>([]);
  const [awaitingSettlementTotal, setAwaitingSettlementTotal] = useState(0);
  const [readyForInvoicingCount, setReadyForInvoicingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [vendorId, setVendorId] = useState('');
  const [vendorEmail, setVendorEmail] = useState('');
  const [vendorName, setVendorName] = useState('');

  const vendorKey = vendorId || vendorEmail || vendorName;
  const fetchInFlightRef = useRef(false);
  const fetchBillingRef = useRef<(options?: { silent?: boolean }) => Promise<void>>(async () => {});

  useEffect(() => {
    const session = readVendorSession();
    if (!session) return;
    setVendorId(session.id?.trim() ?? '');
    setVendorEmail((session.email ?? session.rep_email ?? '').trim().toLowerCase());
    setVendorName((session.company_name ?? session.vendor_name ?? '').trim());
  }, []);

  const fetchBilling = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!supabase || fetchInFlightRef.current) return;

      fetchInFlightRef.current = true;
      if (!options?.silent) setLoading(true);

      try {
        const snapshot = await fetchVendorBillingSnapshot(
          {
            id: vendorId || undefined,
            email: vendorEmail || undefined,
            company_name: vendorName || undefined,
          },
          supabase,
        );

        setInvoices(snapshot.invoices);
        setBillableOrders(snapshot.billableOrders);
        setAwaitingSettlementTotal(snapshot.metrics.awaitingSettlementTotal);
        setReadyForInvoicingCount(snapshot.metrics.readyForInvoicingCount);
      } catch (err: unknown) {
        logSupabaseQueryError('BillingPaymentsWorkspace.fetchBilling', err);
        if (!options?.silent) {
          toast.error(extractSupabaseErrorMessage(err, 'Could not load billing data'));
        }
        setInvoices([]);
        setBillableOrders([]);
        setAwaitingSettlementTotal(0);
        setReadyForInvoicingCount(0);
      } finally {
        setLoading(false);
        fetchInFlightRef.current = false;
      }
    },
    [vendorEmail, vendorId, vendorName],
  );

  fetchBillingRef.current = fetchBilling;

  useEffect(() => {
    if (!supabase) return;
    void fetchBillingRef.current({ silent: false });

    const channel = supabase
      .channel(`vendor-billing-${vendorKey || 'anonymous'}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: PROCUREMENT_PO_TABLE },
        () => {
          void fetchBillingRef.current({ silent: true });
        },
      )
      .subscribe();

    const invoiceChannel = supabase
      .channel(`vendor-invoices-${vendorKey || 'anonymous'}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'vendor_invoices' },
        () => {
          void fetchBillingRef.current({ silent: true });
        },
      )
      .subscribe();

    const legacyInvoiceChannel = supabase
      .channel(`vendor-invoices-legacy-${vendorKey || 'anonymous'}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'invoices' },
        () => {
          void fetchBillingRef.current({ silent: true });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
      void supabase.removeChannel(invoiceChannel);
      void supabase.removeChannel(legacyInvoiceChannel);
    };
  }, [vendorKey]);

  const subtitle = useMemo(() => {
    const parts = [
      `${formatInr(awaitingSettlementTotal)} awaiting hospital settlement`,
      `${readyForInvoicingCount} order${readyForInvoicingCount === 1 ? '' : 's'} ready to invoice`,
    ];
    return parts.join(' · ');
  }, [awaitingSettlementTotal, readyForInvoicingCount]);

  const handleCreateInvoice = async (input: {
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
  }) => {
    if (!supabase) return;

    const order = input.order;

    setCreating(true);
    try {
      const result = await createVendorInvoice(
        input,
        {
          id: vendorId || undefined,
          email: vendorEmail || undefined,
          company_name: vendorName || undefined,
        },
        order,
        supabase,
      );

      if (!result.ok || !result.invoice) {
        throw new Error(result.error || 'Could not generate invoice');
      }

      setInvoices((prev) => [result.invoice!, ...prev.filter((row) => row.id !== result.invoice!.id)]);
      setBillableOrders((prev) => prev.filter((row) => row.id !== input.po_id));
      setAwaitingSettlementTotal((prev) => prev + result.invoice!.total_amount);
      setReadyForInvoicingCount((prev) => Math.max(0, prev - 1));

      toast.success(
        result.error
          ? `Invoice ${input.invoice_number} submitted successfully (${result.error})`
          : `Invoice ${input.invoice_number} submitted successfully`,
      );
      setIsModalOpen(false);
      await fetchBillingRef.current({ silent: true });
    } catch (err: unknown) {
      toast.error(extractSupabaseErrorMessage(err, 'Could not generate invoice'));
      await fetchBillingRef.current({ silent: true });
    } finally {
      setCreating(false);
    }
  };

  const previewInvoice = (invoice: VendorInvoiceRow) => {
    const html = `<html><body style="font-family:Arial;padding:24px">${invoice.invoice_number}<br/>PO ${invoice.po_number}<br/>Total ${formatInr(invoice.total_amount)}</body></html>`;
    const popup = window.open('', '_blank', 'noopener,noreferrer,width=720,height=900');
    if (popup) {
      popup.document.write(html);
      popup.document.close();
    }
  };

  return (
    <div className="space-y-6">
      <VendorModuleHeader
        title="Billing & Payments"
        description={subtitle}
        actions={
          <>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className={vendorClasses.btnPrimary}
            >
              <Plus className="h-4 w-4" aria-hidden />
              Create Invoice
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => void fetchBilling({ silent: false })}
              className={vendorClasses.btnGhost}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} aria-hidden />
              Refresh
            </button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-[#dcc2f9]/50 bg-[#faf7fe]/80 px-4 py-3">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-vendor-muted">
            <Receipt className="h-3.5 w-3.5" />
            Awaiting Settlement
          </div>
          <div className="mt-1 text-2xl font-black text-vendor-charcoal">{formatInr(awaitingSettlementTotal)}</div>
        </div>
        <div className="rounded-2xl border border-teal-100 bg-teal-50/70 px-4 py-3">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-teal-700">
            <Plus className="h-3.5 w-3.5" />
            Ready for Invoicing
          </div>
          <div className="mt-1 text-2xl font-black text-teal-900">{readyForInvoicingCount}</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-600">
            <Receipt className="h-3.5 w-3.5" />
            Active Invoices
          </div>
          <div className="mt-1 text-2xl font-black text-slate-900">{invoices.length}</div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-[#dcc2f9]/70 bg-white shadow-sm">
        <div className="grid grid-cols-12 items-center gap-4 border-b border-[#dcc2f9]/50 bg-[#faf7fe] px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-600">
          <div className="col-span-2">Invoice & Date</div>
          <div className="col-span-2">Reference PO</div>
          <div className="col-span-2">Hospital</div>
          <div className="col-span-2">Base & GST</div>
          <div className="col-span-1 text-right">Total</div>
          <div className="col-span-1 text-center">Status</div>
          <div className="col-span-2 text-right">Actions</div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 p-10 text-sm text-slate-500">
            <RefreshCw className="h-5 w-5 animate-spin text-vendor-primary" aria-hidden />
            Loading billing & payments…
          </div>
        ) : invoices.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-500">
            No invoices yet. Mark purchase orders as delivered, then generate an invoice here.
          </div>
        ) : (
          <div className="divide-y divide-[#dcc2f9]/40">
            {invoices.map((invoice) => (
              <div
                key={invoice.id || invoice.invoice_number}
                className="grid grid-cols-12 items-center gap-4 px-6 py-4 text-sm transition-colors hover:bg-[#faf7fe]"
              >
                <div className="col-span-2">
                  <p className="font-semibold text-slate-800">{invoice.invoice_number}</p>
                  <p className="text-[11px] text-slate-400">{formatDate(invoice.created_at)}</p>
                </div>
                <div className="col-span-2 font-mono text-xs font-semibold text-teal-700">
                  {invoice.po_number || '—'}
                </div>
                <div className="col-span-2">
                  <p className="font-medium text-slate-800">{invoice.hospital_name}</p>
                  <p className="truncate text-[11px] text-slate-400">{invoice.item_description}</p>
                </div>
                <div className="col-span-2 text-xs text-slate-600">
                  <p>Base: {formatInr(invoice.subtotal)}</p>
                  <p>GST 18%: {formatInr(invoice.tax_amount)}</p>
                </div>
                <div className="col-span-1 text-right font-semibold text-slate-900">
                  {formatInr(invoice.total_amount)}
                </div>
                <div className="col-span-1 text-center">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${paymentStatusBadgeClass(invoice.payment_status)}`}
                  >
                    {paymentStatusLabel(invoice.payment_status)}
                  </span>
                </div>
                <div className="col-span-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => previewInvoice(invoice)}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    <Eye className="h-3.5 w-3.5" aria-hidden />
                    Preview
                  </button>
                  <button
                    type="button"
                    onClick={() => downloadVendorInvoiceReceipt(invoice)}
                    className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-emerald-700"
                  >
                    <Download className="h-3.5 w-3.5" aria-hidden />
                    Download
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <CreateInvoiceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        billableOrders={billableOrders}
        vendor={{
          id: vendorId || undefined,
          email: vendorEmail || undefined,
          company_name: vendorName || undefined,
        }}
        busy={creating}
        onSubmit={handleCreateInvoice}
      />
    </div>
  );
}

export default BillingPaymentsWorkspace;
