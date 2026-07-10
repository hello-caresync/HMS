'use client';

import Link from 'next/link';
import {
  ArrowLeft,
  BarChart3,
  ClipboardList,
  FileText,
  ShoppingCart,
} from 'lucide-react';

import { APP_ROUTES } from '../../lib/routes';
import { useProcurement } from '../context/ProcurementProvider';
import type { ProcurementTab } from '../types';
import ActiveRFQsTab from './ActiveRFQsTab';
import PurchaseOrdersTab from './PurchaseOrdersTab';
import PurchaseRequestsTab from './PurchaseRequestsTab';
import VendorAnalyticsTab from './VendorAnalyticsTab';

const TABS: { id: ProcurementTab; label: string; icon: typeof ClipboardList }[] = [
  { id: 'requests', label: 'Purchase Requests', icon: ClipboardList },
  { id: 'rfqs', label: 'Active RFQs', icon: FileText },
  { id: 'orders', label: 'Purchase Orders', icon: ShoppingCart },
  { id: 'analytics', label: 'Vendor Analytics', icon: BarChart3 },
];

export default function ProcurementWorkspace() {
  const { activeTab, setActiveTab, purchaseRequests, rfqs, purchaseOrders } = useProcurement();

  const counts: Record<ProcurementTab, number> = {
    requests: purchaseRequests.filter((r) => r.status === 'Pending').length,
    rfqs: rfqs.filter((r) => r.status !== 'Awarded').length,
    orders: purchaseOrders.length,
    analytics: 0,
  };

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
          <ShoppingCart className="h-4 w-4 text-indigo-400" />
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-800">
              Phase 14 · Procurement
            </p>
            <h1 className="text-sm font-bold leading-tight text-white">
              Procurement Command Center
            </h1>
          </div>
        </div>
        <span className="hidden rounded bg-indigo-950 px-2 py-0.5 font-mono text-[10px] text-indigo-400 sm:inline">
          B2B SOURCING HUB
        </span>
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
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-800 hover:bg-slate-100'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
              {counts[id] > 0 && id !== 'analytics' && (
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[9px] ${
                    activeTab === id ? 'bg-white/20' : 'bg-slate-200'
                  }`}
                >
                  {counts[id]}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <main className="mx-auto w-full max-w-6xl flex-1 p-3">
        {activeTab === 'requests' && <PurchaseRequestsTab />}
        {activeTab === 'rfqs' && <ActiveRFQsTab />}
        {activeTab === 'orders' && <PurchaseOrdersTab />}
        {activeTab === 'analytics' && <VendorAnalyticsTab />}
      </main>
    </div>
  );
}
