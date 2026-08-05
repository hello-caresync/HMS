'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { ui } from '@/components/nexora-hospital/ui/primitives';
import { HOSPITAL_NAV, hospitalModuleFromPath } from '@/lib/nexora-hospital/navigation';

type HospitalSidebarProps = {
  mobile?: boolean;
  onNavigate?: () => void;
};

export function HospitalSidebar({ mobile, onNavigate }: HospitalSidebarProps) {
  const pathname = usePathname();
  const active = hospitalModuleFromPath(pathname);

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
        <div className={ui.sidebarBrand}>
          <p className={ui.sidebarBrandTitle}>🏥 Nexora Hospital</p>
          <p className={ui.sidebarBrandSub}>Operations Hub V0</p>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {HOSPITAL_NAV.map((item) => {
            const isActive = active === item.id;
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
    </aside>
  );
}
