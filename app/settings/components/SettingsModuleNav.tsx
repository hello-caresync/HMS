'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BedDouble, LayoutGrid, Settings } from 'lucide-react';

import { APP_ROUTES } from '../../lib/routes';

const NAV = [
  {
    href: APP_ROUTES.settingsHub,
    label: 'Overview',
    icon: LayoutGrid,
  },
  {
    href: APP_ROUTES.settingsBedManagement,
    label: 'Bed Management',
    icon: BedDouble,
  },
] as const;

export default function SettingsModuleNav() {
  const pathname = usePathname();

  return (
    <div className="border-b-2 border-slate-200 bg-white px-4 py-3 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-slate-800">
            Hospital Configuration
          </p>
          <h1 className="text-lg font-black text-slate-900">Settings Hub</h1>
        </div>
        <nav className="flex gap-1 rounded-xl border-2 border-slate-200 bg-white p-1">
          {NAV.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-black transition ${
                  active
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-800 hover:bg-slate-100'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {item.label}
              </Link>
            );
          })}
          <Link
            href={APP_ROUTES.adminSettings}
            className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-black text-slate-800 hover:bg-slate-100"
          >
            <Settings className="h-3.5 w-3.5" />
            IT Security
          </Link>
        </nav>
      </div>
    </div>
  );
}
