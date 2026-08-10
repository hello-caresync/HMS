'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

import { DoctorSidebar } from '@/components/doctor/DoctorSidebar';
import { DoctorTopNav } from '@/components/doctor/DoctorTopNav';
import {
  clearDoctorSession,
  DOCTOR_SESSION_CHANGED_EVENT,
  getActiveDoctorSession,
  type DoctorSession,
} from '@/lib/doctor/session';

export function DoctorShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isLogin = pathname === '/doctor/login' || pathname === '/doctor/auth/login';
  const [session, setSession] = useState<DoctorSession | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const active = getActiveDoctorSession();
      setSession(active);
      setHydrated(true);

      if (!isLogin && !active) {
        router.replace('/doctor/login');
      } else if (isLogin && active) {
        router.replace('/doctor/dashboard');
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [isLogin, router]);

  useEffect(() => {
    const handleSessionChange = (event: Event) => {
      const customEvent = event as CustomEvent<DoctorSession | null>;
      setSession(customEvent.detail);
    };
    window.addEventListener(DOCTOR_SESSION_CHANGED_EVENT, handleSessionChange);
    return () => window.removeEventListener(DOCTOR_SESSION_CHANGED_EVENT, handleSessionChange);
  }, []);

  if (isLogin) return <>{children}</>;

  if (!hydrated || !session) {
    return (
      <div className="doctor-canvas flex min-h-screen items-center justify-center">
        <div className="doctor-glass flex items-center gap-3 rounded-3xl px-6 py-4 text-sm font-bold text-[#894A66]">
          <Loader2 className="h-5 w-5 animate-spin" />
          Securing doctor workspace…
        </div>
      </div>
    );
  }

  const handleLogout = () => {
    clearDoctorSession();
    setSession(null);
    router.replace('/doctor/login');
  };

  return (
    <div className="doctor-canvas min-h-screen text-[#2C243B]">
      <DoctorSidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onToggle={() => setCollapsed((value) => !value)}
        onCloseMobile={() => setMobileOpen(false)}
      />
      <div className={`min-h-screen transition-[margin] duration-300 ${collapsed ? 'lg:ml-20' : 'lg:ml-72'}`}>
        <DoctorTopNav
          session={session}
          onOpenMenu={() => setMobileOpen(true)}
          onLogout={handleLogout}
        />
        <main className="mx-auto w-full max-w-[100rem] p-4 md:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
