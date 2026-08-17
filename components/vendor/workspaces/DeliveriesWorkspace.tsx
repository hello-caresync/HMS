'use client';

import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { RefreshCw, Truck } from 'lucide-react';

import { VendorFeedbackBanner, useVendorFeedback } from '@/components/vendor/ui/useVendorFeedback';
import { VendorModuleHeader } from '@/components/vendor/ui/VendorModuleHeader';
import { VendorModal, vendorFieldClass, vendorLabelClass } from '@/components/vendor/ui/VendorModal';
import { vendorClasses } from '@/lib/vendor/theme';
import { matchesShipmentLifecycle } from '@/lib/vendor/lifecycle';
import { useActiveHospitalCode, useVendorAppStore } from '@/lib/vendor/store/vendor-app-store';
import {
  DISPATCHABLE_PO_STATUSES,
  dispatchShipment,
  formatInr,
  loadPurchaseOrders,
  loadShipments,
  markShipmentDelivered,
  poItemDetails,
  subscribeVendorPortal,
  type PurchaseOrder,
  type Shipment,
} from '@/lib/vendor/v0/portal-service';

type DispatchForm = {
  po_id: string;
  carrier_name: string;
  tracking_number: string;
  driver_contact: string;
};

const emptyForm: DispatchForm = { po_id: '', carrier_name: '', tracking_number: '', driver_contact: '' };

