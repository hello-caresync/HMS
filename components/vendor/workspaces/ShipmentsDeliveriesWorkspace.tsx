'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, Plus, RefreshCw, Truck, X } from 'lucide-react';
import { toast } from 'sonner';

import { VendorModuleHeader } from '@/components/vendor/ui/VendorModuleHeader';
import { getVendorSession, type VendorSession } from '@/lib/auth/ecosystem-sessions';
import { extractSupabaseErrorMessage, logSupabaseQueryError, PROCUREMENT_PO_TABLE, resolvePurchaseOrderTotal } from '@/lib/hospital/procurement';
import { supabase } from '@/lib/supabaseClient';
import {
  deliveryStatusBadgeClass,
  deliveryStatusLabel,
  dispatchVendorPurchaseOrder,
  fetchVendorDeliveryOrders,
  formatVendorHospitalName,
  formatVendorHospitalNode,
  isDeliveredDelivery,
  isEnRouteDelivery,
  isInTransitDelivery,
  isReadyToDispatchDelivery,
  type VendorDeliveryOrder,
} from '@/lib/vendor/shipments';
import { vendorClasses } from '@/lib/vendor/theme';
import { formatDate, formatInr } from '@/lib/vendor/v0/portal-service';

const EMPTY_DISPATCH_FORM = {
  po_id: '',
  carrier_name: '',
  tracking_number: '',
  driver_contact: '',
};

function readVendorSession(): VendorSession | null {
  if (typeof window === 'undefined') return null;
  return getVendorSession();
}

