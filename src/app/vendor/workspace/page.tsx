'use client';

import { EcosystemRouteGuard } from '@/components/auth/EcosystemRouteGuard';
import { getVendorSession } from '@/lib/auth/ecosystem-sessions';
import { Package, FileText, Truck, Receipt } from 'lucide-react';

function VendorWorkspaceContent() {
  const vendor = getVendorSession();

  const cards = [
    { title: 'Open Purchase Orders', value: '12', icon: FileText, tone: 'text-blue-600 bg-blue-50' },
    { title: 'Medicine Batch Shipments', value: '5 In Transit', icon: Truck, tone: 'text-teal-600 bg-teal-50' },
    { title: 'Pending Invoices', value: '3', icon: Receipt, tone: 'text-amber-600 bg-amber-50' },
    { title: 'Catalog SKUs Active', value: '148', icon: Package, tone: 'text-indigo-600 bg-indigo-50' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6 font-sans sm:p-10">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="rounded-3xl border border-orange-200 bg-white p-8 shadow-sm">
          <p className="text-[10px] font-bold tracking-widest text-orange-600 uppercase">Vendor Workspace</p>
          <h1 className="mt-2 text-3xl font-black text-slate-900">{vendor?.company_name ?? 'Vendor Partner'}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {vendor?.rep_email} • {vendor?.category ?? 'General Supplies'}
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className={`mb-3 inline-flex rounded-xl p-2.5 ${card.tone}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="text-2xl font-black text-slate-900">{card.value}</div>
                <div className="mt-1 text-xs font-semibold text-slate-500">{card.title}</div>
              </div>
            );
          })}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-bold text-slate-900">Recent Procurement Activity</h2>
          <ul className="mt-4 space-y-3 text-sm text-slate-600">
            <li>PO-2026-1042 • Antibiotics batch • Awaiting dispatch confirmation</li>
            <li>PO-2026-1038 • Surgical consumables • Delivered to central store</li>
            <li>INV-2026-551 • Invoice submitted • Pending hospital finance approval</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default function VendorWorkspacePage() {
  return (
    <EcosystemRouteGuard role="vendor" loginPath="/vendor/login">
      <VendorWorkspaceContent />
    </EcosystemRouteGuard>
  );
}
