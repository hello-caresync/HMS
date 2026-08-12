'use client';

import React, { useEffect, useState, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Toaster } from 'sonner';
import {
  Bell,
  Calendar,
  FileText,
  LayoutDashboard,
  Loader2,
  LogOut,
  MessageSquare,
  ShieldCheck,
  Stethoscope,
  User,
  Users,
} from 'lucide-react';
import { PatientClinicalRealtimeBridge } from '@/components/patient/PatientClinicalRealtimeBridge';
import { ensurePatientIdPersisted } from '@/lib/clinical/bridge';

const NAV = [
  { label: 'Dashboard', href: '/patient/dashboard', icon: LayoutDashboard },
  { label: 'My Appointments', href: '/patient/appointments', icon: Calendar },
  { label: 'Doctor Directory', href: '/patient/doctors', icon: Users },
  { label: 'Prescriptions', href: '/patient/prescriptions', icon: FileText },
  { label: 'Clinical Messaging', href: '/patient/messages', icon: MessageSquare },
  { label: 'Profile & Vitals', href: '/patient/profile', icon: User },
] as const;

function isAuthRoute(pathname: string | null) {
  return Boolean(pathname?.includes('/auth/login') || pathname?.endsWith('/login'));
}

function isNavActive(pathname: string | null, href: string) {
  if (!pathname) return false;
  if (href === '/patient/appointments') {
    return pathname === href || pathname.startsWith('/patient/appointments/');
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function PatientLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [hydrated, setHydrated] = useState(false);
  const [patientName, setPatientName] = useState('Patient');

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (isAuthRoute(pathname)) {
        setHydrated(true);
        return;
      }

      const session =
        localStorage.getItem('curasync_patient_session') ||
        localStorage.getItem('patient_full_name');
      const savedName = localStorage.getItem('patient_full_name');
      if (savedName) setPatientName(savedName);
      ensurePatientIdPersisted();

      if (!session && !savedName) {
        router.replace('/patient/auth/login');
        return;
      }

      setHydrated(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [pathname, router]);

  const handleLogout = () => {
    localStorage.removeItem('curasync_patient_session');
    router.push('/patient/auth/login');
  };

  if (isAuthRoute(pathname)) {
    return (
      <>
        {children}
        <Toaster position="top-right" closeButton />
      </>
    );
  }

  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F4F8F7]">
        <div className="flex items-center gap-3 rounded-2xl bg-[#113831] px-6 py-4 text-white shadow-xl">
          <Loader2 className="h-5 w-5 animate-spin text-[#EAF5F2]" />
          <span className="text-xs font-black">Connecting to Patient Workspace…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#F4F8F7] font-sans text-[#0E2924]">
      <aside className="sticky top-0 z-30 flex h-screen w-64 shrink-0 flex-col justify-between overflow-y-auto border-r border-[#D5E8E3] bg-white p-6 shadow-sm">
        <div className="space-y-8">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#113831] text-white shadow-md">
              <Stethoscope className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-base font-black text-[#0E2924]">Regal Hospital</h2>
              <p className="text-[10px] font-bold text-[#227B6B]">Patient Portal</p>
            </div>
          </div>

          <nav className="space-y-1.5 text-xs font-extrabold">
            {NAV.map(({ label, href, icon: Icon }) => {
              const active = isNavActive(pathname, href);
              return (
                <button
                  key={href}
                  type="button"
                  onClick={() => router.push(href)}
                  className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 transition ${
                    active
                      ? 'bg-[#EAF5F2] font-black text-[#113831] shadow-sm'
                      : 'text-[#4B736B] hover:bg-[#F4F8F7] hover:text-[#113831]'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${active ? 'text-[#227B6B]' : ''}`} />
                  {label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="border-t border-[#D5E8E3] pt-6">
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#EAF5F2] px-4 py-3 text-xs font-black text-[#113831] transition hover:bg-[#D5E8E3]"
          >
            <LogOut className="h-4 w-4" /> Logout Session
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-y-auto">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-[#D5E8E3] bg-white/95 px-6 py-4 shadow-sm backdrop-blur-md md:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <ShieldCheck className="h-5 w-5 shrink-0 text-[#227B6B]" />
            <span className="truncate text-xs font-black text-[#0E2924]">
              Verified Patient Session • {patientName}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.push('/patient/notifications')}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EAF5F2] text-[#113831]"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
            </button>
            <span className="rounded-full bg-[#113831] px-3.5 py-1 text-[10px] font-black uppercase text-white shadow-sm">
              Live Sync
            </span>
          </div>
        </header>

        <main className="flex-1 p-6 md:p-8">{children}</main>
      </div>

      <PatientClinicalRealtimeBridge />
      <Toaster position="top-right" closeButton richColors />
    </div>
  );
}
