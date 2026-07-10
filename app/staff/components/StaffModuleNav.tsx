'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Shield, Users } from 'lucide-react';

import { APP_ROUTES } from '../../lib/routes';

const NAV_ITEMS = [
  {
    href: APP_ROUTES.staffDirectory,
    label: 'Staff Directory',
    icon: Users,
    description: 'Profiles · status · onboarding',
  },
  {
    href: APP_ROUTES.staffRoles,
    label: 'Role Matrix',
    icon: Shield,
    description: 'RBAC permissions grid',
  },
] as const;

export default function StaffModuleNav() {
  const pathname = usePathname();

  return (
    <div className="border-b-2 border-slate-200 bg-white px-4 py-3 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-800">
            Phase 1 · Module 2
          </p>
          <h1 className="text-lg font-black tracking-tight text-slate-900">
            Staff &amp; Role Management
          </h1>
        </div>

        <nav className="flex gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
          {NAV_ITEMS.map((item) => {
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
