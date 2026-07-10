'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { APP_ROUTES } from '../../../lib/routes';
import { VendorNavItem } from '../navConfig';

type VendorSidebarProps = {
  navItems: VendorNavItem[];
  activeModule?: string;
  newPoCount?: number;
};

const ACTIVE_NAV_CLASS =
  'group flex w-full cursor-pointer items-center justify-between gap-2 rounded-xl bg-[#0A4174] px-3 py-2.5 text-left text-sm font-black text-amber-500 shadow-sm transition-all';

const INACTIVE_NAV_CLASS =
  'group flex w-full cursor-pointer items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-slate-800 transition-all hover:bg-[#0A4174]/40 hover:text-amber-500';

export default function VendorSidebar({
  navItems,
  activeModule,
  newPoCount = 0,
}: VendorSidebarProps) {
  const pathname = usePathname();

  const isItemActive = (item: VendorNavItem) => {
    if (item.id === 'po_inbox') {
      return pathname.startsWith(APP_ROUTES.vendorSecureHubPoInbox);
    }

    if (pathname !== APP_ROUTES.vendorSecureHub) return false;
    return activeModule === item.id;
  };

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col overflow-y-auto border-r border-slate-800/80 bg-[#0F172A] custom-scrollbar">
      <div className="border-b border-white/5 px-4 py-4">
        <p className="text-[11px] font-black uppercase tracking-wider text-slate-800">
          Vendor cockpit
        </p>
        <p className="mt-1 font-mono text-xs font-black text-slate-950">
          secure-hub / v2
        </p>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const isActive = isItemActive(item);
          const showBadge = item.id === 'po_inbox' && newPoCount > 0;

          return (
            <Link
              key={item.id}
              href={item.href}
              className={isActive ? ACTIVE_NAV_CLASS : INACTIVE_NAV_CLASS}
            >
              <span className="flex min-w-0 items-center gap-2.5">
                <span
                  className={`h-1.5 w-1.5 shrink-0 rounded-full transition-colors ${
                    isActive
                      ? 'bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.8)]'
                      : 'bg-slate-600 group-hover:bg-amber-500/70'
                  }`}
                  aria-hidden
                />
                <span className="truncate">{item.label}</span>
              </span>
              {showBadge && (
                <span className="shrink-0 rounded-full border border-amber-500/30 bg-amber-500/15 px-2 py-0.5 font-mono text-[10px] font-black text-amber-500 tabular-nums">
                  {newPoCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="shrink-0 space-y-2 border-t border-white/5 p-4">
        <Link
          href={APP_ROUTES.hospital}
          className="flex w-full items-center justify-center rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-xs font-black text-slate-900 transition-all hover:bg-[#0A4174]/50 hover:text-amber-500"
        >
          Open hospital console
        </Link>
        <p className="text-center font-mono text-[10px] font-black text-slate-800">
          node · curasync-vendor
        </p>
      </div>
    </aside>
  );
}
