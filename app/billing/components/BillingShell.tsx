'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowLeft, BarChart3, Receipt } from 'lucide-react';

import { APP_ROUTES } from '../../lib/routes';
import BillingWorkspace from './BillingWorkspace';

type BillingView = 'terminal' | 'reports';

export default function BillingShell() {
  const [view, setView] = useState<BillingView>('terminal');

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
          <Receipt className="h-4 w-4 text-indigo-400" />
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-800">
              Phase 10 · Finance
            </p>
            <h1 className="text-sm font-bold leading-tight text-white">Corporate Ledger Terminal</h1>
          </div>
        </div>

        <div className="flex items-center gap-1 rounded-lg bg-slate-900 p-0.5">
          <TabButton
            active={view === 'terminal'}
            onClick={() => setView('terminal')}
            icon={Receipt}
            label="Billing"
          />
          <TabButton
            active={view === 'reports'}
            onClick={() => setView('reports')}
            icon={BarChart3}
            label="Reports"
          />
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 p-3">
        <BillingWorkspace view={view} />
      </main>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof Receipt;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[10px] font-bold transition ${
        active ? 'bg-indigo-600 text-white' : 'text-slate-800 hover:text-slate-200'
      }`}
    >
      <Icon className="h-3 w-3" />
      {label}
    </button>
  );
}
