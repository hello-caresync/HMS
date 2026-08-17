'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Calendar,
  FileText,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  ShieldCheck,
  Stethoscope,
  User,
  Users,
} from 'lucide-react';

const PATIENT_NAV = [
  { label: 'Dashboard', href: '/patient/dashboard', icon: LayoutDashboard },
  { label: 'My Appointments', href: '/patient/appointments', icon: Calendar },
  { label: 'Doctor Directory', href: '/patient/doctors', icon: Users },
  { label: 'Prescriptions', href: '/patient/prescriptions', icon: FileText },
  { label: 'Medical Records', href: '/patient/records', icon: ShieldCheck },
  { label: 'Clinical Messaging', href: '/patient/messages', icon: MessageSquare },
  { label: 'Profile & Vitals', href: '/patient/profile', icon: User },
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

/** Patient left navigation — deep forest emerald clinical theme. */
export function PatientSidebar({ patientName = 'Patient', onLogout }: PatientSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
      return;
    }
    localStorage.removeItem('curasync_patient_session');
    router.push('/patient/auth/login');
  };

  const avatarInitial = patientName.trim().charAt(0).toUpperCase() || 'P';

  return (
    <aside
      className="fixed top-0 left-0 z-50 hidden h-screen w-64 flex-col overflow-hidden border-r border-[#153A32] bg-[#081C17] shadow-xl md:flex"
      aria-label="Patient portal navigation"
    >
      <div className="shrink-0 border-b border-[#153A32] px-5 pb-5 pt-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#227B6B]/40 bg-[#113831] text-[#38D9BA] shadow-sm">
            <Stethoscope className="h-5 w-5" aria-hidden />
          </div>
          <div>
            <h2 className="text-base font-black tracking-tight text-white">Regal Hospital</h2>
            <p className="text-[10px] font-bold uppercase tracking-wider text-teal-400">Patient Portal</p>
          </div>
        </div>
      </div>

      <nav className="custom-scrollbar min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-3 py-4">
        <ul className="space-y-1">
          {PATIENT_NAV.map(({ label, href, icon: Icon }) => {
            const active = isNavActive(pathname, href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={`group flex min-w-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200 ${
                    active
                      ? 'border border-[#227B6B]/50 bg-[#113831] font-black text-white shadow-md shadow-black/20'
                      : 'text-slate-300 hover:bg-[#0E2822] hover:text-white'
                  }`}
                  aria-current={active ? 'page' : undefined}
                >
                  <Icon
                    className={`h-4 w-4 shrink-0 ${active ? 'text-[#38D9BA]' : 'text-slate-400 group-hover:text-slate-200'}`}
                    aria-hidden
                  />
                  <span className="min-w-0 flex-1 leading-snug">{label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="shrink-0 border-t border-[#153A32] p-4">
        <div className="flex items-center gap-3 rounded-2xl border border-[#1B4B40] bg-[#0F2C24] px-3 py-2.5">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#227B6B]/40 bg-[#113831] text-sm font-black text-[#38D9BA]"
            aria-hidden
          >
            {avatarInitial}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-black text-white">{patientName}</p>
            <p className="truncate text-[10px] font-semibold text-slate-400">Verified session</p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-teal-400 transition hover:bg-[#113831] hover:text-[#38D9BA]"
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
