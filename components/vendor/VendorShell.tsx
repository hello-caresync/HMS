'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronLeft, PanelLeftClose, PanelLeftOpen, Wifi } from 'lucide-react';
import type { ReactNode } from 'react';

import { HospitalSelector } from '@/components/vendor/HospitalSelector';
import { VendorWorkflowBar } from '@/components/vendor/VendorWorkflowBar';
import {
  VENDOR_NAV_ITEMS,
  VENDOR_PORTAL_ROUTES,
  isVendorNavActive,
} from '@/lib/vendor/navigation';
import { vendorClasses, VENDOR_BRAND } from '@/lib/vendor/theme';
import { useVendorAppStore } from '@/lib/vendor/store/vendor-app-store';

type VendorShellProps = { children: ReactNode };

export function VendorShell({ children }: VendorShellProps) {
  const pathname = usePathname();
  const collapsed = useVendorAppStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useVendorAppStore((s) => s.toggleSidebar);
  const realtimeConnected = useVendorAppStore((s) => s.realtimeConnected);
  const organization = useVendorAppStore((s) => s.organization);

  const sidebarWidth = collapsed ? 'w-[4.5rem]' : 'w-64';

  return (
    <div className={`min-h-screen text-base ${vendorClasses.canvas}`}>
      <aside
        className={`fixed top-0 left-0 z-50 flex h-screen flex-col overflow-hidden shadow-xl transition-[width] duration-200 ${sidebarWidth} ${vendorClasses.navShell}`}
        aria-label="Vendor navigation"
      >
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-white/10 px-3 pb-3 pt-6">
          {!collapsed ? (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold tracking-wider text-vendor-primary">{VENDOR_BRAND.name}</p>
              <p className="truncate text-[10px] font-medium text-white/70">{organization.tradeName}</p>
            </div>
          ) : (
            <span className="mx-auto text-xs font-black text-vendor-primary">NX</span>
          )}
          <button
            type="button"
            onClick={toggleSidebar}
            className="rounded-lg p-1.5 text-white/70 hover:bg-white/10 hover:text-white"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </button>
        </div>

        <nav className="custom-scrollbar min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-2 py-3">
          <ul className="space-y-1">
            {VENDOR_NAV_ITEMS.map(({ key, label, href, icon: Icon, badge }) => {
              const active = isVendorNavActive(pathname, href);
              const badgeCount = badge;
              return (
                <li key={href}>
                  <Link
                    href={href}
                    title={collapsed ? label : undefined}
                    className={`group flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm font-medium transition-all ${
                      active ? vendorClasses.navActive : vendorClasses.navIdle
                    }`}
                    aria-current={active ? 'page' : undefined}
                  >
                    <Icon className="h-4 w-4 shrink-0" aria-hidden />
                    {!collapsed ? <span className="min-w-0 flex-1 truncate">{label}</span> : null}
                    {!collapsed && badgeCount ? (
                      <span className="rounded-full bg-vendor-secondary/30 px-1.5 py-0.5 text-[10px] font-bold text-white tabular-nums">
                        {badgeCount}
                      </span>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="shrink-0 border-t border-white/10 p-3">
          <Link
            href="/vendor"
            className={`flex items-center justify-center gap-1 rounded-lg border border-white/15 py-2 text-[10px] font-bold text-white/75 hover:text-white ${collapsed ? 'px-1' : 'px-2'}`}
          >
            {!collapsed ? (
              <>
                <ChevronLeft className="h-3 w-3" aria-hidden />
                Gateway
              </>
            ) : (
              '↗'
            )}
          </Link>
        </div>
      </aside>

      <div
        className={`flex min-h-screen flex-col transition-[margin] duration-200 ${collapsed ? 'md:ml-[4.5rem]' : 'md:ml-64'}`}
      >
        <header
          className={`sticky top-0 z-40 flex flex-wrap items-center justify-between gap-3 px-4 py-3 backdrop-blur ${vendorClasses.topBar}`}
        >
          <HospitalSelector />
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-bold ${
                realtimeConnected
                  ? 'border-vendor-success/40 bg-vendor-success/15 text-vendor-charcoal'
                  : 'border-vendor-accent/30 bg-vendor-cream text-vendor-muted'
              }`}
            >
              <Wifi className="h-3 w-3" aria-hidden />
              {realtimeConnected ? 'Live sync' : 'Offline'}
            </span>
            <Link href={VENDOR_PORTAL_ROUTES.communication} className={vendorClasses.btnGhost}>
              Messages
            </Link>
          </div>
        </header>

        <div className="border-b border-vendor-accent/20 bg-vendor-card/90 px-4 py-2">
          <VendorWorkflowBar />
        </div>

        <main className="flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
