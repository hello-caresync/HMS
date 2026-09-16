'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

import { VendorModuleHeader } from '@/components/vendor/ui/VendorModuleHeader';
import { getVendorSession, type VendorSession } from '@/lib/auth/ecosystem-sessions';
import { isUuidValue } from '@/lib/hospital/hospital-node';
import {
  applyVendorPurchaseOrderAction,
  extractSupabaseErrorMessage,
  fetchVendorPurchaseOrders,
  formatPurchaseOrderStatus,
  getPurchaseOrderStatusBadgeClass,
  isVendorActionablePurchaseOrder,
  logSupabaseQueryError,
  mapPurchaseOrderRow,
  PROCUREMENT_PO_TABLE,
  resolvePurchaseOrderTotal,
  updatePurchaseOrderStatus,
  VENDOR_PORTAL_PO_SELECT,
  type PurchaseOrderRow,
} from '@/lib/hospital/procurement';
import {
  LEGACY_SEED_HOSPITAL_ID,
  REGAL_FACILITY_CODE,
  REGAL_HOSPITAL_CODE,
  REGAL_HOSPITAL_NAME,
} from '@/lib/regal/constants';
import { supabase } from '@/lib/supabaseClient';
import { ALL_HOSPITALS_CODE } from '@/lib/vendor/hospitals';
import { useActiveHospitalCode } from '@/lib/vendor/store/vendor-app-store';
import { vendorClasses } from '@/lib/vendor/theme';
import { formatDate, formatInr } from '@/lib/vendor/v0/portal-service';

type FilterTab = 'ALL' | 'ISSUED' | 'ACCEPTED' | 'DISPATCHED' | 'DELIVERED';

type VendorPortalOrder = PurchaseOrderRow & {
  hospital_id?: string;
};

const FILTER_TABS: FilterTab[] = ['ALL', 'ISSUED', 'ACCEPTED', 'DISPATCHED', 'DELIVERED'];

const HOSPITAL_NAME_MAP: Record<string, string> = {
  'a0000000-0000-0000-0000-000000000001': REGAL_HOSPITAL_NAME,
  [LEGACY_SEED_HOSPITAL_ID]: REGAL_HOSPITAL_NAME,
  [REGAL_HOSPITAL_CODE]: 'Regal Multispeciality Hospital',
  [REGAL_FACILITY_CODE]: REGAL_HOSPITAL_NAME,
};

const HOSPITAL_NODE_MAP: Record<string, string> = {
  'a0000000-0000-0000-0000-000000000001': REGAL_FACILITY_CODE,
  [LEGACY_SEED_HOSPITAL_ID]: REGAL_FACILITY_CODE,
  [REGAL_HOSPITAL_CODE]: REGAL_HOSPITAL_CODE,
  [REGAL_FACILITY_CODE]: REGAL_FACILITY_CODE,
};

function formatHospitalName(hospitalId?: string | null): string {
  if (!hospitalId) return REGAL_HOSPITAL_NAME;

  const key = hospitalId.trim();
  if (HOSPITAL_NAME_MAP[key]) return HOSPITAL_NAME_MAP[key];

  const upper = key.toUpperCase();
  if (upper === REGAL_HOSPITAL_CODE) return 'Regal Multispeciality Hospital';
  if (upper === REGAL_FACILITY_CODE) return REGAL_HOSPITAL_NAME;

  return REGAL_HOSPITAL_NAME;
}

function formatHospitalNodeTag(hospitalId?: string | null): string {
  if (!hospitalId) return REGAL_FACILITY_CODE;

  const key = hospitalId.trim();
  if (HOSPITAL_NODE_MAP[key]) return HOSPITAL_NODE_MAP[key];

  const upper = key.toUpperCase();
  if (upper === REGAL_HOSPITAL_CODE) return REGAL_HOSPITAL_CODE;
  if (upper === REGAL_FACILITY_CODE) return REGAL_FACILITY_CODE;
  if (isUuidValue(key)) return REGAL_FACILITY_CODE;

  return key;
}

