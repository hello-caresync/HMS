'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { DOCTOR_NAV } from '@/lib/nexora-doctor/navigation';
import { cn } from '@/components/nexora-doctor/ui/primitives';

export function DoctorSidebar({ collapsed }: { collapsed?: boolean }) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        'flex h-full flex-col border-r border-slate-200 bg-white transition-all',
        collapsed ? 'w-[72px]' : 'w-64',
      )}
    >
      <div className={cn('border-b border-slate-100 px-4 py-5', collapsed && 'px-2 text-center')}>
        {!collapsed ? (
          <>
            <p className="text-lg font-bold tracking-tight text-slate-900">Nexora</p>
            <p className="text-xs text-slate-500">Doctor</p>
          </>
        ) : (
          <span className="text-lg font-bold text-teal-700">N</span>
        )}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {DOCTOR_NAV.map((item) => {
          const active = pathname === item.href || pathname?.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.id}
              href={item.href}
              title={item.label}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
                active
                  ? 'border-l-[3px] border-teal-700 bg-teal-50 text-teal-800'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
                collapsed && 'justify-center px-2',
              )}
            >
              <Icon className={cn('h-5 w-5 shrink-0', active ? 'text-teal-700' : 'text-slate-400')} />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {!collapsed && (
        <div className="border-t border-slate-100 p-4">
          <p className="text-xs text-slate-400">Nexora Health Platform</p>
        </div>
      )}
    </aside>
  );
}
