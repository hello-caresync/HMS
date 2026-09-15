'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  Building2,
  Check,
  CheckCircle2,
  Clock,
  Filter,
  Loader2,
  Package,
  Plus,
  Receipt,
  RefreshCw,
  Truck,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

import { CreatePurchaseOrderModal } from '@/components/hospital/CreatePurchaseOrderModal';
import { InvoiceSettlementModal } from '@/components/hospital/InvoiceSettlementModal';
import { HOSPITAL_TENANT_ID } from '@/lib/regal/constants';
export { EMPTY_PO_FORM } from '@/lib/hospital/po-form';
import {
  buildSettlementSuccessMessage,
  canMarkPurchaseOrderDelivered,
  createHospitalVendor,
  fetchHospitalVendorInvoices,
  fetchRegisteredVendors,
  fetchPurchaseOrders,
  formatHospitalInvoicePaymentStatus,
  formatPurchaseOrderStatus,
  getHospitalInvoicePaymentBadgeClass,
  getPurchaseOrderStatusBadgeClass,
  isEligibleHospitalVendor,
  isPendingPurchaseOrder,
  markPurchaseOrderDelivered,
  normalizeHospitalPaymentStatus,
  settleHospitalVendorInvoice,
  type HospitalVendor,
  type HospitalVendorInvoiceRow,
  type PurchaseOrderRow,
} from '@/lib/hospital/procurement';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

function formatInr(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number.isFinite(amount) ? amount : 0);
}

function formatInvoiceDate(value?: string): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

type CommandCenterTab = 'orders' | 'invoices';

const EMPTY_VENDOR_FORM = {
  company_name: '',
  email: '',
  contact_person: '',
  phone: '',
  gstin: '',
  portal_passcode: '1234',
};