function readVendorSession(): VendorSession | null {
  if (typeof window === 'undefined') return null;
  return getVendorSession();
}

function purchaseOrderFilterTab(status?: string | null): Exclude<FilterTab, 'ALL'> | 'OTHER' {
  const formatted = formatPurchaseOrderStatus(status);
  if (formatted === 'PENDING DISPATCH' || formatted === 'ISSUED') return 'ISSUED';
  if (formatted === 'ACCEPTED') return 'ACCEPTED';
  if (formatted === 'DISPATCHED' || formatted === 'INVOICED') return 'DISPATCHED';
  if (formatted === 'DELIVERED') return 'DELIVERED';
  return 'OTHER';
}

function matchesFilterTab(status: string | undefined, tab: FilterTab): boolean {
  if (tab === 'ALL') return true;
  return purchaseOrderFilterTab(status) === tab;
}

function matchesHospitalSelection(order: VendorPortalOrder, selectedHospitalCode: string): boolean {
  if (selectedHospitalCode === ALL_HOSPITALS_CODE) return true;

  const selected = selectedHospitalCode.toUpperCase();
  const hospitalId = String(order.hospital_id ?? '').toUpperCase();
  return hospitalId === selected || selected === 'RH-BLR-01' || selected === 'HOSP-01';
}

