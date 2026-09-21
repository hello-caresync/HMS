'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, PackageCheck, Receipt, RefreshCw, Truck } from 'lucide-react';

import { VendorFeedbackBanner, useVendorFeedback } from '@/components/vendor/ui/useVendorFeedback';
import { VendorModuleHeader, VendorStatusPill } from '@/components/vendor/ui/VendorModuleHeader';
import { VendorStatCard } from '@/components/vendor/ui/VendorStatCard';
import { PROCUREMENT_PO_TABLE } from '@/lib/hospital/procurement';
import { supabase } from '@/lib/supabaseClient';
import { VENDOR_PORTAL_ROUTES } from '@/lib/vendor/navigation';
import { vendorClasses } from '@/lib/vendor/theme';
import { useActiveHospitalCode } from '@/lib/vendor/store/vendor-app-store';
import {
  VENDOR_ID,
  formatDate,
  formatInr,
  loadDashboardKpis,
  loadLatestPurchaseOrders,
  poItemDetails,
  poStatusTone,
  subscribeDashboard,
  type DashboardKpis,
  type PurchaseOrder,
} from '@/lib/vendor/v0/portal-service';

/** Regal Vendor · live dashboard wired to shared Supabase procurement tables. */
function DashboardWorkspace() {
  const { feedback, showSuccess, showError } = useVendorFeedback();
  const hospitalCode = useActiveHospitalCode();
  const [kpis, setKpis] = useState<DashboardKpis>({
    pendingPos: 0,
    activeShipments: 0,
    invoicedTotal: 0,
  });
  const [recentOrders, setRecentOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyPoId, setBusyPoId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [kpiResult, ordersResult] = await Promise.all([
        loadDashboardKpis(hospitalCode),
        loadLatestPurchaseOrders(5, hospitalCode),
      ]);
      setKpis(kpiResult.kpis);
      setRecentOrders(ordersResult.rows);
      setLoadError(kpiResult.error ?? ordersResult.error ?? null);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Could not load dashboard.');
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
      subscribeDashboard(
        () => void load(),
        {
          onPurchaseOrderInsert: (row) => {
            setRecentOrders((current) =>
              [row, ...current.filter((item) => item.id !== row.id)].slice(0, 5),
            );
            if (row.status.toUpperCase() === 'ISSUED') {
              setKpis((current) => ({ ...current, pendingPos: current.pendingPos + 1 }));
            }
          },
          onPurchaseOrderUpdate: (row) => {
            setRecentOrders((current) =>
              current.map((item) => (item.id === row.id ? row : item)),
            );
            void load();
          },
        },
        { hospitalCode },
      ),
    [load, hospitalCode],
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
    showSuccess('Dashboard refreshed from Supabase.');
  };

  const refreshMetrics = useCallback(async () => {
    const kpiResult = await loadDashboardKpis(hospitalCode);
    setKpis(kpiResult.kpis);
    if (kpiResult.error) setLoadError(kpiResult.error);
  }, [hospitalCode]);

  const persistOrderDecision = async (
    order: PurchaseOrder,
    decision: 'ACCEPTED' | 'REJECTED',
  ) => {
    const targetId = order.id;
    const targetPoNumber = order.po_number;
    const wasPending = order.status.toUpperCase() === 'ISSUED';

    setBusyPoId(order.id);
    setRecentOrders((prevOrders) =>
      prevOrders.map((o) =>
        o.id === targetId || o.po_number === targetPoNumber ? { ...o, status: decision } : o,
      ),
    );
    if (wasPending) {
      setKpis((current) => ({ ...current, pendingPos: Math.max(0, current.pendingPos - 1) }));
    }

    const procurementStatus = decision.toLowerCase();
    const legacyStatus = decision;
    const updatedAt = new Date().toISOString();

    let query = supabase.from(PROCUREMENT_PO_TABLE).update({
      status: procurementStatus,
      updated_at: updatedAt,
    });

    if (targetId && targetPoNumber) {
      query = query.or(`id.eq.${targetId},po_number.eq.${targetPoNumber}`);
    } else if (targetId) {
      query = query.eq('id', targetId);
    } else if (targetPoNumber) {
      query = query.eq('po_number', targetPoNumber);
    } else {
      setBusyPoId(null);
      showError('Missing purchase order identifier');
      await load();
      return;
    }

    const { data, error } = await query.select();

    if (!error && (!data || data.length === 0)) {
      let fallbackQuery = supabase
        .from('purchase_orders')
        .update({ status: legacyStatus, updated_at: updatedAt })
        .eq('vendor_id', VENDOR_ID);

      if (targetId && targetPoNumber) {
        fallbackQuery = fallbackQuery.or(`id.eq.${targetId},po_number.eq.${targetPoNumber}`);
      } else if (targetId) {
        fallbackQuery = fallbackQuery.eq('id', targetId);
      } else {
        fallbackQuery = fallbackQuery.eq('po_number', targetPoNumber);
      }

      const fallback = await fallbackQuery.select();

      if (fallback.error || !fallback.data || fallback.data.length === 0) {
        console.error('Update failed to affect any row:', fallback.error);
        showError('Failed to update order status in database');
        setBusyPoId(null);
        await load();
        return;
      }
    } else if (error) {
      console.error('Supabase update error:', error);
      showError(error.message || 'Failed to update order');
      setBusyPoId(null);
      await load();
      return;
    }

    setBusyPoId(null);
    showSuccess(
      decision === 'ACCEPTED'
        ? 'Purchase order marked as accepted'
        : `${order.po_number} rejected.`,
    );
    await refreshMetrics();
  };

  const handleAccept = (order: PurchaseOrder) => persistOrderDecision(order, 'ACCEPTED');
  const handleReject = (order: PurchaseOrder) => persistOrderDecision(order, 'REJECTED');

  const visibleOrders = recentOrders;

  return (
    <div className="space-y-6">
      <VendorModuleHeader
        title="Vendor Dashboard"
        description={`Live procurement sync for vendor ${VENDOR_ID.slice(0, 8)}… across all partner hospitals.`}
        actions={
          <button
            type="button"
            onClick={() => void handleRefresh()}
            disabled={loading || refreshing}
            className={vendorClasses.btnGhost}
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} aria-hidden />
            Refresh
          </button>
        }
      />

      <VendorFeedbackBanner feedback={feedback} />

      {loadError ? (
        <p className="rounded-lg border border-vendor-danger/30 bg-vendor-danger/5 px-4 py-2 text-sm font-medium text-vendor-danger">
          {loadError}
        </p>
      ) : null}

      {loading ? (
        <p className="text-sm font-medium text-vendor-muted">Loading vendor metrics…</p>
      ) : (
        <>
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <VendorStatCard
              label="Pending POs"
              value={kpis.pendingPos}
              icon={Receipt}
              tone="warning"
              hint={`${PROCUREMENT_PO_TABLE} · ISSUED`}
            />
            <VendorStatCard
              label="Active shipments"
              value={kpis.activeShipments}
              icon={Truck}
              hint="shipments · IN_TRANSIT"
            />
            <VendorStatCard
              label="Total invoiced"
              value={formatInr(kpis.invoicedTotal)}
              icon={PackageCheck}
              tone="success"
              hint="sum of invoices.total_amount"
            />
          </section>

          <section className={`${vendorClasses.card} p-5`}>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-black uppercase tracking-wider text-vendor-muted">
                  Latest incoming orders
                </h2>
                <p className="mt-0.5 text-xs font-medium text-vendor-muted">
                  Most recent 5 purchase orders · accept or reject inline.
                </p>
              </div>
              <Link href={VENDOR_PORTAL_ROUTES.purchaseOrders} className={vendorClasses.btnPrimary}>
                View all orders
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>

            {visibleOrders.length === 0 ? (
              <p className="rounded-xl border border-dashed border-vendor-accent/40 px-4 py-8 text-center text-sm font-medium text-vendor-muted">
                No purchase orders match the selected lifecycle stage.
              </p>
            ) : (
              <ul className="space-y-2">
                {visibleOrders.map((order, index) => {
                  const pending = order.status.toUpperCase() === 'ISSUED';
                  return (
                    <li
                      key={order.id || `${order.po_number}-${index}`}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-vendor-accent/20 px-4 py-3"
                    >
                      <div className="min-w-0">
                        <p className="font-mono text-sm font-bold text-vendor-charcoal">
                          {order.po_number}
                        </p>
                        <p className="truncate text-xs font-medium text-vendor-muted">
                          {order.hospital_name} · {poItemDetails(order)} · {formatDate(order.created_at)}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-sm font-bold text-vendor-charcoal">
                          {formatInr(Number(order.total_amount))}
                        </span>
                        <VendorStatusPill label={order.status} tone={poStatusTone(order.status)} />
                        {pending ? (
                          <>
                            <button
                              type="button"
                              disabled={busyPoId === order.id}
                              onClick={() => void handleAccept(order)}
                              className="rounded-lg bg-vendor-primary px-3 py-1.5 text-xs font-bold text-vendor-charcoal transition hover:bg-vendor-secondary hover:text-white disabled:opacity-60"
                            >
                              {busyPoId === order.id ? '…' : 'Accept'}
                            </button>
                            <button
                              type="button"
                              disabled={busyPoId === order.id}
                              onClick={() => void handleReject(order)}
                              className="rounded-lg border border-vendor-danger/40 px-3 py-1.5 text-xs font-bold text-vendor-danger transition hover:bg-vendor-danger/10 disabled:opacity-60"
                            >
                              Reject
                            </button>
                          </>
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}

export default DashboardWorkspace;
export { DashboardWorkspace };