export function SupplyOrdersCommandCenter({
  hospitalId,
  hospitalName,
  onOrdersChanged,
  purchaseOrders: purchaseOrdersProp,
  ordersLoading = false,
  onRefreshPurchaseOrders,
  onPurchaseOrdersChange,
}: {
  hospitalId: string;
  hospitalName: string;
  onOrdersChanged?: (orders: PurchaseOrderRow[], vendors: HospitalVendor[]) => void;
  /** Live rows from public.purchase_orders (page-level fetch). */
  purchaseOrders?: PurchaseOrderRow[];
  ordersLoading?: boolean;
  onRefreshPurchaseOrders?: () => Promise<void>;
  onPurchaseOrdersChange?: (orders: PurchaseOrderRow[]) => void;
}) {
  const nodeId = hospitalId || HOSPITAL_TENANT_ID;
  const onChangedRef = useRef(onOrdersChanged);
  onChangedRef.current = onOrdersChanged;
  const onRefreshPurchaseOrdersRef = useRef(onRefreshPurchaseOrders);
  onRefreshPurchaseOrdersRef.current = onRefreshPurchaseOrders;
  const controlledOrders = purchaseOrdersProp !== undefined;

  const [loading, setLoading] = useState(!controlledOrders);
  const [refreshing, setRefreshing] = useState(false);
  const [vendors, setVendors] = useState<HospitalVendor[]>([]);
  const [internalPurchaseOrders, setInternalPurchaseOrders] = useState<PurchaseOrderRow[]>([]);
  const purchaseOrders = controlledOrders ? purchaseOrdersProp : internalPurchaseOrders;
  const [selectedVendorId, setSelectedVendorId] = useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
  const [isSavingVendor, setIsSavingVendor] = useState(false);
  const [vendorForm, setVendorForm] = useState(EMPTY_VENDOR_FORM);
  const [markingPoId, setMarkingPoId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<CommandCenterTab>('orders');
  const [vendorInvoices, setVendorInvoices] = useState<HospitalVendorInvoiceRow[]>([]);
  const [invoicesLoading, setInvoicesLoading] = useState(false);
  const [settlementInvoice, setSettlementInvoice] = useState<HospitalVendorInvoiceRow | null>(null);
  const [settlingInvoice, setSettlingInvoice] = useState(false);
  const selectedVendorIdRef = useRef(selectedVendorId);
  selectedVendorIdRef.current = selectedVendorId;

  const refreshPurchaseOrders = useCallback(async (): Promise<PurchaseOrderRow[]> => {
    if (!supabase) return [];
    try {
      if (controlledOrders) {
        await onRefreshPurchaseOrdersRef.current?.();
        return [];
      }

      const vendorFilter =
        selectedVendorIdRef.current !== 'ALL' ? selectedVendorIdRef.current : undefined;
      const nextOrders = await fetchPurchaseOrders(supabase, nodeId, {
        vendorId: vendorFilter,
      });
      setInternalPurchaseOrders(nextOrders);
      return nextOrders;
    } catch (err: unknown) {
      console.error('Error fetching procurement orders:', err);
      toast.error('Could not refresh orders list');
      if (!controlledOrders) setInternalPurchaseOrders([]);
      return [];
    }
  }, [controlledOrders, nodeId]);

  const loadVendorsAndOrders = useCallback(async (silent = false): Promise<HospitalVendor[]> => {
    if (!supabase) {
      setLoading(false);
      return [];
    }
    if (!silent) setRefreshing(true);
    try {
      const nextVendors = await fetchRegisteredVendors(supabase, nodeId);
      setVendors(nextVendors);
      const nextOrders = await refreshPurchaseOrders();
      if (!controlledOrders) {
        onChangedRef.current?.(nextOrders, nextVendors);
      }
      return nextVendors;
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Could not load supply workspace');
      return [];
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [controlledOrders, nodeId, refreshPurchaseOrders]);

  const reload = loadVendorsAndOrders;

  const refreshVendorInvoices = useCallback(async (): Promise<HospitalVendorInvoiceRow[]> => {
    if (!supabase) return [];
    setInvoicesLoading(true);
    try {
      const rows = await fetchHospitalVendorInvoices(supabase, nodeId);
      console.log('Hospital fetched invoices:', rows);
      setVendorInvoices(rows);
      return rows;
    } catch (err: unknown) {
      console.error('Error fetching vendor invoices:', err);
      toast.error('Could not refresh vendor invoices');
      setVendorInvoices([]);
      return [];
    } finally {
      setInvoicesLoading(false);
    }
  }, [nodeId]);

  useEffect(() => {
    void loadVendorsAndOrders();
    void refreshVendorInvoices();
  }, [loadVendorsAndOrders, refreshVendorInvoices]);

  useEffect(() => {
    if (controlledOrders) return;
    void refreshPurchaseOrders();
  }, [controlledOrders, refreshPurchaseOrders, selectedVendorId]);

  useEffect(() => {
    if (!controlledOrders) return;
    onChangedRef.current?.(purchaseOrdersProp ?? [], vendors);
  }, [controlledOrders, purchaseOrdersProp, vendors]);

  useEffect(() => {
    if (!supabase) return;
    const channel = supabase
      .channel(`supply-pos-sync-${nodeId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'purchase_orders' },
        () => void refreshPurchaseOrders(),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'vendors' },
        () => void loadVendorsAndOrders(true),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'vendor_invoices' },
        () => void refreshVendorInvoices(),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'invoices' },
        () => void refreshVendorInvoices(),
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [nodeId, loadVendorsAndOrders, refreshPurchaseOrders, refreshVendorInvoices]);

  const registeredSuppliers = useMemo(
    () => vendors.filter(isEligibleHospitalVendor),
    [vendors],
  );

  useEffect(() => {
    if (
      selectedVendorId !== 'ALL' &&
      !registeredSuppliers.some((vendor) => vendor.id === selectedVendorId)
    ) {
      setSelectedVendorId('ALL');
    }
  }, [registeredSuppliers, selectedVendorId]);

  const activeVendor = useMemo(
    () => registeredSuppliers.find((vendor) => vendor.id === selectedVendorId),
    [registeredSuppliers, selectedVendorId],
  );

  const filteredOrders = useMemo(() => {
    if (selectedVendorId === 'ALL') return purchaseOrders;
    const vendor = registeredSuppliers.find((item) => item.id === selectedVendorId);
    if (!vendor) return purchaseOrders;
    const email = vendor.email.toLowerCase();
    const name = vendor.company_name.trim().toLowerCase();
    return purchaseOrders.filter((po) => {
      if (po.vendor_id && po.vendor_id === selectedVendorId) return true;
      const poEmail = po.vendor_email.trim().toLowerCase();
      const poName = po.vendor_name.trim().toLowerCase();
      return poName === name || (email && poEmail === email);
    });
  }, [registeredSuppliers, purchaseOrders, selectedVendorId]);

  const deliveryMetrics = useMemo(() => {
    const open = filteredOrders.filter((po) => isPendingPurchaseOrder(po.status)).length;
    const delivered = filteredOrders.filter(
      (po) => formatPurchaseOrderStatus(po.status) === 'DELIVERED',
    ).length;
    const totalValue = filteredOrders.reduce((sum, po) => sum + po.total_amount, 0);
    return { open, delivered, totalValue };
  }, [filteredOrders]);

  const filteredInvoices = useMemo(() => {
    if (selectedVendorId === 'ALL') return vendorInvoices;
    const vendor = registeredSuppliers.find((item) => item.id === selectedVendorId);
    if (!vendor) return vendorInvoices;
    const email = vendor.email.toLowerCase();
    const name = vendor.company_name.trim().toLowerCase();
    return vendorInvoices.filter((invoice) => {
      if (invoice.vendor_id && invoice.vendor_id === selectedVendorId) return true;
      const invoiceEmail = invoice.vendor_email.trim().toLowerCase();
      const invoiceName = invoice.vendor_name.trim().toLowerCase();
      return invoiceName === name || (email && invoiceEmail === email);
    });
  }, [registeredSuppliers, selectedVendorId, vendorInvoices]);

  const payableMetrics = useMemo(() => {
    const awaiting = filteredInvoices.filter(
      (invoice) => normalizeHospitalPaymentStatus(invoice.payment_status) === 'AWAITING_SETTLEMENT',
    );
    const settled = filteredInvoices.filter(
      (invoice) => normalizeHospitalPaymentStatus(invoice.payment_status) === 'PAID',
    );
    return {
      awaitingCount: awaiting.length,
      awaitingTotal: awaiting.reduce((sum, invoice) => sum + invoice.total_amount, 0),
      settledCount: settled.length,
    };
  }, [filteredInvoices]);

  const openCreatePoModal = () => {
    void reload(true).then(() => setIsModalOpen(true));
  };

  const handlePoCreated = async (_order?: PurchaseOrderRow) => {
    await refreshPurchaseOrders();
    await loadVendorsAndOrders(true);
  };

  const handleRegisterVendor = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!supabase || isSavingVendor) return;
    setIsSavingVendor(true);
    try {
      const result = await createHospitalVendor(supabase, nodeId, {
        company_name: vendorForm.company_name,
        email: vendorForm.email.trim().toLowerCase(),
        contact_person: vendorForm.contact_person.trim() || undefined,
        phone: vendorForm.phone.trim() || undefined,
        gstin: vendorForm.gstin.trim() || '',
        passcode: vendorForm.portal_passcode.trim(),
        portal_pin: vendorForm.portal_passcode.trim(),
      });
      if (!result.ok) {
        console.error('Supplier registration failed:', result.error);
        toast.error(result.error || 'Could not register supplier');
        return;
      }
      toast.success(`Supplier ${vendorForm.company_name.trim()} registered successfully`);
      setVendorForm(EMPTY_VENDOR_FORM);
      setIsVendorModalOpen(false);
      if (result.vendor) {
        setVendors((prev) => {
          const merged = [...prev.filter((row) => row.id !== result.vendor!.id), result.vendor!];
          return merged.sort((a, b) => a.company_name.localeCompare(b.company_name));
        });
      }
      await reload(true);
    } finally {
      setIsSavingVendor(false);
    }
  };

  const patchOrderStatus = useCallback(
    (orderId: string, status: string) => {
      const patch = (rows: PurchaseOrderRow[]) =>
        rows.map((row) => (row.id === orderId ? { ...row, status } : row));

      if (controlledOrders && purchaseOrdersProp) {
        onPurchaseOrdersChange?.(patch(purchaseOrdersProp));
        return;
      }

      setInternalPurchaseOrders((prev) => {
        const next = patch(prev);
        onChangedRef.current?.(next, vendors);
        return next;
      });
    },
    [controlledOrders, onPurchaseOrdersChange, purchaseOrdersProp, vendors],
  );

  const handleSettleInvoice = async (input: {
    payment_reference: string;
    payment_method: string;
  }) => {
    if (!supabase || !settlementInvoice || settlingInvoice) return;
    setSettlingInvoice(true);
    try {
      const result = await settleHospitalVendorInvoice(supabase, nodeId, {
        invoiceId: settlementInvoice.id,
        payment_reference: input.payment_reference,
        payment_method: input.payment_method,
      });
      if (!result.ok) {
        throw new Error(result.error || 'Could not settle invoice');
      }
      toast.success(
        buildSettlementSuccessMessage(
          input.payment_method,
          input.payment_reference,
          settlementInvoice.invoice_number,
        ),
      );
      setSettlementInvoice(null);
      await Promise.all([refreshVendorInvoices(), refreshPurchaseOrders()]);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Could not settle invoice');
    } finally {
      setSettlingInvoice(false);
    }
  };

  const handleMarkDelivered = async (order: PurchaseOrderRow) => {
    if (!supabase || markingPoId) return;
    setMarkingPoId(order.id);
    patchOrderStatus(order.id, 'DELIVERED');
    try {
      const result = await markPurchaseOrderDelivered(supabase, nodeId, order);
      if (!result.ok) {
        patchOrderStatus(order.id, order.status);
        throw new Error(result.error || 'Could not mark delivered');
      }

      if (result.error) {
        toast.success(`Delivery confirmed and recorded successfully (${result.error})`);
      } else {
        toast.success('Delivery confirmed and recorded successfully');
      }

      await reload(true);
    } catch (err: unknown) {
      patchOrderStatus(order.id, order.status);
      toast.error('Could not confirm delivery. Please try again.');
      await refreshPurchaseOrders();
    } finally {
      setMarkingPoId(null);
    }
  };

  const isLoading = controlledOrders ? ordersLoading && vendors.length === 0 : loading;

  if (isLoading) {
    return (
      <div className="flex items-center rounded-2xl border border-slate-200 bg-white p-8 text-sm font-bold text-slate-500">
        <Loader2 className="mr-2 h-4 w-4 animate-spin text-teal-600" />
        Loading procurement &amp; vendor dispatch…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Procurement &amp; Supply Command</h1>
          <p className="text-xs text-gray-500">
            Node:{' '}
            <span className="font-semibold text-teal-600">
              {nodeId} ({hospitalName || 'Regal Hospital'})
            </span>{' '}
            · Manage supplier purchase orders and inbound deliveries
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setIsVendorModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-teal-200 bg-white px-4 py-2 text-xs font-bold uppercase tracking-wider text-teal-700 shadow-sm transition-all hover:bg-teal-50"
          >
            <Building2 className="h-4 w-4" />
            Register Supplier
          </button>
          <button
            type="button"
            onClick={openCreatePoModal}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white shadow-sm transition-all hover:from-teal-700 hover:to-cyan-700"
          >
            <Plus className="h-4 w-4" />
            Create Purchase Order
          </button>
        </div>
      </div>

      <div className="flex flex-col items-center justify-between gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 md:flex-row">
        <div className="flex w-full items-center gap-3 md:w-auto">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-teal-100 bg-teal-50 text-teal-600 dark:border-teal-900/50 dark:bg-teal-950/40 dark:text-teal-400">
            <Building2 className="h-5 w-5" />
          </div>
          <div className="min-w-[240px] flex-1">
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Select Registered Supplier
            </label>
            <select
              value={selectedVendorId}
              onChange={(event) => setSelectedVendorId(event.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3 py-2 text-xs font-semibold text-gray-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
            >
              <option value="ALL">All Registered Vendors ({registeredSuppliers.length})</option>
              {registeredSuppliers.map((vendor) => (
                <option key={vendor.id} value={vendor.id}>
                  {vendor.company_name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {activeVendor ? (
          <div className="flex w-full items-center justify-between gap-4 rounded-xl border border-teal-100 bg-teal-50/60 px-4 py-2.5 dark:border-teal-900/50 dark:bg-teal-950/20 md:w-auto md:justify-start">
            <div>
              <p className="text-xs font-bold text-teal-900 dark:text-teal-200">{activeVendor.company_name}</p>
              <p className="font-mono text-[11px] text-teal-700 dark:text-teal-400">{activeVendor.email}</p>
              {activeVendor.phone ? (
                <p className="font-mono text-[10px] text-teal-600 dark:text-teal-500">{activeVendor.phone}</p>
              ) : null}
            </div>
            {activeVendor.gstin ? (
              <span className="rounded-full bg-teal-100 px-2.5 py-0.5 font-mono text-[10px] font-bold text-teal-800 dark:bg-teal-900/60 dark:text-teal-300">
                GSTIN {activeVendor.gstin}
              </span>
            ) : null}
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <Filter className="h-3.5 w-3.5" />
            Showing purchase orders across all vendors
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {activeTab === 'orders' ? (
          <>
            <div className="rounded-2xl border border-amber-100 bg-amber-50/70 px-4 py-3 dark:border-amber-900/40 dark:bg-amber-950/20">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-amber-700">
                <Clock className="h-3.5 w-3.5" />
                Pending Dispatch
              </div>
              <div className="mt-1 text-2xl font-black text-amber-900 dark:text-amber-200">{deliveryMetrics.open}</div>
            </div>
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 px-4 py-3 dark:border-emerald-900/40 dark:bg-emerald-950/20">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Delivered
              </div>
              <div className="mt-1 text-2xl font-black text-emerald-900 dark:text-emerald-200">{deliveryMetrics.delivered}</div>
            </div>
            <div className="rounded-2xl border border-teal-100 bg-teal-50/70 px-4 py-3 dark:border-teal-900/40 dark:bg-teal-950/20">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-teal-700">
                <Truck className="h-3.5 w-3.5" />
                Order Value
              </div>
              <div className="mt-1 text-2xl font-black text-teal-900 dark:text-teal-200">{formatInr(deliveryMetrics.totalValue)}</div>
            </div>
          </>
        ) : (
          <>
            <div className="rounded-2xl border border-amber-100 bg-amber-50/70 px-4 py-3 dark:border-amber-900/40 dark:bg-amber-950/20">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-amber-700">
                <Receipt className="h-3.5 w-3.5" />
                Awaiting Settlement
              </div>
              <div className="mt-1 text-2xl font-black text-amber-900 dark:text-amber-200">
                {formatInr(payableMetrics.awaitingTotal)}
              </div>
            </div>
            <div className="rounded-2xl border border-amber-100 bg-amber-50/70 px-4 py-3 dark:border-amber-900/40 dark:bg-amber-950/20">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-amber-700">
                <Clock className="h-3.5 w-3.5" />
                Open Invoices
              </div>
              <div className="mt-1 text-2xl font-black text-amber-900 dark:text-amber-200">{payableMetrics.awaitingCount}</div>
            </div>
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 px-4 py-3 dark:border-emerald-900/40 dark:bg-emerald-950/20">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Settled
              </div>
              <div className="mt-1 text-2xl font-black text-emerald-900 dark:text-emerald-200">{payableMetrics.settledCount}</div>
            </div>
          </>
        )}
      </div>

      <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm transition-all dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-col gap-4 border-b border-gray-100 p-5 dark:border-zinc-800 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('orders')}
                className={`rounded-xl px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider transition ${
                  activeTab === 'orders'
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-zinc-800 dark:text-gray-300'
                }`}
              >
                Purchase Orders
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('invoices')}
                className={`rounded-xl px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider transition ${
                  activeTab === 'invoices'
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-zinc-800 dark:text-gray-300'
                }`}
              >
                Invoices / Payables
              </button>
            </div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-800 dark:text-gray-200">
              {activeTab === 'orders' ? 'Procurement & Vendor Dispatch' : 'Vendor Invoices & Payables'}
            </h3>
            <p className="mt-0.5 text-[11px] text-gray-400">
              {activeTab === 'orders'
                ? "Active orders automatically sync with the selected vendor's portal."
                : 'Review incoming tax invoices, record bank references, and mark payables as settled.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              void (activeTab === 'orders'
                ? reload()
                : Promise.all([refreshVendorInvoices(), refreshPurchaseOrders()]))
            }
            disabled={refreshing || ordersLoading || invoicesLoading}
            className="rounded-xl p-2 text-gray-400 transition-all hover:bg-gray-50 hover:text-gray-600 disabled:opacity-50 dark:hover:bg-zinc-800 dark:hover:text-gray-200"
            title="Refresh table"
          >
            <RefreshCw
              className={`h-4 w-4 text-teal-600 ${refreshing || ordersLoading || invoicesLoading ? 'animate-spin' : ''}`}
            />
          </button>
        </div>

        {activeTab === 'invoices' ? (
          invoicesLoading && filteredInvoices.length === 0 ? (
            <div className="flex items-center justify-center gap-2 px-6 py-16 text-sm text-gray-500">
              <Loader2 className="h-5 w-5 animate-spin text-teal-600" />
              Loading vendor invoices…
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-100 bg-amber-50 text-amber-600 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-400">
                <Receipt className="h-7 w-7" />
              </div>
              <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200">No Vendor Invoices Yet</h4>
              <p className="mx-auto mt-1 max-w-sm text-xs text-gray-400">
                Tax invoices submitted by vendors after delivery will appear here for finance settlement.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50/80 text-[10px] font-semibold uppercase tracking-wider text-gray-500 dark:bg-zinc-800/60">
                  <tr>
                    <th className="px-4 py-3.5">Invoice No &amp; Date</th>
                    <th className="px-4 py-3.5">Vendor Entity</th>
                    <th className="px-4 py-3.5">Associated PO</th>
                    <th className="px-4 py-3.5">Amount</th>
                    <th className="px-4 py-3.5">Status</th>
                    <th className="px-4 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                  {filteredInvoices.map((invoice) => {
                    const isPaid = normalizeHospitalPaymentStatus(invoice.payment_status) === 'PAID';
                    return (
                      <tr
                        key={invoice.id || invoice.invoice_number}
                        className="transition-colors hover:bg-gray-50/50 dark:hover:bg-zinc-800/40"
                      >
                        <td className="px-4 py-3.5">
                          <div className="font-mono font-bold text-teal-600 dark:text-teal-400">
                            {invoice.invoice_number}
                          </div>
                          <div className="text-[10px] text-gray-400">{formatInvoiceDate(invoice.created_at)}</div>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="font-bold text-gray-900 dark:text-white">{invoice.vendor_name}</div>
                          {invoice.vendor_email ? (
                            <div className="text-[10px] text-gray-400">{invoice.vendor_email}</div>
                          ) : null}
                        </td>
                        <td className="px-4 py-3.5 font-mono font-semibold text-gray-700 dark:text-gray-300">
                          {invoice.po_number || '—'}
                        </td>
                        <td className="px-4 py-3.5 font-mono font-bold text-gray-900 dark:text-white">
                          {formatInr(invoice.total_amount)}
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            className={`inline-block rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${getHospitalInvoicePaymentBadgeClass(invoice.payment_status)}`}
                          >
                            {formatHospitalInvoicePaymentStatus(invoice.payment_status)}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          {isPaid ? (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                              <Check className="h-3.5 w-3.5" />
                              Settled / Reconciled
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setSettlementInvoice(invoice)}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700"
                            >
                              Process Payment
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        ) : filteredOrders.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border border-teal-100 bg-teal-50 text-teal-600 dark:border-teal-900/50 dark:bg-teal-950/40 dark:text-teal-400">
              <Package className="h-7 w-7" />
            </div>
            <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200">
              {purchaseOrders.length > 0 && selectedVendorId !== 'ALL'
                ? 'No Orders for Selected Supplier'
                : 'No Purchase Orders Dispatched Yet'}
            </h4>
            <p className="mx-auto mt-1 max-w-sm text-xs text-gray-400">
              {purchaseOrders.length > 0 && selectedVendorId !== 'ALL' ? (
                <>
                  {activeVendor?.company_name ?? 'This supplier'} has no purchase orders on record. Select
                  another vendor or issue a new dispatch.
                </>
              ) : (
                <>
                  Orders issued using{' '}
                  <span className="font-semibold text-teal-600 dark:text-teal-400">
                    &quot;+ Create Purchase Order&quot;
                  </span>{' '}
                  will appear here and sync in real time with the supplier&apos;s portal.
                </>
              )}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/80 text-[10px] font-semibold uppercase tracking-wider text-gray-500 dark:bg-zinc-800/60">
                <tr>
                  <th className="px-4 py-3.5">PO Number</th>
                  <th className="px-4 py-3.5">Vendor</th>
                  <th className="px-4 py-3.5">Item &amp; Description</th>
                  <th className="px-4 py-3.5">Qty</th>
                  <th className="px-4 py-3.5">Total Amount</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                {filteredOrders.map((po) => {
                  const statusLabel = formatPurchaseOrderStatus(po.status);
                  const status = String(statusLabel).toUpperCase();
                  const isDelivered = status === 'DELIVERED';
                  const isCancelled = status === 'CANCELLED' || status === 'REJECTED';
                  const canMarkDelivered = canMarkPurchaseOrderDelivered(po.status);

                  return (
                    <tr
                      key={po.id || po.po_number}
                      className="transition-colors hover:bg-gray-50/50 dark:hover:bg-zinc-800/40"
                    >
                      <td className="px-4 py-3.5 font-mono font-bold text-teal-600 dark:text-teal-400">
                        {po.po_number}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-gray-900 dark:text-white">{po.vendor_name}</div>
                        <div className="text-[10px] text-gray-400">{po.category || 'General Supplies'}</div>
                      </td>
                      <td className="max-w-xs truncate px-4 py-3.5 font-medium text-gray-700 dark:text-gray-300">
                        {po.item_description}
                      </td>
                      <td className="px-4 py-3.5 font-mono">{po.quantity}</td>
                      <td className="px-4 py-3.5 font-mono font-bold text-gray-900 dark:text-white">
                        {formatInr(po.total_amount || po.quantity * (po.unit_price || 0))}
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-block rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${getPurchaseOrderStatusBadgeClass(po.status)}`}
                        >
                          {statusLabel}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        {canMarkDelivered ? (
                          <button
                            type="button"
                            disabled={markingPoId === po.id}
                            onClick={() => void handleMarkDelivered(po)}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            {markingPoId === po.id ? 'Updating…' : 'Mark Delivered'}
                          </button>
                        ) : isDelivered ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                            <Check className="h-3.5 w-3.5" />
                            Completed
                          </span>
                        ) : isCancelled ? (
                          <span className="text-xs font-medium text-rose-500">Cancelled</span>
                        ) : (
                          <span className="text-xs font-medium text-slate-400">In Progress</span>
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

      <CreatePurchaseOrderModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={(order) => void handlePoCreated(order)}
        hospitalId={nodeId}
        hospitalName={hospitalName}
        registeredSuppliers={registeredSuppliers}
        vendors={registeredSuppliers}
        initialVendorId={selectedVendorId}
        onRegisterSupplier={() => {
          setIsModalOpen(false);
          setIsVendorModalOpen(true);
        }}
      />

      <InvoiceSettlementModal
        isOpen={Boolean(settlementInvoice)}
        onClose={() => setSettlementInvoice(null)}
        invoice={settlementInvoice}
        busy={settlingInvoice}
        onConfirm={handleSettleInvoice}
      />

      {isVendorModalOpen ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <form
            onSubmit={(event) => void handleRegisterVendor(event)}
            className="w-full max-w-md space-y-3 rounded-3xl border border-slate-200 bg-white p-6 text-xs shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Register Supplier</h3>
              <button
                type="button"
                disabled={isSavingVendor}
                onClick={() => setIsVendorModalOpen(false)}
                className="text-slate-400"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <label className="block font-bold uppercase text-slate-600">
              Company name *
              <input
                required
                disabled={isSavingVendor}
                value={vendorForm.company_name}
                onChange={(event) => setVendorForm((prev) => ({ ...prev, company_name: event.target.value }))}
                placeholder="MedSupply Co."
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-medium normal-case"
              />
            </label>
            <label className="block font-bold uppercase text-slate-600">
              Portal email *
              <input
                required
                type="email"
                disabled={isSavingVendor}
                value={vendorForm.email}
                onChange={(event) => setVendorForm((prev) => ({ ...prev, email: event.target.value }))}
                placeholder="vendor@supplier.com"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-medium normal-case"
              />
            </label>
            <label className="block font-bold uppercase text-slate-600">
              Contact person
              <input
                disabled={isSavingVendor}
                value={vendorForm.contact_person}
                onChange={(event) => setVendorForm((prev) => ({ ...prev, contact_person: event.target.value }))}
                placeholder="Representative name"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-medium normal-case"
              />
            </label>
            <label className="block font-bold uppercase text-slate-600">
              GSTIN (optional)
              <input
                disabled={isSavingVendor}
                value={vendorForm.gstin}
                onChange={(event) => setVendorForm((prev) => ({ ...prev, gstin: event.target.value }))}
                placeholder="22AAAAA0000A1Z5"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-mono font-medium normal-case"
              />
            </label>
            <label className="block font-bold uppercase text-slate-600">
              Portal Security PIN *
              <input
                required
                type="password"
                disabled={isSavingVendor}
                value={vendorForm.portal_passcode}
                onChange={(event) =>
                  setVendorForm((prev) => ({ ...prev, portal_passcode: event.target.value }))
                }
                placeholder="Vendor portal login PIN"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-mono font-medium normal-case"
              />
            </label>
            <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
              <button
                type="button"
                disabled={isSavingVendor}
                onClick={() => setIsVendorModalOpen(false)}
                className="rounded-lg bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSavingVendor}
                className="rounded-lg bg-teal-600 px-5 py-2 text-xs font-semibold text-white disabled:opacity-60"
              >
                {isSavingVendor ? 'Saving...' : 'Register Supplier'}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
