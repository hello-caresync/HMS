'use client';

import Link from 'next/link';
import { ArrowLeft, Wallet } from 'lucide-react';

import { APP_ROUTES } from '../../lib/routes';
import CollectionLedger from './CollectionLedger';
import ShiftControlPanel from './ShiftControlPanel';

export default function PaymentsWorkspace() {
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
          <Wallet className="h-4 w-4 text-emerald-400" />
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-800">
              Phase 11 · Payments
            </p>
            <h1 className="text-sm font-bold leading-tight text-white">
              Cashier & Collection Terminal
            </h1>
          </div>
        </div>
        <span className="hidden rounded bg-emerald-950 px-2 py-0.5 font-mono text-[10px] text-emerald-400 sm:inline">
          NEXORA-POS v1.0
        </span>
      </header>

      <main className="mx-auto grid w-full max-w-6xl flex-1 gap-3 p-3 lg:grid-cols-[280px_1fr]">
        <aside>
          <ShiftControlPanel />
        </aside>
        <section>
          <CollectionLedger />
        </section>
      </main>
    </div>
  );
}
