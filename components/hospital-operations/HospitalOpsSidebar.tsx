'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import { hospitalOpsClasses } from '@/lib/hospital/design-tokens';
import { fetchSidebarBadgeCounts, useHospitalOpsRealtime } from '@/lib/hospital/operations/realtime';
import type { SidebarBadgeCounts } from '@/lib/hospital/operations/types';

type NavItem = {
  label: string;
  href: string;
  badgeKey?: keyof SidebarBadgeCounts;
  badgeTone?: 'default' | 'warning' | 'critical';
};

const NAV: NavItem[] = [
  { label: 'Command Center', href: '/dashboard/' },
  { label: 'OPD & Reception', href: '/opd/', badgeKey: 'opd' },
  { label: 'Emergency Triage', href: '/emergency/', badgeKey: 'emergency', badgeTone: 'critical' },
  { label: 'IPD Bed Census', href: '/ipd/', badgeKey: 'ipd' },
  { label: 'Central Pharmacy', href: '/pharmacy/', badgeKey: 'pharmacy', badgeTone: 'warning' },
  { label: 'Supply Chain', href: '/inventory/', badgeKey: 'inventory', badgeTone: 'warning' },
  { label: 'Diagnostics Lab', href: '/lab/' },
  { label: 'Billing & Cashier', href: '/billing/' },
];

function badgeClass(tone?: NavItem['badgeTone']) {
  if (tone === 'critical') return hospitalOpsClasses.badgeCritical;
  if (tone === 'warning') return hospitalOpsClasses.badgeWarning;
  return hospitalOpsClasses.badgeDefault;
}

export function HospitalOpsSidebar() {
  const pathname = usePathname();
  const [badges, setBadges] = useState<SidebarBadgeCounts>({
    opd: 0,
    emergency: 0,
    ipd: 0,
    pharmacy: 0,
    inventory: 0,
  });

  const refreshBadges = useCallback(() => {
    void fetchSidebarBadgeCounts().then(setBadges).catch(() => undefined);
  }, []);

  const { latencyMs, connected } = useHospitalOpsRealtime(refreshBadges);

  useEffect(() => {
    refreshBadges();
  }, [refreshBadges]);

  return (
    <aside className={hospitalOpsClasses.sidebar} aria-label="Hospital operations navigation">
      <div className="border-b border-[#3d5c55] px-4 py-4">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#CAD2C5]">Nexora</p>
        <h1 className="text-sm font-black text-white leading-tight">Hospital Operations</h1>
        <p className="text-[10px] font-bold text-[#CAD2C5] mt-0.5">Central Command Hub</p>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3">
        <ul className="space-y-0.5">
          {NAV.map((item) => {
            const active = pathname?.startsWith(item.href.replace(/\/$/, ''));
            const count = item.badgeKey ? badges[item.badgeKey] : 0;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center justify-between rounded-md px-3 py-1.5 text-[11px] font-bold transition ${
                    active ? hospitalOpsClasses.sidebarLinkActive : hospitalOpsClasses.sidebarLinkIdle
                  }`}
                >
                  <span>{item.label}</span>
                  {item.badgeKey && count > 0 ? (
                    <span
                      className={`min-w-[1.25rem] rounded px-1.5 py-0.5 text-center text-[9px] font-black ${badgeClass(item.badgeTone)}`}
                    >
                      {count > 99 ? '99+' : count}
                    </span>
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-[#3d5c55] px-3 py-3">
        <div className="rounded-md bg-[#3d5c55]/60 px-3 py-2">
          <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-wider">
            <span className="text-[#CAD2C5]">Realtime</span>
            <span className={connected ? 'text-[#84A98C]' : 'text-[#D4A373]'}>
              {connected ? 'Live' : 'Syncing'}
            </span>
          </div>
          <p className="mt-1 text-[10px] font-semibold text-white">
            Latency {latencyMs != null ? `${latencyMs}ms` : '—'}
          </p>
        </div>
      </div>
    </aside>
  );
}