/** Nexora Vendor · V0 shipments workspace: dispatch accepted POs and track transit. */
function DeliveriesWorkspace() {
  const { feedback, showSuccess, showError } = useVendorFeedback();
  const hospitalCode = useActiveHospitalCode();
  const lifecycleStage = useVendorAppStore((s) => s.workflowStage);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [busyShipmentId, setBusyShipmentId] = useState<string | null>(null);
  const [form, setForm] = useState<DispatchForm>(emptyForm);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [shipmentResult, poResult] = await Promise.all([
        loadShipments(60, hospitalCode),
        loadPurchaseOrders(60, hospitalCode),
      ]);
      setShipments(shipmentResult.rows);
      setOrders(poResult.rows);
      setLoadError(shipmentResult.error ?? poResult.error ?? null);
    } catch (error) {
      setShipments([]);
      setOrders([]);
      setLoadError(error instanceof Error ? error.message : 'Could not load shipments.');
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

  const dispatchableOrders = useMemo(
    () => orders.filter((order) => DISPATCHABLE_PO_STATUSES.includes(order.status.toUpperCase())),
    [orders],
  );

  const orderStatusById = useMemo(
    () => Object.fromEntries(orders.map((order) => [order.id, order.status])),
    [orders],
  );

  const visibleShipments = useMemo(
    () =>
      shipments.filter((shipment) =>
        matchesShipmentLifecycle(lifecycleStage, shipment.status, orderStatusById[shipment.po_id]),
      ),
    [lifecycleStage, orderStatusById, shipments],
  );

  const orderLabel = useCallback(
    (poId: string) => {
      const match = orders.find((order) => order.id === poId);
      if (match) {
        return `${match.po_number} · ${match.hospital_name} · ${poItemDetails(match)}`;
      }
      const shipment = shipments.find((row) => row.po_id === poId);
      if (shipment?.po_number) {
        return `${shipment.po_number} · ${shipment.hospital_name ?? 'Regal Hospital'}`;
      }
      return poId.slice(0, 8);
    },
    [orders, shipments],
  );

  const openDispatch = () => {
    setForm({ ...emptyForm, po_id: dispatchableOrders[0]?.id ?? '' });
    setOpen(true);
  };

  const submitDispatch = async (event: FormEvent) => {
    event.preventDefault();
    if (!form.po_id) {
      showError('Select an accepted purchase order to dispatch.');
      return;
    }

    setSubmitting(true);
    const result = await dispatchShipment({
      po_id: form.po_id,
      carrier_name: form.carrier_name.trim(),
      tracking_number: form.tracking_number.trim(),
      driver_contact: form.driver_contact.trim(),
    });
    setSubmitting(false);

    if (!result.ok) {
      showError(result.error ?? 'Dispatch failed.');
      return;
    }

    showSuccess('Shipment dispatched · hospital notified.');
    await load();
    setForm(emptyForm);
    setOpen(false);
  };

  const deliver = async (shipment: Shipment) => {
    setBusyShipmentId(shipment.id);
    setShipments((current) =>
      current.map((row) => (row.id === shipment.id ? { ...row, status: 'DELIVERED' } : row)),
    );
    const result = await markShipmentDelivered(shipment.id);
    setBusyShipmentId(null);

    if (!result.ok) {
      showError(result.error ?? 'Could not update the shipment.');
      await load();
      return;
    }
    showSuccess(`${shipment.tracking_number} marked delivered.`);
    await load();
  };

  const activeShipments = visibleShipments.filter((row) => row.status.toUpperCase() === 'IN_TRANSIT');

  return (
    <div className="space-y-6">
      <VendorModuleHeader
        title="Shipments & Deliveries"
        description={`${activeShipments.length} consignment${activeShipments.length === 1 ? '' : 's'} in transit · ${dispatchableOrders.length} accepted order${dispatchableOrders.length === 1 ? '' : 's'} ready to dispatch.`}
        actions={
          <>
            <button
              type="button"
              onClick={openDispatch}
              disabled={loading || dispatchableOrders.length === 0}
              className={vendorClasses.btnPrimary}
            >
              <Truck className="h-4 w-4" aria-hidden />
              Dispatch Order
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
        <p className="text-sm font-medium text-vendor-muted">Loading shipments…</p>
      ) : visibleShipments.length === 0 ? (
        <p className="rounded-xl border border-dashed border-vendor-accent/40 px-4 py-10 text-center text-sm font-medium text-vendor-muted">
          No shipments match the selected lifecycle stage.
        </p>
      ) : (
        <div className="w-full overflow-hidden rounded-xl border border-amber-200/70 bg-white shadow-sm">
          <div className="grid grid-cols-12 items-center gap-3 border-b border-amber-100 bg-[#FFF9ED] px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-600">
            <div className="col-span-2">Tracking</div>
            <div className="col-span-3">Purchase Order</div>
            <div className="col-span-2">Carrier</div>
            <div className="col-span-2">Driver Contact</div>
            <div className="col-span-1">Dispatched</div>
            <div className="col-span-1 text-center">Status</div>
            <div className="col-span-1 text-right">Action</div>
          </div>

          <div className="divide-y divide-amber-100/60">
            {visibleShipments.map((s, index) => {
              const inTransit = s.status.toUpperCase() === 'IN_TRANSIT';
              return (
                <div
                  key={s.id || `${s.tracking_number}-${index}`}
                  className="grid grid-cols-12 items-center gap-3 px-6 py-4 text-sm transition-colors hover:bg-amber-50/40"
                >
                  <div className="col-span-2 font-bold text-slate-900">{s.tracking_number}</div>
                  <div className="col-span-3 text-xs text-slate-700">
                    <span className="font-semibold text-slate-900">{s.po_number || orderLabel(s.po_id)}</span>
                    <span className="text-slate-500"> · {s.hospital_name || 'Hospital'}</span>
                  </div>
                  <div className="col-span-2 text-slate-700">{s.carrier_name}</div>
                  <div className="col-span-2 text-xs text-slate-600">{s.driver_contact || 'N/A'}</div>
                  <div className="col-span-1 text-xs text-slate-500">
                    {s.created_at
                      ? new Date(s.created_at).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })
                      : 'Today'}
                  </div>
                  <div className="col-span-1 text-center">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        inTransit ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {s.status}
                    </span>
                  </div>
                  <div className="col-span-1 text-right">
                    {inTransit ? (
                      <button
                        type="button"
                        disabled={busyShipmentId === s.id}
                        onClick={() => void deliver(s)}
                        className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-amber-600 disabled:opacity-60"
                      >
                        {busyShipmentId === s.id ? '…' : 'Mark delivered'}
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <VendorModal
        title="Dispatch order"
        open={open}
        onClose={() => setOpen(false)}
        footer={
          <>
            <button type="button" onClick={() => setOpen(false)} className={vendorClasses.btnGhost}>
              Cancel
            </button>
            <button
              type="submit"
              form="vendor-dispatch-form"
              disabled={submitting}
              className={vendorClasses.btnPrimary}
            >
              {submitting ? 'Dispatching…' : 'Create shipment'}
            </button>
          </>
        }
      >
        {dispatchableOrders.length === 0 ? (
          <p className="text-sm font-medium text-vendor-muted">
            No accepted purchase orders are waiting for dispatch.
          </p>
        ) : (
          <form id="vendor-dispatch-form" onSubmit={(event) => void submitDispatch(event)} className="space-y-3">
            <label className={vendorLabelClass}>
              Purchase order
              <select
                required
                value={form.po_id}
                onChange={(event) => setForm({ ...form, po_id: event.target.value })}
                className={vendorFieldClass}
              >
                <option value="">Select an accepted PO…</option>
                {dispatchableOrders.map((order, index) => (
                  <option key={order.id || `${order.po_number}-${index}`} value={order.id}>
                    {order.po_number} · {order.hospital_name} · {poItemDetails(order)} ·{' '}
                    {formatInr(Number(order.total_amount))}
                  </option>
                ))}
              </select>
            </label>
            <label className={vendorLabelClass}>
              Carrier name
              <input
                required
                value={form.carrier_name}
                onChange={(event) => setForm({ ...form, carrier_name: event.target.value })}
                placeholder="BlueDart Surface"
                className={vendorFieldClass}
              />
            </label>
            <label className={vendorLabelClass}>
              Tracking ID
              <input
                required
                value={form.tracking_number}
                onChange={(event) => setForm({ ...form, tracking_number: event.target.value })}
                placeholder="NX-TRK-88214"
                className={vendorFieldClass}
              />
            </label>
            <label className={vendorLabelClass}>
              Driver contact
              <input
                required
                value={form.driver_contact}
                onChange={(event) => setForm({ ...form, driver_contact: event.target.value })}
                placeholder="+91 98450 11223"
                className={vendorFieldClass}
              />
            </label>
            <p className="rounded-lg bg-vendor-cream px-3 py-2 text-xs font-medium text-vendor-muted">
              Submitting inserts an <span className="font-bold">IN_TRANSIT</span> shipment and moves the PO to{' '}
              <span className="font-bold">DISPATCHED</span> for the hospital.
            </p>
          </form>
        )}
      </VendorModal>
    </div>
  );
}

export default DeliveriesWorkspace;
export { DeliveriesWorkspace };
