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
  Bell,
  ShieldCheck,
  Loader2,
  LayoutDashboard,
  Activity,
} from 'lucide-react';

type LayoutDoctorSession = {
  doctor_name?: string;
  fullName?: string;
  employeeId?: string;
  department?: string;
};

export default function DoctorLayout({ children }: { children: React.ReactNode }) {
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

      const savedSession = localStorage.getItem('active_doctor_session');
      if (!savedSession) {
        router.replace('/doctor/login');
        return;
      }

      try {
        setDoctorSession(JSON.parse(savedSession) as LayoutDoctorSession);
      } catch {
        console.warn('Session parse notice');
      }
      setInitializing(false);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [pathname, router]);

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('active_doctor_session');
    }
    router.push('/doctor/login');
  };

  if (pathname.includes('/login')) {
    return <>{children}</>;
  }

  if (initializing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F4F6F9]">
        <div className="flex items-center gap-3 rounded-2xl bg-[#2C1929] px-6 py-4 text-white shadow-2xl">
          <Loader2 className="h-5 w-5 animate-spin text-[#D8A657]" />
          <span className="text-xs font-black">Initializing Workspace...</span>
        </div>
      </div>
    );
  }

  // DoctorWorkspace owns its deep-plum chrome — avoid a nested sidebar shell.
  if (pathname === '/doctor/dashboard') {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-[#F4F6F9] text-[#2C243B] font-sans flex">
      
      {/* STATIC FIXED SIDEBAR */}
      <aside className="sticky top-0 h-screen w-64 bg-[#2C1929] text-white p-6 flex flex-col justify-between shrink-0 shadow-2xl z-30 border-r border-[#482A41] overflow-y-auto">
        <div className="space-y-8">
          
          {/* BRAND HEADER */}
          <div className="flex items-center gap-3 border-b border-[#482A41] pb-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#894A66] to-[#572E54] text-[#D8A657] font-black shadow-lg shrink-0">
              <Stethoscope className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-base font-black tracking-wide text-white leading-tight">Regal Hospital</h2>
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#D8A657]">Doctor Portal</p>
            </div>
          </div>

          {/* CLINICIAN PROFILE BADGE */}
          <div className="rounded-2xl bg-[#3D2339] p-3.5 border border-[#572E54] space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-black uppercase tracking-wider text-[#D8A657]">Active Clinician</span>
              <Activity className="h-3.5 w-3.5 text-emerald-400 animate-pulse" />
            </div>
            <p className="text-xs font-black text-white truncate">{doctorSession?.doctor_name || 'Dr SURIRAJU V'}</p>
            <p className="text-[10px] font-bold text-[#A9C5E3]">{doctorSession?.employeeId || 'RH-D01'} • {doctorSession?.department || 'Urology'}</p>
          </div>

          {/* NAVIGATION MENU */}
          <nav className="space-y-1.5 text-xs font-extrabold">
            <button
              onClick={() => router.push('/doctor/dashboard')}
              className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 transition ${
                pathname === '/doctor/dashboard'
                  ? 'bg-gradient-to-r from-[#894A66] to-[#572E54] text-white shadow-lg border border-[#894A66]'
                  : 'text-[#9DA6CD] hover:bg-[#3D2339] hover:text-white'
              }`}
            >
              <LayoutDashboard className="h-4 w-4 text-[#D8A657]" /> Dashboard
            </button>

            <button
              onClick={() => router.push('/doctor/queue')}
              className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 transition ${
                pathname === '/doctor/queue'
                  ? 'bg-gradient-to-r from-[#894A66] to-[#572E54] text-white shadow-lg border border-[#894A66]'
                  : 'text-[#9DA6CD] hover:bg-[#3D2339] hover:text-white'
              }`}
            >
              <Clock className="h-4 w-4 text-[#D8A657]" /> Live OPD Queue
            </button>

            <button
              onClick={() => router.push('/doctor/records')}
              className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 transition ${
                pathname === '/doctor/records'
                  ? 'bg-gradient-to-r from-[#894A66] to-[#572E54] text-white shadow-lg border border-[#894A66]'
                  : 'text-[#9DA6CD] hover:bg-[#3D2339] hover:text-white'
              }`}
            >
              <ClipboardList className="h-4 w-4 text-[#D8A657]" /> Patient Records
            </button>

            <button
              onClick={() => router.push('/doctor/messages')}
              className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 transition ${
                pathname === '/doctor/messages'
                  ? 'bg-gradient-to-r from-[#894A66] to-[#572E54] text-white shadow-lg border border-[#894A66]'
                  : 'text-[#9DA6CD] hover:bg-[#3D2339] hover:text-white'
              }`}
            >
              <MessageSquare className="h-4 w-4 text-[#D8A657]" /> Messages
            </button>

            <button
              onClick={() => router.push('/doctor/schedule')}
              className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 transition ${
                pathname === '/doctor/schedule'
                  ? 'bg-gradient-to-r from-[#894A66] to-[#572E54] text-white shadow-lg border border-[#894A66]'
                  : 'text-[#9DA6CD] hover:bg-[#3D2339] hover:text-white'
              }`}
            >
              <Calendar className="h-4 w-4 text-[#D8A657]" /> Schedule & Slots
            </button>

            <button
              onClick={() => router.push('/doctor/profile')}
              className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 transition ${
                pathname === '/doctor/profile'
                  ? 'bg-gradient-to-r from-[#894A66] to-[#572E54] text-white shadow-lg border border-[#894A66]'
                  : 'text-[#9DA6CD] hover:bg-[#3D2339] hover:text-white'
              }`}
            >
              <User className="h-4 w-4 text-[#D8A657]" /> Doctor Profile
            </button>
          </nav>

        </div>

        {/* LOGOUT */}
        <div className="pt-6 border-t border-[#482A41]">
          <button
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#3D2339] px-4 py-3 text-xs font-black text-rose-300 hover:bg-rose-900/40 hover:text-rose-200 transition border border-rose-900/30"
          >
            <LogOut className="h-4 w-4" /> End Session
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT CANVAS */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-slate-200 p-4 px-8 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-[#894A66]" />
            <span className="text-xs font-black text-[#2C243B]">
              HIPAA Compliant Session • OPD Consultation Desk
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F4F6F9] text-[#894A66] hover:bg-slate-200 transition">
              <Bell className="h-4 w-4" />
            </button>
            <span className="rounded-full bg-[#894A66] px-3.5 py-1 text-[10px] font-black uppercase text-white shadow-sm">
              {doctorSession?.employeeId || 'RH-D01'}
            </span>
          </div>
        </header>

        <main className="flex-1 p-6 md:p-8">
          {children}
        </main>
      </div>

    </div>
  );
}