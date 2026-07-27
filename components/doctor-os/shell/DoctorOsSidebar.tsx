'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';

import { useDoctorAuth } from '@/lib/doctor/auth/DoctorAuthProvider';
import {
  CLINICAL_SIDEBAR_NAV,
  isClinicalNavActive,
  sageSidebar,
} from '@/lib/doctor-os/clinical-navigation';

export default function DoctorOsSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { session, signOut } = useDoctorAuth();

  return (
    <aside className={`${sageSidebar.aside} p-4`} aria-label="Nexora Doctor clinical navigation">
      {/* Brand header */}
      <div className={sageSidebar.brand}>
        <span className="text-[10px] font-bold uppercase tracking-widest text-[#C7C39E]">Nexora</span>
        <p className="text-sm font-bold">Doctor Workstation</p>
        {session && (
          <div className="mt-3 rounded-xl border border-[#C7C39E]/20 bg-white/5 p-3 backdrop-blur-sm">
            <p className="truncate text-sm font-semibold">{session.fullName}</p>
            <p className="truncate text-xs text-[#C7C39E]">{session.specialization}</p>
          </div>
        )}
      </div>

      {/* Scrollable 19-module menu */}
      <nav className={sageSidebar.navScroll}>
        {CLINICAL_SIDEBAR_NAV.map(({ label, href, icon: Icon }) => {
          const active = isClinicalNavActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              className={active ? sageSidebar.linkActive : sageSidebar.linkInactive}
              aria-current={active ? 'page' : undefined}
            >
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                  active ? 'bg-[#E6E3C5]/80' : ''
                }`}
              >
                <Icon className={`h-4 w-4 ${active ? sageSidebar.iconActive : sageSidebar.iconInactive}`} aria-hidden />
              </span>
              <span className="truncate leading-snug">{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer — sign out + version */}
      <div className={sageSidebar.footer}>
        <button
          type="button"
          onClick={() => {
            signOut();
            router.push('/doctor/auth/login');
          }}
          className={sageSidebar.signOut}
        >
          <LogOut className="h-4 w-4" aria-hidden />
          Sign out
        </button>
        <p className={sageSidebar.version}>Nexora Doctor · v2.0</p>
      </div>
    </aside>
  );
}
