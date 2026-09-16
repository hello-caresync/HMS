'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

import { getVendorSession, type VendorSession } from '@/lib/auth/ecosystem-sessions';
import { isUuidValue } from '@/lib/hospital/hospital-node';
import {
  applyVendorPurchaseOrderAction,
  extractSupabaseErrorMessage,
  getPurchaseOrderStatusBadgeClass,
  isVendorActionablePurchaseOrder,
  logSupabaseQueryError,
  mapPurchaseOrderRow,
  PROCUREMENT_PO_TABLE,
  resolvePurchaseOrderTotal,
  vendorPurchaseOrderActionStatus,
  VENDOR_PORTAL_PO_SELECT,
  type PurchaseOrderRow,
} from '@/lib/hospital/procurement';
import { supabase } from '@/lib/supabaseClient';
import { VENDOR_PORTAL_ROUTES } from '@/lib/vendor/navigation';

function readVendorSession(): VendorSession | null {
  if (typeof window === 'undefined') return null;

  const parsed = getVendorSession();
  if (parsed?.email || parsed?.rep_email || parsed?.id) {
    return parsed;
  }

  const raw = localStorage.getItem('vendor_session');
  if (!raw) return null;

  try {
    const legacy = JSON.parse(raw) as VendorSession;
    if (legacy?.email || legacy?.rep_email || legacy?.id) return legacy;
  } catch {
    return null;
  }

  return null;
}

function rowMatchesVendor(
  row: Record<string, unknown>,
  vendorId: string,
  vendorEmail: string,
  vendorName: string,
): boolean {
  const rowVendorId = String(row.vendor_id ?? '').trim();
  if (vendorId && rowVendorId && rowVendorId === vendorId) return true;

  const normalizedName = vendorName.trim().toLowerCase();
  const rowVendorName = String(row.vendor_name ?? row.vendor ?? '').trim().toLowerCase();
  if (normalizedName && rowVendorName && rowVendorName === normalizedName) return true;

  const normalizedEmail = vendorEmail.trim().toLowerCase();
  if (normalizedEmail) {
    for (const key of ['vendor_email', 'email', 'rep_email'] as const) {
      const candidate = String(row[key] ?? '').trim().toLowerCase();
      if (candidate && candidate === normalizedEmail) return true;
    }
  }

  return false;
}

async function queryFlatPurchaseOrders(
  vendorId: string,
): Promise<{ rows: Record<string, unknown>[]; error: unknown | null }> {
  if (!supabase) {
    return { rows: [], error: new Error('Supabase client unavailable') };
  }

  const order = { ascending: false } as const;

  if (vendorId && isUuidValue(vendorId)) {
    const byId = await supabase
      .from(PROCUREMENT_PO_TABLE)
      .select(VENDOR_PORTAL_PO_SELECT)
      .eq('vendor_id', vendorId)
      .order('created_at', order);

    if (!byId.error && Array.isArray(byId.data)) {
      return { rows: byId.data as Record<string, unknown>[], error: null };
    }
    if (byId.error && !/column/i.test(byId.error.message)) {
      return { rows: [], error: byId.error };
    }
  }

  let result = await supabase
    .from(PROCUREMENT_PO_TABLE)
    .select(VENDOR_PORTAL_PO_SELECT)
    .order('created_at', order);

  if (result.error && /column/i.test(result.error.message)) {
    result = await supabase
      .from(PROCUREMENT_PO_TABLE)
      .select('id, po_number, item_description, quantity, total_amount, status, created_at, vendor_id, hospital_id')
      .order('created_at', order);
  }

  if (result.error && /column/i.test(result.error.message)) {
    result = await supabase.from(PROCUREMENT_PO_TABLE).select('*').order('created_at', order);
  }

  if (result.error) {
    return { rows: [], error: result.error };
  }

  return { rows: (result.data ?? []) as Record<string, unknown>[], error: null };
}

function isPendingStatus(status?: string | null): boolean {
  return isVendorActionablePurchaseOrder(status);
}

function isActiveShipmentStatus(status?: string | null): boolean {
  const value = String(status ?? '').toLowerCase();
  return ['shipped', 'in_transit', 'dispatched'].includes(value);
}

function orderTotal(order: PurchaseOrderRow): number {
  return resolvePurchaseOrderTotal(order as unknown as Record<string, unknown>);
}

function formatInr(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number.isFinite(amount) ? amount : 0);
}

