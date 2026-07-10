'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Database, Pill } from 'lucide-react';

import { APP_ROUTES } from '../../lib/routes';

const NAV = [
  {
    href: APP_ROUTES.masterDataPharmacy,
    label: 'Pharmacy Catalog',
    icon: Pill,
  },
  {
    href: APP_ROUTES.masterData,
    label: 'Legacy Master Data',
    icon: Database,
  },
] as const;

export default function MasterDataModuleNav() {
  const pathname = usePathname();

  return (
    <div className="border-b-2 border-slate-200 bg-white px-4 py-3 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-800">
            Phase 1 · Module 4
          </p>
          <h1 className="text-lg font-black tracking-tight text-slate-900">Master Data Catalog</h1>
        </div>
        <nav className="flex gap-1 rounded-xl border border-slate-300 bg-slate-50 p-1">
          {NAV.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold transition ${
                  active
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-800 hover:bg-white hover:text-slate-900'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
