'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { doctorUi } from '@/lib/nexora-doctor/design-tokens';
import { DOCTOR_NAV } from '@/lib/nexora-doctor/navigation';
import { cn } from '@/components/nexora-doctor/ui/primitives';

export function DoctorSidebar({ collapsed }: { collapsed?: boolean }) {
  const pathname = usePathname();

  return (
    <aside className={cn(doctorUi.sidebar, collapsed ? 'w-[72px]' : 'w-64')}>
      <div className={cn(doctorUi.sidebarHeader, collapsed && 'px-2 text-center')}>
        {!collapsed ? (
          <>
            <p className="text-lg font-bold tracking-tight text-white">Nexora</p>
            <p className="text-xs text-[#A3B19B]">Doctor</p>
          </>
        ) : (
          <span className="text-lg font-bold text-[#7A9A8B]">N</span>
        )}
      </div>

      <nav className="custom-scrollbar flex-1 space-y-1 overflow-y-auto p-3">
        {DOCTOR_NAV.map((item) => {
          const active = pathname === item.href || pathname?.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.id}
              href={item.href}
              title={item.label}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition',
                active ? doctorUi.sidebarActive : doctorUi.sidebarIdle,
                collapsed && 'justify-center px-2',
              )}
            >
              <Icon
                className={cn(
                  'h-5 w-5 shrink-0',
                  active ? 'text-[#7A9A8B]' : 'text-[#A3B19B]',
                )}
              />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {!collapsed && (
        <div className={doctorUi.sidebarFooter}>
          <p className="text-xs font-medium text-white">Nexora Health Platform</p>
          <p className="mt-0.5 text-[10px] text-[#A3B19B]">Clinical workstation</p>
        </div>
      )}
    </aside>
  );
}
