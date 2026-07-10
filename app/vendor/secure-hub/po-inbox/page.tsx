'use client';

import React, { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

import { APP_ROUTES } from '../../../lib/routes';
import RoleSelectorDropdown from '../../../components/RoleSelectorDropdown';
import POInboxDetail from '../components/POInboxDetail';
import VendorSidebar from '../components/VendorSidebar';
import { VENDOR_NAV_ITEMS } from '../navConfig';
import { EnterprisePO, POExtendedStatus, VendorUserRole } from '../types';
import { DashboardShellSkeleton } from '../components/hubUi';
import {
  normalizePurchaseOrders,
  parseStorageArray,
} from '../utils/storageSafe';

const SHARED_STORAGE_KEYS = {
  pos: 'curasync_shared_pos',
} as const;

const VENDOR_ROLES: VendorUserRole[] = [
  'ADMIN',
  'SALES_MANAGER',
  'BILLING_STAFF',
  'LOGISTICS_STAFF',
];

const ROLE_LABELS: Record<VendorUserRole, string> = {
  ADMIN: 'Company Administrator',
  SALES_MANAGER: 'Sales Operations Manager',
  BILLING_STAFF: 'Billing Clerk',
  LOGISTICS_STAFF: 'Logistics Agent',
};

function isInboxManifest(status: string | undefined): boolean {
  return status === 'New' || status === 'Accepted';
}

function POInboxRouteWorkspace() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const poId = searchParams.get('poId');

  const [isMounted, setIsMounted] = useState(false);
  const [currentRole, setCurrentRole] = useState<VendorUserRole>('ADMIN');
  const [purchaseOrders, setPurchaseOrders] = useState<EnterprisePO[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const runMemorySync = () => {
      if (typeof window === 'undefined') return;

      try {
        setPurchaseOrders(
          parseStorageArray(
            localStorage.getItem(SHARED_STORAGE_KEYS.pos),
            normalizePurchaseOrders,
          ),
        );
      } catch {
        setPurchaseOrders([]);
      }
    };

    runMemorySync();
    setIsMounted(true);

    window.addEventListener('storage', runMemorySync);
    const poller = window.setInterval(runMemorySync, 1000);

    return () => {
      window.removeEventListener('storage', runMemorySync);
      window.clearInterval(poller);
    };
  }, []);

  const inboxOrders = useMemo(
    () => purchaseOrders.filter((po) => isInboxManifest(po.status)),
    [purchaseOrders],
  );

  const newPoCount = useMemo(
    () => inboxOrders.filter((po) => po.status === 'New').length,
    [inboxOrders],
  );

  const selectedPo = useMemo(() => {
    if (poId) {
      return inboxOrders.find((po) => po.id === poId) ?? null;
    }
    return inboxOrders[0] ?? null;
  }, [inboxOrders, poId]);

  const triggerToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 3500);
  }, []);

  const updatePOStatus = useCallback(
    (targetPoId: string, nextStatus: POExtendedStatus) => {
      const updated = purchaseOrders.map((po) =>
        po.id === targetPoId ? { ...po, status: nextStatus } : po,
      );

      const normalized = normalizePurchaseOrders(updated);
      setPurchaseOrders(normalized);

      if (typeof window !== 'undefined') {
        localStorage.setItem(SHARED_STORAGE_KEYS.pos, JSON.stringify(normalized));
      }

      triggerToast(`Order status updated to ${nextStatus}`);
    },
    [purchaseOrders, triggerToast],
  );

  const handleBack = useCallback(() => {
    router.push(APP_ROUTES.vendorSecureHub);
  }, [router]);

  if (!isMounted) {
    return <DashboardShellSkeleton />;
  }

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-[#F4F7F6] font-sans text-slate-900 antialiased">
      <header className="z-30 flex shrink-0 flex-col gap-3 border-b border-[#3d4f50] bg-[#4A5D5E] px-6 py-3.5 text-white shadow-md md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md border border-white/20 bg-white/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-amber-300">
              PO Detail Corridor
            </span>
            <h1 className="text-lg font-black tracking-tight text-white">
              CuraSync Logistics & Supply Portal
            </h1>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <Link
              href={APP_ROUTES.vendorSecureHub}
              className="text-xs font-semibold text-white/70 transition-colors hover:text-amber-500"
            >
              ← Secure hub modules
            </Link>
            <span className="hidden text-white/30 sm:inline">·</span>
            <Link
              href={APP_ROUTES.vendorGateway}
              className="text-xs font-semibold text-white/70 transition-colors hover:text-white"
            >
              Supplier gateway
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-xl border border-white/15 bg-[#3d4f50]/80 px-3 py-2">
          <span className="shrink-0 text-[10px] font-black uppercase tracking-wider text-white/60">
            Role
          </span>
          <RoleSelectorDropdown
            value={currentRole}
            onChange={setCurrentRole}
            options={VENDOR_ROLES.map((role) => ({
              value: role,
              label: ROLE_LABELS[role],
            }))}
            align="right"
          />
        </div>
      </header>

      {toast && (
        <div
          role="status"
          className="fixed top-5 right-5 z-[250] flex items-center gap-2.5 rounded-xl border border-amber-500/30 bg-[#0F172A] px-5 py-3.5 text-xs font-medium text-amber-500 shadow-lg"
        >
          <span className="h-2 w-2 animate-pulse rounded-full bg-amber-500" />
          {toast}
        </div>
      )}

      <div className="relative flex w-full flex-1 overflow-hidden">
        <VendorSidebar navItems={VENDOR_NAV_ITEMS} activeModule="po_inbox" newPoCount={newPoCount} />

        <main className="custom-scrollbar flex h-full min-h-0 flex-1 flex-col overflow-y-auto bg-[#F4F7F6] px-6 py-6 pb-24">
          <div className="mx-auto w-full max-w-5xl space-y-4">
            {inboxOrders.length > 1 && (
              <div className="flex flex-wrap gap-2">
                {inboxOrders.map((po) => (
                  <button
                    key={po.id}
                    type="button"
                    onClick={() =>
                      router.push(`${APP_ROUTES.vendorSecureHubPoInbox}?poId=${po.id}`)
                    }
                    className={`rounded-xl border px-3 py-2 font-mono text-[10px] font-black transition-all ${
                      selectedPo?.id === po.id
                        ? 'border-amber-500/40 bg-[#0A4174] text-amber-500'
                        : 'border-slate-200 bg-white text-slate-800 hover:border-amber-500/30'
                    }`}
                  >
                    {po.id}
                  </button>
                ))}
              </div>
            )}

            {selectedPo ? (
              <POInboxDetail
                po={selectedPo}
                updatePOStatus={updatePOStatus}
                onBack={handleBack}
              />
            ) : (
              <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-xs">
                <p className="font-mono text-[10px] uppercase tracking-wider text-slate-800">
                  No active contracts
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-800">
                  No New or Accepted purchase orders are available for detail inspection.
                </p>
                <button
                  type="button"
                  onClick={handleBack}
                  className="mt-4 rounded-xl bg-[#0A4174] px-5 py-2.5 text-xs font-bold text-amber-500 transition-all hover:bg-[#001D39]"
                >
                  Return to secure hub
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function POInboxPage() {
  return (
    <Suspense fallback={<DashboardShellSkeleton />}>
      <POInboxRouteWorkspace />
    </Suspense>
  );
}
