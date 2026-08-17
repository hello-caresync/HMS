'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCheck, RefreshCw } from 'lucide-react';

import { VendorFeedbackBanner, useVendorFeedback } from '@/components/vendor/ui/useVendorFeedback';
import { VendorModuleHeader } from '@/components/vendor/ui/VendorModuleHeader';
import { vendorClasses } from '@/lib/vendor/theme';
import { matchesPurchaseOrderLifecycle } from '@/lib/vendor/lifecycle';
import { useActiveHospitalCode, useVendorAppStore } from '@/lib/vendor/store/vendor-app-store';
import {
  formatDate,
  formatInr,
  loadPurchaseOrders,
  poItemDetails,
  setPurchaseOrderStatus,
  subscribeVendorPortal,
  type PoStatus,
  type PurchaseOrder,
} from '@/lib/vendor/v0/portal-service';

/** Nexora Vendor · live purchase order workspace with realtime sync and bulk accept. */
function PurchaseOrdersWorkspace() {
  const { feedback, showSuccess, showError } = useVendorFeedback();
  const hospitalCode = useActiveHospitalCode();
  const lifecycleStage = useVendorAppStore((s) => s.workflowStage);
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const result = await loadPurchaseOrders(60, hospitalCode);
      setOrders(result.rows);
      setLoadError(result.error ?? null);
    } catch (error) {
      setOrders([]);
      setLoadError(error instanceof Error ? error.message : 'Could not load purchase orders.');
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
    () =>
      subscribeVendorPortal(
        () => void load(),
        {
          onPurchaseOrderInsert: (row) => {
            setOrders((current) => [row, ...current.filter((item) => item.id !== row.id)]);
          },
          onPurchaseOrderUpdate: (row) => {
            setOrders((current) => current.map((item) => (item.id === row.id ? row : item)));
          },
          onPurchaseOrderDelete: (id) => {
            setOrders((current) => current.filter((item) => item.id !== id));
          },
        },
        { hospitalCode },
      ),
    [load, hospitalCode],
  );

  const rows = useMemo(
    () => orders.filter((order) => matchesPurchaseOrderLifecycle(lifecycleStage, order.status)),
    [lifecycleStage, orders],
  );

  const selectableIds = useMemo(
    () => rows.filter((order) => order.status.toUpperCase() === 'ISSUED').map((order) => order.id),
    [rows],
  );

  const selectedVisible = selected.filter((id) => selectableIds.includes(id));
  const allSelected = selectableIds.length > 0 && selectedVisible.length === selectableIds.length;

  const toggleRow = (id: string) => {
    setSelected((current) =>
      current.includes(id) ? current.filter((value) => value !== id) : [...current, id],
    );
  };

  const toggleAll = () => {
    setSelected(allSelected ? [] : selectableIds);
  };

  const applyStatus = async (ids: string[], status: PoStatus) => {
    if (ids.length === 0) return;
    setBusy(true);
    setOrders((current) => current.map((row) => (ids.includes(row.id) ? { ...row, status } : row)));

    const result = await setPurchaseOrderStatus(ids, status);
    setBusy(false);
    setSelected([]);

    if (!result.ok) {
      showError(result.error ?? 'Could not update the purchase orders.');
      await load();
      return;
    }

    const label = status === 'ACCEPTED' ? 'accepted' : 'rejected';
    showSuccess(`${ids.length} order${ids.length === 1 ? '' : 's'} ${label}.`);
    await load();
  };

  return (
    <div className="space-y-6">
      <VendorModuleHeader
        title="Purchase Orders"
        description="Incoming POs from every partner hospital, synced live from Supabase."
        actions={
          <>
            <button
              type="button"
              disabled={busy || selectedVisible.length === 0}
              onClick={() => void applyStatus(selectedVisible, 'ACCEPTED')}
              className={vendorClasses.btnPrimary}
            >
              <CheckCheck className="h-4 w-4" aria-hidden />
              Bulk accept selected{selectedVisible.length > 0 ? ` (${selectedVisible.length})` : ''}
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
        <p className="text-sm font-medium text-vendor-muted">Loading purchase orders…</p>
      ) : rows.length === 0 ? (
        <p className="rounded-xl border border-dashed border-vendor-accent/40 px-4 py-10 text-center text-sm font-medium text-vendor-muted">
          No purchase orders in this view.
        </p>
      ) : (
        <div className="w-full overflow-hidden rounded-xl border border-amber-200/70 bg-white shadow-sm">
          <div className="grid grid-cols-12 items-center gap-4 border-b border-amber-100 bg-[#FFF9ED] px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-600">
            <div className="col-span-1 flex items-center">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleAll}
                disabled={selectableIds.length === 0}
                aria-label="Select all issued orders"
                className="h-4 w-4 rounded border-slate-300 text-amber-500 focus:ring-amber-400"
              />
            </div>
            <div className="col-span-2">PO Number</div>
            <div className="col-span-2">Hospital</div>
            <div className="col-span-3">Items</div>
            <div className="col-span-1">Received</div>
            <div className="col-span-1 text-right">Total</div>
            <div className="col-span-1 text-center">Status</div>
            <div className="col-span-1 text-right">Actions</div>
          </div>

          <div className="divide-y divide-amber-100/60">
            {rows.map((po, index) => {
              const pending = po.status.toUpperCase() === 'ISSUED';
              const itemDetails = po.item_details || poItemDetails(po) || 'Medical Consumables';

              return (
                <div
                  key={po.id || `${po.po_number}-${index}`}
                  className="grid grid-cols-12 items-center gap-4 px-6 py-4 text-sm transition-colors hover:bg-amber-50/40"
                >
                  <div className="col-span-1 flex items-center">
                    <input
                      type="checkbox"
                      checked={selected.includes(po.id)}
                      onChange={() => toggleRow(po.id)}
                      disabled={!pending}
                      aria-label={`Select ${po.po_number}`}
                      className="h-4 w-4 rounded border-slate-300 text-amber-500 focus:ring-amber-400"
                    />
                  </div>
                  <div className="col-span-2 font-semibold text-slate-800">{po.po_number}</div>
                  <div className="col-span-2 text-slate-600">{po.hospital_name || po.hospital_code}</div>
                  <div className="col-span-3 truncate text-slate-600" title={itemDetails}>
                    {itemDetails}
                  </div>
                  <div className="col-span-1 text-xs text-slate-500">{formatDate(po.created_at)}</div>
                  <div className="col-span-1 text-right font-medium text-slate-900">
                    {formatInr(Number(po.total_amount))}
                  </div>
                  <div className="col-span-1 text-center">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        po.status === 'ISSUED'
                          ? 'bg-amber-100 text-amber-800'
                          : po.status === 'ACCEPTED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : po.status === 'DISPATCHED'
                              ? 'bg-blue-100 text-blue-800'
                              : po.status === 'REJECTED'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {po.status}
                    </span>
                  </div>
                  <div className="col-span-1 flex items-center justify-end gap-2">
                    {pending ? (
                      <>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void applyStatus([po.id], 'ACCEPTED')}
                          className="rounded-md bg-amber-500 px-2.5 py-1 text-xs font-semibold text-white shadow-sm hover:bg-amber-600 disabled:opacity-60"
                        >
                          Accept
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void applyStatus([po.id], 'REJECTED')}
                          className="rounded-md border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-60"
                        >
                          Reject
                        </button>
                      </>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default PurchaseOrdersWorkspace;
export { PurchaseOrdersWorkspace };