export default function VendorPortalDashboard() {
  const router = useRouter();
  const [currentVendor, setCurrentVendor] = useState<VendorSession | null>(null);
  const [vendorId, setVendorId] = useState('');
  const [vendorEmail, setVendorEmail] = useState('');
  const [vendorName, setVendorName] = useState('');
  const [orders, setOrders] = useState<PurchaseOrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyOrderId, setBusyOrderId] = useState<string | null>(null);

  const vendorKey = vendorId || vendorEmail || vendorName;
  const lastFetchedVendorKeyRef = useRef<string | null>(null);
  const fetchInFlightRef = useRef(false);
  const fetchVendorOrdersRef = useRef<(options?: { silent?: boolean }) => Promise<void>>(async () => {});

  useEffect(() => {
    const session = readVendorSession();
    if (!session) {
      router.replace(VENDOR_PORTAL_ROUTES.login);
      return;
    }

    setCurrentVendor(session);
    setVendorId(session.id?.trim() ?? '');
    setVendorEmail((session.email ?? session.rep_email ?? '').trim().toLowerCase());
    setVendorName((session.company_name ?? session.vendor_name ?? '').trim());
  }, [router]);

  const fetchVendorOrders = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!supabase || !vendorKey || fetchInFlightRef.current) return;

      fetchInFlightRef.current = true;
      setLoading(true);

      try {
        const { rows, error } = await queryFlatPurchaseOrders(vendorId);

        if (error) {
          logSupabaseQueryError('fetchVendorOrders', error);
          if (!options?.silent) {
            toast.error(extractSupabaseErrorMessage(error, 'Could not refresh purchase orders'));
          }
          setOrders([]);
          return;
        }

        const matched = rows.filter((row) => rowMatchesVendor(row, vendorId, vendorEmail, vendorName));
        setOrders(matched.map((row) => mapPurchaseOrderRow(row)));
      } catch (err: unknown) {
        logSupabaseQueryError('fetchVendorOrders', err);
        if (!options?.silent) {
          toast.error(extractSupabaseErrorMessage(err, 'Could not refresh purchase orders'));
        }
        setOrders([]);
      } finally {
        setLoading(false);
        fetchInFlightRef.current = false;
      }
    },
    [vendorId, vendorEmail, vendorName, vendorKey],
  );

  fetchVendorOrdersRef.current = fetchVendorOrders;

  useEffect(() => {
    if (!vendorKey || !supabase) return;

    if (lastFetchedVendorKeyRef.current !== vendorKey) {
      lastFetchedVendorKeyRef.current = vendorKey;
      void fetchVendorOrdersRef.current({ silent: false });
    }

    const channel = supabase
      .channel(`vendor-live-po-sync-${vendorKey}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: PROCUREMENT_PO_TABLE },
        () => {
          void fetchVendorOrdersRef.current({ silent: true });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [vendorKey]);

  const handleUpdateOrderStatus = async (order: PurchaseOrderRow, action: 'accept' | 'reject') => {
    if (!supabase || !order.id) return;

    setBusyOrderId(order.id);
    const nextStatus = vendorPurchaseOrderActionStatus(action);
    setOrders((prev) =>
      prev.map((row) => (row.id === order.id ? { ...row, status: nextStatus } : row)),
    );

    try {
      const result = await applyVendorPurchaseOrderAction(supabase, order.id, action);
      if (!result.ok) {
        throw new Error(result.error || `Could not ${action} order`);
      }

      if (result.order) {
        setOrders((prev) =>
          prev.map((row) => (row.id === order.id ? result.order! : row)),
        );
      }

      toast.success(
        action === 'accept'
          ? `Purchase order ${order.po_number} accepted successfully`
          : `Purchase order ${order.po_number} rejected`,
      );
    } catch (err: unknown) {
      console.error(`Failed to ${action} PO:`, err);
      toast.error(
        extractSupabaseErrorMessage(err, `Could not ${action} order: ${order.po_number}`),
      );
      await fetchVendorOrdersRef.current({ silent: true });
    } finally {
      setBusyOrderId(null);
    }
  };

  if (!currentVendor) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="animate-pulse font-mono text-xs text-vendor-muted">Authenticating vendor session...</div>
      </div>
    );
  }

  const vendorLabel = currentVendor.company_name || currentVendor.vendor_name || 'Vendor';
  const vendorEmailLabel = currentVendor.email || currentVendor.rep_email;

  const pendingCount = orders.filter((order) => isPendingStatus(order.status)).length;
  const activeShipmentsCount = orders.filter((order) => isActiveShipmentStatus(order.status)).length;
  const totalInvoicedAmount = orders
    .filter((order) => String(order.status).toLowerCase() !== 'rejected')
    .reduce((sum, order) => sum + orderTotal(order), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-vendor-charcoal">Vendor Dashboard</h1>
          <p className="mt-0.5 text-xs text-vendor-muted">
            Live procurement sync for vendor{' '}
            <span className="font-mono font-semibold text-vendor-primary">
              {vendorLabel} ({vendorEmailLabel})
            </span>{' '}
            across partner hospitals.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void fetchVendorOrders({ silent: false })}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-xl border border-[#dcc2f9]/70 bg-white px-3 py-1.5 text-xs font-semibold text-vendor-charcoal shadow-xs transition-all hover:bg-[#faf7fe] disabled:opacity-60"
        >
          <RefreshCw className={`h-3.5 w-3.5 text-vendor-primary ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-3xl border border-[#dcc2f9]/70 bg-white p-5 shadow-sm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-vendor-primary">
            Pending POs
          </span>
          <div className="mt-2 text-3xl font-black text-vendor-charcoal">{pendingCount}</div>
          <span className="mt-1 block font-mono text-[11px] text-vendor-muted">
            {PROCUREMENT_PO_TABLE} · pending vendor action
          </span>
        </div>

        <div className="rounded-3xl border border-[#dcc2f9]/70 bg-[#faf7fe] p-5 shadow-sm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-vendor-secondary">
            Active Shipments
          </span>
          <div className="mt-2 text-3xl font-black text-vendor-charcoal">{activeShipmentsCount}</div>
          <span className="mt-1 block font-mono text-[11px] text-vendor-muted">
            shipments · IN_TRANSIT
          </span>
        </div>

        <div className="rounded-3xl border border-emerald-200/60 bg-emerald-50/60 p-5 dark:border-emerald-900/40 dark:bg-emerald-950/20">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
            Total Invoiced
          </span>
          <div className="mt-2 font-mono text-3xl font-black text-emerald-950 dark:text-emerald-200">
            {formatInr(totalInvoicedAmount)}
          </div>
          <span className="mt-1 block font-mono text-[11px] text-emerald-700/80 dark:text-emerald-400/80">
            sum of accepted PO totals
          </span>
        </div>
      </div>

      <div className="rounded-3xl border border-[#dcc2f9]/70 bg-white p-6 shadow-sm">
        <div className="mb-4 border-b border-[#dcc2f9]/50 pb-4">
          <h3 className="text-sm font-black uppercase tracking-wider text-vendor-charcoal">
            Latest Incoming Orders
          </h3>
          <p className="text-[11px] text-gray-400">Most recent purchase orders · accept or reject inline.</p>
        </div>

        {loading && orders.length === 0 ? (
          <div className="py-12 text-center text-xs text-gray-400">Loading purchase orders…</div>
        ) : orders.length === 0 ? (
          <div className="py-12 text-center text-xs text-gray-400">
            No incoming purchase orders assigned to this vendor yet.
          </div>
        ) : (
          <div className="space-y-3">
            {orders.slice(0, 8).map((order) => {
              const isPending = isPendingStatus(order.status);
              const statusBadgeClass = getPurchaseOrderStatusBadgeClass(order.status);

              return (
                <div
                  key={order.id || order.po_number}
                  className="flex flex-col justify-between gap-4 rounded-2xl border border-[#dcc2f9]/50 bg-[#faf7fe]/60 p-4 transition-all hover:border-vendor-secondary md:flex-row md:items-center"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-gray-900 dark:text-white">
                        {order.po_number}
                      </span>
                      <span
                        className={`rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${statusBadgeClass}`}
                      >
                        {order.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-300">
                      <span className="font-semibold text-gray-800 dark:text-gray-200">Regal Hospital</span> ·{' '}
                      {order.item_description}
                    </p>
                    {order.created_at ? (
                      <p className="text-[11px] text-gray-400">
                        {new Date(order.created_at).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex items-center gap-4 self-end md:self-auto">
                    <span className="font-mono text-sm font-bold text-gray-900 dark:text-white">
                      {formatInr(orderTotal(order))}
                    </span>

                    {isPending ? (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={busyOrderId === order.id}
                          onClick={() => void handleUpdateOrderStatus(order, 'accept')}
                          className="rounded-xl bg-vendor-primary px-3 py-1.5 text-xs font-bold text-white shadow-xs transition-all hover:bg-vendor-secondary disabled:opacity-60"
                        >
                          {busyOrderId === order.id ? '…' : 'Accept'}
                        </button>
                        <button
                          type="button"
                          disabled={busyOrderId === order.id}
                          onClick={() => void handleUpdateOrderStatus(order, 'reject')}
                          className="rounded-xl bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 transition-all hover:bg-rose-100 disabled:opacity-60 dark:bg-rose-950/40 dark:text-rose-300"
                        >
                          Reject
                        </button>
                      </div>
                    ) : order.status === 'ACCEPTED' ? (
                      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                        ACCEPTED
                      </span>
                    ) : order.status === 'CANCELLED' ? (
                      <span className="rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
                        CANCELLED
                      </span>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