function mapVendorPortalOrder(row: Record<string, unknown>): VendorPortalOrder {
  return {
    ...mapPurchaseOrderRow(row),
    hospital_id: row.hospital_id ? String(row.hospital_id) : undefined,
  };
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

function statusBadgeLabel(status?: string | null): string {
  const tab = purchaseOrderFilterTab(status);
  if (tab === 'OTHER') return String(formatPurchaseOrderStatus(status)).toUpperCase();
  return tab;
}

function PurchaseOrdersWorkspace() {
  const hospitalCode = useActiveHospitalCode();
  const [orders, setOrders] = useState<VendorPortalOrder[]>([]);
  const [activeTab, setActiveTab] = useState<FilterTab>('ALL');
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const [vendorId, setVendorId] = useState('');
  const [vendorEmail, setVendorEmail] = useState('');
  const [vendorName, setVendorName] = useState('');

  const vendorKey = vendorId || vendorEmail || vendorName;
  const fetchInFlightRef = useRef(false);
  const fetchOrdersRef = useRef<(options?: { silent?: boolean }) => Promise<void>>(async () => {});

  useEffect(() => {
    const session = readVendorSession();
    if (!session) return;

    setVendorId(session.id?.trim() ?? '');
    setVendorEmail((session.email ?? session.rep_email ?? '').trim().toLowerCase());
    setVendorName((session.company_name ?? session.vendor_name ?? '').trim());
  }, []);

  const fetchOrders = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!supabase || fetchInFlightRef.current) return;

      fetchInFlightRef.current = true;
      if (!options?.silent) setLoading(true);

      try {
        let mapped: VendorPortalOrder[] = [];

        if (vendorKey) {
          const fetched = await fetchVendorPurchaseOrders(supabase, {
            id: vendorId || undefined,
            email: vendorEmail || undefined,
            company_name: vendorName || undefined,
          });

          if (fetched.length > 0) {
            mapped = fetched.map((order) => ({ ...order }));
          } else {
            const { rows, error } = await queryFlatPurchaseOrders(vendorId);
            if (error) {
              logSupabaseQueryError('PurchaseOrdersWorkspace.fetchOrders', error);
              if (!options?.silent) {
                toast.error(extractSupabaseErrorMessage(error, 'Failed to fetch purchase orders'));
              }
              setOrders([]);
              return;
            }
            mapped = rows
              .filter((row) => rowMatchesVendor(row, vendorId, vendorEmail, vendorName))
              .map(mapVendorPortalOrder);
          }
        } else {
          const { rows, error } = await queryFlatPurchaseOrders('');
          if (error) {
            logSupabaseQueryError('PurchaseOrdersWorkspace.fetchOrders', error);
            if (!options?.silent) {
              toast.error(extractSupabaseErrorMessage(error, 'Failed to fetch purchase orders'));
            }
            setOrders([]);
            return;
          }
          mapped = rows.map(mapVendorPortalOrder);
        }

        setOrders(mapped);
      } catch (err: unknown) {
        logSupabaseQueryError('PurchaseOrdersWorkspace.fetchOrders', err);
        if (!options?.silent) {
          toast.error(extractSupabaseErrorMessage(err, 'Unexpected error while loading purchase orders'));
        }
        setOrders([]);
      } finally {
        setLoading(false);
        fetchInFlightRef.current = false;
      }
    },
    [vendorEmail, vendorId, vendorKey, vendorName],
  );

  fetchOrdersRef.current = fetchOrders;

  useEffect(() => {
    if (!supabase) return;
    void fetchOrdersRef.current({ silent: false });

    const channel = supabase
      .channel(`vendor-po-workspace-${vendorKey || 'anonymous'}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: PROCUREMENT_PO_TABLE },
        () => {
          void fetchOrdersRef.current({ silent: true });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [vendorKey]);

  const hospitalScopedOrders = useMemo(
    () => orders.filter((order) => matchesHospitalSelection(order, hospitalCode)),
    [hospitalCode, orders],
  );

  const filteredOrders = useMemo(
    () => hospitalScopedOrders.filter((order) => matchesFilterTab(order.status, activeTab)),
    [activeTab, hospitalScopedOrders],
  );

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    if (!supabase) return;

    setUpdatingId(id);
    setOrders((prev) =>
      prev.map((order) =>
        order.id === id ? { ...order, status: formatPurchaseOrderStatus(newStatus) } : order,
      ),
    );

    try {
      const result = await updatePurchaseOrderStatus(supabase, id, newStatus);
      if (!result.ok) {
        throw new Error(result.error || 'Failed to update order status');
      }

      if (result.order) {
        setOrders((prev) =>
          prev.map((order) => (order.id === id ? { ...order, ...result.order! } : order)),
        );
      }

      toast.success(`Order status updated to ${formatPurchaseOrderStatus(newStatus)}`);
    } catch (err: unknown) {
      toast.error(extractSupabaseErrorMessage(err, 'Could not update order status'));
      await fetchOrdersRef.current({ silent: true });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleAcceptReject = async (id: string, action: 'accept' | 'reject') => {
    if (!supabase) return;

    setUpdatingId(id);
    const nextStatus = action === 'accept' ? 'ACCEPTED' : 'CANCELLED';
    setOrders((prev) =>
      prev.map((order) => (order.id === id ? { ...order, status: nextStatus } : order)),
    );

    try {
      const result = await applyVendorPurchaseOrderAction(supabase, id, action);
      if (!result.ok) {
        throw new Error(result.error || `Failed to ${action} order`);
      }

      if (result.order) {
        setOrders((prev) =>
          prev.map((order) => (order.id === id ? { ...order, ...result.order! } : order)),
        );
      }

      toast.success(action === 'accept' ? 'Purchase order accepted' : 'Purchase order rejected');
    } catch (err: unknown) {
      toast.error(extractSupabaseErrorMessage(err, `Could not ${action} order`));
      await fetchOrdersRef.current({ silent: true });
    } finally {
      setUpdatingId(null);
    }
  };

  const tabCount = (tab: FilterTab) =>
    tab === 'ALL'
      ? hospitalScopedOrders.length
      : hospitalScopedOrders.filter((order) => matchesFilterTab(order.status, tab)).length;

  return (
    <div className="space-y-6">
      <VendorModuleHeader
        title="Purchase Orders"
        description="Incoming POs from every partner hospital, synced live from Supabase."
        actions={
          <button
            type="button"
            disabled={loading}
            onClick={() => void fetchOrders({ silent: false })}
            className={vendorClasses.btnGhost}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} aria-hidden />
            Refresh
          </button>
        }
      />

      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold tracking-wide transition ${
              activeTab === tab
                ? 'border border-[#ceaef2] bg-[#faf7fe] text-vendor-charcoal'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tab} <span className="ml-1 opacity-75">({tabCount(tab)})</span>
          </button>
        ))}
      </div>

      <div className="w-full overflow-hidden rounded-xl border border-[#dcc2f9]/70 bg-white shadow-sm">
        <div className="grid grid-cols-12 items-center gap-4 border-b border-[#dcc2f9]/50 bg-[#faf7fe] px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-600">
          <div className="col-span-3">PO Number</div>
          <div className="col-span-2">Hospital</div>
          <div className="col-span-3">Items</div>
          <div className="col-span-1">Date</div>
          <div className="col-span-1 text-right">Total</div>
          <div className="col-span-1 text-center">Status</div>
          <div className="col-span-1 text-right">Actions</div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 p-10 text-center text-sm font-medium text-slate-500">
            <RefreshCw className="h-5 w-5 animate-spin text-vendor-primary" aria-hidden />
            Loading purchase orders…
          </div>
        ) : filteredOrders.length > 0 ? (
          <div className="divide-y divide-[#dcc2f9]/40">
            {filteredOrders.map((order, index) => {
              const pending = isVendorActionablePurchaseOrder(order.status);
              const orderTab = purchaseOrderFilterTab(order.status);
              const total = resolvePurchaseOrderTotal(order as unknown as Record<string, unknown>);

              return (
                <div
                  key={order.id || `${order.po_number}-${index}`}
                  className="grid grid-cols-12 items-center gap-4 px-6 py-4 text-sm transition-colors hover:bg-[#faf7fe]"
                >
                  <div className="col-span-3 font-semibold text-slate-800">
                    {order.po_number || 'PO-PENDING'}
                  </div>
                  <div className="col-span-2">
                    <span className="font-medium text-slate-800">
                      {formatHospitalName(order.hospital_id)}
                    </span>
                    <span className="mt-0.5 block font-mono text-[11px] text-slate-400">
                      {formatHospitalNodeTag(order.hospital_id)}
                    </span>
                  </div>
                  <div className="col-span-3 text-slate-600">
                    <span className="font-medium text-slate-800">{order.item_description}</span>
                    {order.quantity > 0 ? (
                      <span className="mt-0.5 block text-xs text-slate-400">Qty: {order.quantity}</span>
                    ) : null}
                  </div>
                  <div className="col-span-1 text-xs text-slate-500">
                    {order.created_at ? formatDate(order.created_at) : '—'}
                  </div>
                  <div className="col-span-1 text-right font-medium text-slate-900">
                    {formatInr(total)}
                  </div>
                  <div className="col-span-1 text-center">
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${getPurchaseOrderStatusBadgeClass(order.status)}`}
                    >
                      {statusBadgeLabel(order.status)}
                    </span>
                  </div>
                  <div className="col-span-1 flex items-center justify-end gap-2">
                    {pending ? (
                      <>
                        <button
                          type="button"
                          disabled={updatingId === order.id}
                          onClick={() => void handleAcceptReject(order.id, 'accept')}
                          className="rounded-md bg-vendor-primary px-2.5 py-1 text-xs font-semibold text-white shadow-sm hover:bg-vendor-secondary disabled:opacity-50"
                        >
                          Accept
                        </button>
                        <button
                          type="button"
                          disabled={updatingId === order.id}
                          onClick={() => void handleAcceptReject(order.id, 'reject')}
                          className="rounded-md border border-rose-200 px-2 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </>
                    ) : orderTab === 'ACCEPTED' ? (
                      <button
                        type="button"
                        disabled={updatingId === order.id}
                        onClick={() => void handleUpdateStatus(order.id, 'DISPATCHED')}
                        className="rounded-md bg-indigo-600 px-2.5 py-1 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
                      >
                        Dispatch
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-10 text-center text-sm text-slate-500">
            No purchase orders match the selected filter ({activeTab}).
          </div>
        )}
      </div>
    </div>
  );
}

export default PurchaseOrdersWorkspace;
export { PurchaseOrdersWorkspace };
