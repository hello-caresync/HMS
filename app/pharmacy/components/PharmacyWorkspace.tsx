'use client';

import Link from 'next/link';
import { ArrowLeft, Package, ShoppingCart } from 'lucide-react';

import { APP_ROUTES } from '../../lib/routes';
import { usePharmacy } from '../context/PharmacyProvider';
import DispensingPanel from './DispensingPanel';
import PharmacyQueueTable from './PharmacyQueueTable';
import PharmacyToastStack from './PharmacyToastStack';

export default function PharmacyWorkspace() {
  const { orders, activeOrderId, setActiveOrderId, getOrder, lowStockAlerts } = usePharmacy();
  const activeOrder = activeOrderId ? getOrder(activeOrderId) : undefined;

  const pendingCount = orders.filter((o) => o.status !== 'Completed').length;

  return (
    <div className="flex min-h-screen flex-col bg-[#eef1f5]">
      <header className="sticky top-0 z-30 flex h-11 items-center justify-between border-b border-slate-800 bg-[#0a0e14] px-3 sm:px-4">
        <div className="flex items-center gap-2.5">
          <Link
            href={APP_ROUTES.dashboard}
            className="rounded p-1 text-slate-800 hover:bg-slate-800 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <Package className="h-4 w-4 text-teal-400" />
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-800">
              Phase 9 · Pharmacy
            </p>
            <h1 className="text-sm font-bold leading-tight text-white">Dispatch Command Center</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {lowStockAlerts.length > 0 && (
            <span className="hidden items-center gap-1 rounded bg-rose-950 px-2 py-0.5 text-[10px] font-bold text-rose-400 sm:inline-flex">
              <ShoppingCart className="h-3 w-3" />
              {lowStockAlerts.length} procurement alert
              {lowStockAlerts.length > 1 ? 's' : ''}
            </span>
          )}
          <span className="rounded bg-teal-950 px-2 py-0.5 font-mono text-[10px] text-teal-400">
            {pendingCount} in queue
          </span>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-3 p-3 lg:flex-row lg:gap-0 lg:p-0">
        <section className="lg:w-[42%] lg:border-r lg:border-slate-200 lg:p-3">
          <PharmacyQueueTable />
          <p className="mt-2 hidden text-[10px] text-slate-800 lg:block">
            Select a row to open the dispensing panel →
          </p>
        </section>

        <section className="flex min-h-[420px] flex-1 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white lg:min-h-0 lg:rounded-none lg:border-0">
          {activeOrder ? (
            <DispensingPanel key={activeOrder.id} order={activeOrder} />
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center">
              <Package className="h-10 w-10 text-slate-900" />
              <p className="text-sm font-semibold text-slate-800">No prescription selected</p>
              <p className="max-w-xs text-xs text-slate-800">
                Choose an incoming EMR order from the dispatch queue to verify barcodes and dispense.
              </p>
              {orders.find((o) => o.status !== 'Completed') && (
                <button
                  type="button"
                  onClick={() => {
                    const next = orders.find((o) => o.status !== 'Completed');
                    if (next) setActiveOrderId(next.id);
                  }}
                  className="mt-2 rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-700"
                >
                  Open next pending order
                </button>
              )}
            </div>
          )}
        </section>
      </main>

      <PharmacyToastStack />
    </div>
  );
}
