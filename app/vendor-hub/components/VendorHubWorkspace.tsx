'use client';

import Link from 'next/link';
import {
  ArrowLeft,
  BarChart3,
  Link2,
  Radio,
  Truck,
  Wallet,
} from 'lucide-react';

import { APP_ROUTES } from '../../lib/routes';
import { useVendorHub } from '../context/VendorHubProvider';
import type { VendorHubTab } from '../types';
import PaymentTrackerLedger from './PaymentTrackerLedger';
import POTrackingFeed from './POTrackingFeed';
import VendorScorecardView from './VendorScorecardView';

const TABS: { id: VendorHubTab; label: string; icon: typeof Truck }[] = [
  { id: 'tracking', label: 'PO Tracking', icon: Truck },
  { id: 'scorecard', label: 'Performance & Compliance', icon: BarChart3 },
  { id: 'payments', label: 'Payment Ledger', icon: Wallet },
];

export default function VendorHubWorkspace() {
  const { activeTab, setActiveTab, trackedPOs, livePulse } = useVendorHub();

  const inTransit = trackedPOs.filter((p) => p.deliveryStatus === 'In-Transit').length;

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
          <Link2 className="h-4 w-4 text-cyan-400" />
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-800">
              Phase 15 · Vendor Integration
            </p>
            <h1 className="text-sm font-bold leading-tight text-white">
              Vendor Integration Control Center
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`hidden items-center gap-1 rounded px-2 py-0.5 text-[10px] font-bold sm:inline-flex ${
              livePulse ? 'animate-pulse bg-cyan-950 text-cyan-300' : 'bg-slate-800 text-slate-800'
            }`}
          >
            <Radio className="h-3 w-3" />
            B2B feed active
          </span>
          <span className="rounded bg-violet-950 px-2 py-0.5 font-mono text-[10px] text-violet-400">
            {inTransit} in-transit
          </span>
        </div>
      </header>

      <div className="border-b-2 border-slate-200 bg-white px-3">
        <div className="mx-auto flex max-w-6xl gap-1 overflow-x-auto py-2">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={`flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[10px] font-bold transition ${
                activeTab === id
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-800 hover:bg-slate-100'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      <main className="mx-auto w-full max-w-6xl flex-1 space-y-3 p-3">
        {activeTab === 'tracking' && <POTrackingFeed />}
        {activeTab === 'scorecard' && <VendorScorecardView />}
        {activeTab === 'payments' && <PaymentTrackerLedger />}
      </main>
    </div>
  );
}
