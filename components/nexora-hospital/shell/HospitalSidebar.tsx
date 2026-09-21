'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { LogOut } from 'lucide-react';

import { clearAdminSession } from '@/lib/admin/auth';
import { HospitalOperationsSidebarBrand } from '@/components/hospital/HospitalOperationsSidebarBrand';
import { ui } from '@/components/nexora-hospital/ui/primitives';
import { HOSPITAL_NAV, hospitalModuleFromPath } from '@/lib/nexora-hospital/navigation';

type HospitalSidebarProps = {
  mobile?: boolean;
  onNavigate?: () => void;
};

export function HospitalSidebar({ mobile, onNavigate }: HospitalSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const active = hospitalModuleFromPath(pathname);
  const dashboardTab = pathname === '/dashboard' ? searchParams.get('tab') : null;

  const handleLogout = () => {
    clearAdminSession();
    router.replace('/login');
    onNavigate?.();
  };

  return (
    <aside
      className={
        mobile
          ? 'relative z-50 flex h-full w-64 flex-col justify-between bg-[#004D56] text-white shadow-lg'
          : `${ui.sidebar} hidden lg:flex`
      }
      aria-label="Hospital navigation"
    >
      <div className="flex flex-1 flex-col overflow-hidden">
        <HospitalOperationsSidebarBrand />
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {HOSPITAL_NAV.map((item) => {
            const isActive =
              item.id === 'billing'
                ? dashboardTab === 'billing'
                : item.id === 'dashboard'
                  ? pathname === '/dashboard' && dashboardTab !== 'billing'
                  : active === item.id;
            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={onNavigate}
                className={`${ui.navItem} ${isActive ? ui.navItemActive : ''}`}
                style={isActive ? ui.navItemActiveBg : undefined}
              >
                <span className="text-lg" aria-hidden>
                  {item.emoji}
                </span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="border-t border-white/10 p-3">
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold text-white/80 transition-colors hover:bg-white/10 hover:text-white"
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          Logout
        </button>
      </div>
    </aside>
  );
}
