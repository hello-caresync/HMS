'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

import { APP_ROUTES } from '../../lib/routes';
import VendorSidebar from './components/VendorSidebar';
import { DashboardShellSkeleton } from './components/hubUi';
import { VENDOR_NAV_ITEMS } from './navConfig';
import VendorSecureHubWorkspace from './VendorSecureHubWorkspace';

function VendorSecureHubLanding() {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0F172A] text-white antialiased">
      <VendorSidebar navItems={VENDOR_NAV_ITEMS} />

      <main className="custom-scrollbar flex flex-1 flex-col overflow-y-auto p-8">
        <div className="mx-auto w-full max-w-4xl space-y-8">
          <header className="space-y-2">
            <p className="font-mono text-[11px] uppercase tracking-wider text-amber-500">
              Vendor secure hub
            </p>
            <h1 className="text-3xl font-black tracking-tight text-white">
              CuraSync Supply Command Center
            </h1>
            <p className="max-w-2xl text-sm font-medium text-slate-800">
              Midnight Charcoal operations bridge. Select a corridor from the sidebar or
              launch a module below to enter the live dashboard workspace.
            </p>
          </header>

          <section className="rounded-2xl border border-amber-500/20 bg-[#1E293B] p-6 shadow-lg">
            <p className="font-mono text-[10px] uppercase tracking-wider text-amber-500">
              Primary corridor
            </p>
            <h2 className="mt-2 text-xl font-black text-white">Purchase Order Inbox</h2>
            <p className="mt-2 text-xs font-medium text-slate-800">
              Review contract manifests, inspect PO detail panels, and accept hospital
              procurement terms.
            </p>
            <Link
              href={APP_ROUTES.vendorSecureHubPoInbox}
              className="mt-5 inline-flex rounded-xl border border-amber-500/30 bg-amber-500 px-5 py-3 text-xs font-bold text-[#0F172A] transition-all hover:bg-amber-400"
            >
              Open PO Detail Corridor →
            </Link>
          </section>

          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {VENDOR_NAV_ITEMS.filter((item) => item.id !== 'po_inbox').map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className="group rounded-2xl border border-amber-500/20 bg-[#1E293B] p-5 transition-all hover:border-amber-500/50 hover:bg-[#1E293B]/80"
              >
                <p className="font-mono text-[10px] uppercase tracking-wider text-slate-800 group-hover:text-amber-500">
                  Module
                </p>
                <h3 className="mt-2 text-sm font-black text-white">{item.label}</h3>
                <span className="mt-3 inline-block text-xs font-bold text-amber-500 transition-transform group-hover:translate-x-1">
                  Enter workspace →
                </span>
              </Link>
            ))}
          </section>

          <footer className="flex flex-wrap gap-4 border-t border-amber-500/10 pt-6 text-xs font-semibold text-slate-800">
            <Link href={APP_ROUTES.vendorGateway} className="hover:text-amber-500">
              ← Supplier gateway
            </Link>
            <Link href={APP_ROUTES.hospital} className="hover:text-amber-500">
              Hospital console →
            </Link>
          </footer>
        </div>
      </main>
    </div>
  );
}

function VendorSecureHubPageContent() {
  const searchParams = useSearchParams();
  const moduleParam = searchParams.get('module');

  if (moduleParam) {
    return <VendorSecureHubWorkspace />;
  }

  return <VendorSecureHubLanding />;
}

export default function VendorSecureHubPage() {
  return (
    <Suspense fallback={<DashboardShellSkeleton />}>
      <VendorSecureHubPageContent />
    </Suspense>
  );
}
