'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Calendar,
  Users,
  Stethoscope,
  FileText,
  Bell,
  User,
  LogOut
} from 'lucide-react';

const navItems = [
  { name: 'Dashboard', href: '/doctor/dashboard', icon: LayoutDashboard },
  { name: 'Schedule', href: '/doctor/schedule', icon: Calendar },
  { name: 'Patients', href: '/doctor/patients', icon: Users },
  { name: 'Consultations', href: '/doctor/consultation', icon: Stethoscope },
  { name: 'Prescriptions', href: '/doctor/prescriptions', icon: FileText },
  { name: 'Notifications', href: '/doctor/notifications', icon: Bell },
  { name: 'Profile', href: '/doctor/profile', icon: User },
];

function DoctorSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 h-full bg-[#004D56] text-white flex flex-col justify-between shrink-0 z-40 border-r border-[#007B8A]/30 select-none">
      <div>
        {/* BRAND HEADER */}
        <div className="p-5 border-b border-[#007B8A]/30">
          <h2 className="font-black text-lg text-white tracking-wide">Nexora Health</h2>
          <p className="text-xs text-[#80E0D0] font-medium">Clinical Workstation</p>
        </div>

        {/* NAVIGATION LINKS */}
        <nav className="p-3 space-y-1.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-[#007B8A] text-white shadow-xs'
                    : 'text-white/80 hover:bg-[#007B8A]/40 hover:text-white'
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-[#80E0D0]' : 'text-white/70'}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* FOOTER USER PROFILE & LOGOUT */}
      <div className="p-4 border-t border-[#007B8A]/30 bg-[#003B42]">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-white">Dr. Aishwarya D S</p>
            <p className="text-[10px] text-[#80E0D0]">KMC-88410</p>
          </div>
          <button className="p-1.5 hover:bg-[#007B8A]/40 rounded-lg text-white/80 hover:text-white transition-colors cursor-pointer">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}

export default function DoctorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F0F8F9]">
      {/* FIXED SIDEBAR PINNED TO LEFT */}
      <DoctorSidebar />

      {/* INDEPENDENT SCROLLABLE MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto min-w-0 p-6 space-y-6">
        {children}
      </main>
    </div>
  );
}