export function ShipmentsDeliveriesWorkspace() {
  const [orders, setOrders] = useState<VendorDeliveryOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [dispatchForm, setDispatchForm] = useState(EMPTY_DISPATCH_FORM);
  const [dispatchBusy, setDispatchBusy] = useState(false);

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
        const rows = await fetchVendorDeliveryOrders(
          {
            id: vendorId || undefined,
            email: vendorEmail || undefined,
            company_name: vendorName || undefined,
          },
          supabase,
        );
        setOrders(rows);
      } catch (err: unknown) {
        logSupabaseQueryError('ShipmentsDeliveriesWorkspace.fetchOrders', err);
        if (!options?.silent) {
          toast.error(extractSupabaseErrorMessage(err, 'Could not load shipments & deliveries'));
        }
        setOrders([]);
      } finally {
        setLoading(false);
        fetchInFlightRef.current = false;
      }
    },
    [vendorEmail, vendorId, vendorName],
  );

  fetchOrdersRef.current = fetchOrders;

  useEffect(() => {
    if (!supabase) return;
    void fetchOrdersRef.current({ silent: false });

    const channel = supabase
      .channel(`vendor-deliveries-${vendorKey || 'anonymous'}`)
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

  const inTransitCount = useMemo(
    () => orders.filter((order) => isInTransitDelivery(order.status)).length,
    [orders],
  );
  const readyCount = useMemo(
    () => orders.filter((order) => isReadyToDispatchDelivery(order.status)).length,
    [orders],
  );
  const deliveredCount = useMemo(
    () => orders.filter((order) => isDeliveredDelivery(order.status)).length,
    [orders],
  );

  const readyToDispatchOrders = useMemo(
    () => orders.filter((order) => isReadyToDispatchDelivery(order.status)),
    [orders],
  );

  const openDispatchModal = (order?: VendorDeliveryOrder) => {
    setDispatchForm({
      po_id: order?.id ?? '',
      carrier_name: order?.carrier_name ?? '',
      tracking_number: order?.tracking_number ?? '',
      driver_contact: order?.driver_contact ?? '',
    });
    setIsDispatchModalOpen(true);
  };

  const handleDispatchSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!supabase || !dispatchForm.po_id || dispatchBusy) return;

    setDispatchBusy(true);
    setUpdatingId(dispatchForm.po_id);
    try {
      const result = await dispatchVendorPurchaseOrder(dispatchForm, supabase);
      if (!result.ok) {
        throw new Error(result.error || 'Dispatch failed');
      }

      setOrders((prev) =>
        prev.map((order) =>
          order.id === dispatchForm.po_id
            ? {
                ...order,
                status: 'DISPATCHED',
                carrier_name: dispatchForm.carrier_name.trim() || order.carrier_name,
                tracking_number: dispatchForm.tracking_number.trim() || order.tracking_number,
                driver_contact: dispatchForm.driver_contact.trim() || order.driver_contact,
              }
            : order,
        ),
      );

      toast.success(
        result.error
          ? `Consignment marked as in transit to hospital (${result.error})`
          : 'Consignment marked as in transit to hospital',
      );
      setIsDispatchModalOpen(false);
      setDispatchForm(EMPTY_DISPATCH_FORM);
    } catch (err: unknown) {
      toast.error(extractSupabaseErrorMessage(err, 'Could not dispatch order'));
      await fetchOrdersRef.current({ silent: true });
    } finally {
      setDispatchBusy(false);
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <VendorModuleHeader
        title="Shipments & Deliveries"
        description={`${inTransitCount} consignment${inTransitCount === 1 ? '' : 's'} in transit · ${readyCount} ready to dispatch · ${deliveredCount} delivered`}
        actions={
          <>
            <button
              type="button"
              onClick={() => openDispatchModal()}
              disabled={readyToDispatchOrders.length === 0}
              className={vendorClasses.btnPrimary}
            >
              <Plus className="h-4 w-4" aria-hidden />
              Dispatch Order
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => void fetchOrders({ silent: false })}
              className={vendorClasses.btnGhost}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} aria-hidden />
              Refresh
            </button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-indigo-100 bg-indigo-50/70 px-4 py-3">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-indigo-700">
            <Truck className="h-3.5 w-3.5" />
            In Transit
          </div>
          <div className="mt-1 text-2xl font-black text-indigo-900">{inTransitCount}</div>
        </div>
        <div className="rounded-2xl border border-amber-100 bg-amber-50/70 px-4 py-3">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-amber-700">
            <Plus className="h-3.5 w-3.5" />
            Ready to Dispatch
          </div>
          <div className="mt-1 text-2xl font-black text-amber-900">{readyCount}</div>
        </div>
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 px-4 py-3">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Delivered
          </div>
          <div className="mt-1 text-2xl font-black text-emerald-900">{deliveredCount}</div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-amber-200/70 bg-white shadow-sm">
        <div className="grid grid-cols-12 items-center gap-4 border-b border-amber-100 bg-[#FFF9ED] px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-600">
          <div className="col-span-2">Consignment / PO</div>
          <div className="col-span-2">Destination Hospital</div>
          <div className="col-span-3">Consignment Items</div>
          <div className="col-span-1">Date</div>
          <div className="col-span-1 text-right">Total</div>
          <div className="col-span-1 text-center">Status</div>
          <div className="col-span-2 text-right">Actions</div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 p-10 text-sm text-slate-500">
            <RefreshCw className="h-5 w-5 animate-spin text-amber-500" aria-hidden />
            Loading shipments & deliveries…
          </div>
        ) : orders.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-500">
            No active consignments yet. Accepted or dispatched purchase orders will appear here.
          </div>
        ) : (
          <div className="divide-y divide-amber-100/60">
            {orders.map((order, index) => {
              const total = resolvePurchaseOrderTotal(order as unknown as Record<string, unknown>);
              const status = String(order.status ?? '')
                .trim()
                .toUpperCase()
                .replace(/_/g, ' ');
              const awaitingDispatch = status === 'ACCEPTED' || isReadyToDispatchDelivery(order.status);
              const enRoute =
                status === 'DISPATCHED' ||
                status === 'IN TRANSIT' ||
                status === 'IN_TRANSIT' ||
                status === 'INVOICED' ||
                isEnRouteDelivery(order.status);
              const completed = status === 'DELIVERED' || isDeliveredDelivery(order.status);

              return (
                <div
                  key={order.id || `${order.po_number}-${index}`}
                  className="grid grid-cols-12 items-center gap-4 px-6 py-4 text-sm transition-colors hover:bg-amber-50/40"
                >
                  <div className="col-span-2 font-semibold text-slate-800">
                    {order.po_number || 'PO-PENDING'}
                    {order.tracking_number ? (
                      <span className="mt-0.5 block font-mono text-[11px] text-slate-400">
                        {order.tracking_number}
                      </span>
                    ) : null}
                  </div>
                  <div className="col-span-2">
                    <span className="font-medium text-slate-800">
                      {formatVendorHospitalName(order.hospital_id)}
                    </span>
                    <span className="mt-0.5 block font-mono text-[11px] text-slate-400">
                      {formatVendorHospitalNode(order.hospital_id)}
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
                  <div className="col-span-1 text-right font-medium text-slate-900">{formatInr(total)}</div>
                  <div className="col-span-1 text-center">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${deliveryStatusBadgeClass(order.status)}`}
                    >
                      {deliveryStatusLabel(order.status)}
                    </span>
                  </div>
                  <div className="col-span-2 flex flex-col items-end justify-center gap-1">
                    {awaitingDispatch ? (
                      <button
                        type="button"
                        disabled={updatingId === order.id || dispatchBusy}
                        onClick={() => openDispatchModal(order)}
                        className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-amber-600 disabled:opacity-50"
                      >
                        Dispatch Now
                      </button>
                    ) : enRoute && !completed ? (
                      <>
                        {order.carrier_name || order.tracking_number ? (
                          <span className="text-[11px] text-slate-500">
                            {[order.carrier_name, order.tracking_number].filter(Boolean).join(' · ')}
                          </span>
                        ) : null}
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                          <Truck className="h-3.5 w-3.5" aria-hidden />
                          En Route
                        </span>
                      </>
                    ) : completed ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
                        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                        Completed / Delivered
                      </span>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {isDispatchModalOpen ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <form
            onSubmit={(event) => void handleDispatchSubmit(event)}
            className="w-full max-w-md space-y-3 rounded-3xl border border-slate-200 bg-white p-6 text-xs shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Dispatch Order</h3>
              <button
                type="button"
                disabled={dispatchBusy}
                onClick={() => setIsDispatchModalOpen(false)}
                className="text-slate-400"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <label className="block font-bold uppercase text-slate-600">
              Purchase order *
              <select
                required
                disabled={dispatchBusy}
                value={dispatchForm.po_id}
                onChange={(event) =>
                  setDispatchForm((prev) => ({ ...prev, po_id: event.target.value }))
                }
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-medium normal-case"
              >
                <option value="">Select accepted order</option>
                {readyToDispatchOrders.map((order) => (
                  <option key={order.id} value={order.id}>
                    {order.po_number} · {order.item_description}
                  </option>
                ))}
              </select>
            </label>

            <label className="block font-bold uppercase text-slate-600">
              Carrier name
              <input
                disabled={dispatchBusy}
                value={dispatchForm.carrier_name}
                onChange={(event) =>
                  setDispatchForm((prev) => ({ ...prev, carrier_name: event.target.value }))
                }
                placeholder="BlueDart / Local Fleet"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-medium normal-case"
              />
            </label>

            <label className="block font-bold uppercase text-slate-600">
              Tracking number
              <input
                disabled={dispatchBusy}
                value={dispatchForm.tracking_number}
                onChange={(event) =>
                  setDispatchForm((prev) => ({ ...prev, tracking_number: event.target.value }))
                }
                placeholder="TRK-123456789"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-mono font-medium normal-case"
              />
            </label>

            <label className="block font-bold uppercase text-slate-600">
              Driver contact
              <input
                disabled={dispatchBusy}
                value={dispatchForm.driver_contact}
                onChange={(event) =>
                  setDispatchForm((prev) => ({ ...prev, driver_contact: event.target.value }))
                }
                placeholder="+91 98765 43210"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-medium normal-case"
              />
            </label>

            <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
              <button
                type="button"
                disabled={dispatchBusy}
                onClick={() => setIsDispatchModalOpen(false)}
                className="rounded-lg bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={dispatchBusy || !dispatchForm.po_id}
                className="rounded-lg bg-amber-500 px-5 py-2 text-xs font-semibold text-white disabled:opacity-60"
              >
                {dispatchBusy ? 'Dispatching…' : 'Confirm Dispatch'}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}

export default ShipmentsDeliveriesWorkspace;
