'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Calendar,
  FileText,
  LayoutDashboard,
  LogOut,
  User,
  Users,
} from 'lucide-react';

import { RegalHospitalLogo } from '@/components/common/RegalHospitalLogo';
import { logoutPatientSession } from '@/lib/auth/patientAuth';
import { REGAL_HOSPITAL_CODE } from '@/lib/regal/constants';
import { patientClasses } from '@/lib/patient/theme';

const PATIENT_NAV = [
  { label: 'Dashboard', href: '/patient/dashboard', icon: LayoutDashboard },
  { label: 'Appointments', href: '/patient/appointments', icon: Calendar },
  { label: 'Doctors', href: '/patient/doctors', icon: Users },
  { label: 'Prescriptions', href: '/patient/prescriptions', icon: FileText },
  { label: 'Profile', href: '/patient/profile', icon: User },
] as const;

function isNavActive(pathname: string | null, href: string) {
  if (!pathname) return false;
  if (href === '/patient/dashboard') {
    return pathname === href || pathname === `${href}/`;
  }
  if (href === '/patient/appointments') {
    return pathname === href || pathname.startsWith(`${href}/`);
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

type PatientSidebarProps = {
  patientName?: string;
  onLogout?: () => void;
};

/** Warm toffee / cafe mocha sidebar with crisp white active states. */
export function PatientSidebar({ patientName = 'Patient', onLogout }: PatientSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
      return;
    }
    logoutPatientSession();
    router.replace('/patient/login');
  };

  const avatarInitial = patientName.trim().charAt(0).toUpperCase() || 'P';

  return (
    <aside
      className={`hidden h-full w-64 shrink-0 flex-col justify-between overflow-y-auto p-4 shadow-sm md:flex ${patientClasses.navShell}`}
      aria-label="Patient portal navigation"
    >
      <div className="shrink-0 border-b border-amber-900/20 px-1 pb-4 pt-1">
        <div className="rounded-xl bg-white/95 p-2.5 shadow-sm flex items-center justify-center">
          <RegalHospitalLogo heightClass="h-7" widthClass="w-auto" framed={false} priority />
        </div>
        <div className="mt-2 text-center text-[10px] font-semibold uppercase tracking-wider text-amber-200/80">
          Patient Care Portal • {REGAL_HOSPITAL_CODE}
        </div>
      </div>

      <nav className="custom-scrollbar min-h-0 flex-1 overflow-y-auto py-3">
        <ul className="space-y-0.5">
          {PATIENT_NAV.map(({ label, href, icon: Icon }) => {
            const active = isNavActive(pathname, href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={`group flex min-w-0 items-center rounded-lg px-3 py-2 text-xs font-medium transition-all ${
                    active ? patientClasses.navActive : patientClasses.navIdle
                  }`}
                  aria-current={active ? 'page' : undefined}
                >
                  <Icon
                    className={`mr-2.5 h-4 w-4 shrink-0 ${
                      active ? 'text-white' : 'text-[#EADBCE] group-hover:text-white'
                    }`}
                    aria-hidden
                  />
                  <span className="min-w-0 flex-1 leading-snug">{label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="shrink-0 border-t border-[#5B3E2B] pt-3">
        <div className="flex items-center gap-2.5 rounded-xl border border-[#8C6246]/60 bg-[#5E422E] px-2.5 py-2">
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#4E3625] text-xs font-bold text-white ring-1 ring-[#8C6246]"
            aria-hidden
          >
            {avatarInitial}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-white">{patientName}</p>
            <p className="truncate text-[10px] text-[#DDC7B4]">Verified member</p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#EADBCE] transition hover:bg-[#4E3625] hover:text-white"
            aria-label="Logout session"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}

export default PatientSidebar;
