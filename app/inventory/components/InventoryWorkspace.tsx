'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowLeft, ArrowRightLeft, Warehouse } from 'lucide-react';

import { APP_ROUTES } from '../../lib/routes';
import InventoryMetricsGrid from './InventoryMetricsGrid';
import InventoryTable from './InventoryTable';
import StockAuditSheet from './StockAuditSheet';
import StockTransferSheet from './StockTransferSheet';

export default function InventoryWorkspace() {
  const [transferOpen, setTransferOpen] = useState(false);

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
          <Warehouse className="h-4 w-4 text-amber-400" />
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-800">
              Phase 13 · Inventory
            </p>
            <h1 className="text-sm font-bold leading-tight text-white">
              Procurement & Stock Control
            </h1>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setTransferOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-md bg-amber-600 px-2.5 py-1 text-[10px] font-bold text-white hover:bg-amber-700"
        >
          <ArrowRightLeft className="h-3.5 w-3.5" />
          Initiate Transfer
        </button>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 space-y-3 p-3">
        <InventoryMetricsGrid />
        <InventoryTable />
        <StockAuditSheet />
      </main>

      <StockTransferSheet open={transferOpen} onClose={() => setTransferOpen(false)} />
    </div>
  );
}
