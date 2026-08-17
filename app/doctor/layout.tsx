'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  Stethoscope,
  Clock,
  ClipboardList,
  MessageSquare,
  Calendar,
  User,
  LogOut,
  ShieldCheck,
  Loader2,
  LayoutDashboard,
  Activity,
  Users,
  Siren,
} from 'lucide-react';
import DoctorProviders from '@/components/doctor/DoctorProviders';
import { EcosystemNotificationBell } from '@/components/ecosystem/EcosystemNotificationBell';

type LayoutDoctorSession = {
  doctor_name?: string;
  fullName?: string;
  employeeId?: string;
  department?: string;
};

function isActivePath(pathname: string | null, href: string) {
  if (!pathname) return false;
  const normalized = pathname.replace(/\/$/, '') || '/';
  const target = href.replace(/\/$/, '') || '/';
  return normalized === target || normalized.startsWith(`${target}/`);
}

function DoctorShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [initializing, setInitializing] = useState(true);
  const [doctorSession, setDoctorSession] = useState<LayoutDoctorSession | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (pathname.includes('/login')) {
        setInitializing(false);
        return;
      }

      if (typeof window === 'undefined') {
        setInitializing(false);
        return;
      }

      try {
        const savedSession =
          window.localStorage.getItem('active_doctor_session') ||
          window.localStorage.getItem('curasync_active_doctor');
        if (!savedSession) {
          router.replace('/doctor/login/');
          return;
        }
        setDoctorSession(JSON.parse(savedSession) as LayoutDoctorSession);
      } catch {
        router.replace('/doctor/login/');
        return;
      }
      setInitializing(false);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [pathname, router]);

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('active_doctor_session');
      window.localStorage.removeItem('curasync_active_doctor');
    }
    router.push('/doctor/login/');
  };

  if (pathname.includes('/login')) {
    return <>{children}</>;
  }

  if (initializing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F6F9FB]">
        <div className="flex items-center gap-3 rounded-2xl bg-[#173F5F] px-6 py-4 text-white shadow-2xl">
          <Loader2 className="h-5 w-5 animate-spin text-[#2A9D8F]" />
          <span className="text-xs font-black">Initializing Command Center…</span>
        </div>
      </div>
    );
  }

  const nav = [
    { href: '/doctor/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/doctor/queue', label: 'SmartQ OPD', icon: Clock },
    { href: '/doctor/patients', label: 'Patients', icon: Users },
    { href: '/doctor/records', label: 'Records', icon: ClipboardList },
    { href: '/doctor/messages', label: 'Messages', icon: MessageSquare },
    { href: '/doctor/emergency', label: 'Emergency SOS', icon: Siren },
    { href: '/doctor/schedule', label: 'Schedule', icon: Calendar },
    { href: '/doctor/profile', label: 'Profile', icon: User },
  ] as const;

  return (
    <div className="flex min-h-screen bg-[#F6F9FB] font-sans text-[#173F5F]">
      <aside className="sticky top-0 z-30 flex h-screen w-64 shrink-0 flex-col justify-between overflow-y-auto border-r border-[#E8F1F8] bg-[#173F5F] p-6 text-white shadow-xl">
        <div className="space-y-8">
          <div className="flex items-center gap-3 border-b border-[#20639B]/40 pb-5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#20639B] font-black shadow-lg">
              <Stethoscope className="h-6 w-6 text-[#2A9D8F]" />
            </div>
            <div>
              <h2 className="text-base font-black leading-tight tracking-wide">Regal Hospital</h2>
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#2A9D8F]">
                Doctor Command Center
              </p>
            </div>
          </div>

          <div className="space-y-1 rounded-2xl border border-[#20639B]/40 bg-[#20639B]/20 p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-black uppercase tracking-wider text-[#2A9D8F]">
                Active Clinician
              </span>
              <Activity className="h-3.5 w-3.5 animate-pulse text-emerald-400" />
            </div>
            <p className="truncate text-xs font-black">{doctorSession?.doctor_name || 'Clinician'}</p>
            <p className="text-[10px] font-bold text-[#E8F1F8]/80">
              {doctorSession?.employeeId || 'RH-D01'} • {doctorSession?.department || 'OPD'}
            </p>
          </div>

          <nav className="space-y-1 text-xs font-extrabold">
            {nav.map(({ href, label, icon: Icon }) => (
              <button
                key={href}
                type="button"
                onClick={() => router.push(`${href}/`)}
                className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 transition ${
                  isActivePath(pathname, href)
                    ? 'border border-[#2A9D8F]/40 bg-[#20639B] text-white shadow-lg'
                    : 'text-[#E8F1F8]/70 hover:bg-[#20639B]/30 hover:text-white'
                }`}
              >
                <Icon className="h-4 w-4 text-[#2A9D8F]" /> {label}
              </button>
            ))}
          </nav>
        </div>

        <div className="border-t border-[#20639B]/40 pt-6">
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-900/40 bg-[#20639B]/20 px-4 py-3 text-xs font-black text-rose-200 transition hover:bg-rose-950/40"
          >
            <LogOut className="h-4 w-4" /> End Session
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-y-auto">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-[#E8F1F8] bg-white/95 px-6 py-4 shadow-sm backdrop-blur-md md:px-8">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-[#2A9D8F]" />
            <span className="text-xs font-black text-[#173F5F]">
              HIPAA Compliant Session • Clinical Command Center
            </span>
          </div>
          <div className="flex items-center gap-3">
            <EcosystemNotificationBell
              app="doctor"
              recipientId={doctorSession?.employeeId}
              className="bg-[#E8F1F8] text-[#173F5F] hover:bg-[#20639B]/10"
            />
            <span className="rounded-full bg-[#173F5F] px-3.5 py-1 text-[10px] font-black uppercase text-white shadow-sm">
              {doctorSession?.employeeId || 'RH-D01'}
            </span>
          </div>
        </header>

        <main className="flex-1 p-6 md:p-8">{children}</main>
      </div>
    </div>
  );
}

export default function DoctorLayout({ children }: { children: React.ReactNode }) {
  return (
    <DoctorProviders>
      <DoctorShell>{children}</DoctorShell>
    </DoctorProviders>
  );
}
