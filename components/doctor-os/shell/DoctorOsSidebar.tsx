'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';

import { RegalHospitalLogo } from '@/components/common/RegalHospitalLogo';
import { useDoctorAuth } from '@/lib/doctor/auth/DoctorAuthProvider';
import { REGAL_HOSPITAL_CODE } from '@/lib/regal/constants';
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
    <aside className={sageSidebar.aside} aria-label="Regal Doctor clinical navigation">
      {/* Brand header */}
      <div className={sageSidebar.brand}>
        <div className="rounded-xl bg-white/95 p-2 shadow-sm flex items-center justify-center">
          <RegalHospitalLogo heightClass="h-7" widthClass="w-auto" framed={false} priority={false} variant="onDark" />
        </div>
        <p className="mt-2 text-center text-[10px] font-semibold uppercase tracking-wider text-[#C7C39E]">
          Doctor Workstation • {REGAL_HOSPITAL_CODE}
        </p>
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
        <p className={sageSidebar.version}>Regal Doctor · v2.0</p>
      </div>
    </aside>
  );
}
