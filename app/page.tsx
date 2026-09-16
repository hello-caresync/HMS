'use client';

import React from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Building2,
  Stethoscope,
  UserCheck,
  Truck,
  ArrowRight,
  Activity,
} from 'lucide-react';

interface PortalCard {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  badge: string;
  href: string;
  badgeColor: string;
  accentBorder: string;
  iconBg: string;
  iconColor: string;
  icon: React.ElementType;
}

const PORTAL_ROLES: PortalCard[] = [
  {
    id: 'super-admin',
    title: 'Super Admin',
    subtitle: 'Platform & Global Network Control',
    description:
      'Master platform orchestration, hospital node provisioning, multi-tenant isolation, and global security.',
    badge: 'LEVEL 0 ROOT',
    href: '/super-admin/login',
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200/60',
    accentBorder: 'hover:border-amber-400/80 hover:shadow-amber-500/10',
    iconBg: 'bg-amber-100/70',
    iconColor: 'text-amber-600',
    icon: ShieldCheck,
  },
  {
    id: 'hospital-portal',
    title: 'Hospital Portal',
    subtitle: 'Admin, Nursing, Desk & Pharmacy',
    description:
      'Unified Regal Hospital workspace for administrators and operational staff — triage, tokens, billing, and pharmacy.',
    badge: 'HOSPITAL OS',
    href: '/hospital/login',
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200/60',
    accentBorder: 'hover:border-blue-400/80 hover:shadow-blue-500/10',
    iconBg: 'bg-blue-100/70',
    iconColor: 'text-blue-600',
    icon: Building2,
  },
  {
    id: 'doctor-portal',
    title: 'Doctor Portal',
    subtitle: 'OPD Queue, Clinical Rx & Consults',
    description:
      'Review patient queues, access health records, conduct consultations, and issue digital prescriptions.',
    badge: 'CLINICIANS',
    href: '/doctor/login',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
    accentBorder: 'hover:border-emerald-400/80 hover:shadow-emerald-500/10',
    iconBg: 'bg-emerald-100/70',
    iconColor: 'text-emerald-600',
    icon: Stethoscope,
  },
  {
    id: 'patient-care',
    title: 'Patient Care',
    subtitle: 'Live Tokens, Booking & Records',
    description:
      'Book appointments, track queue position in real time, and download consultation records.',
    badge: 'PUBLIC & PATIENTS',
    href: '/patient/login',
    badgeColor: 'bg-teal-50 text-teal-700 border-teal-200/60',
    accentBorder: 'hover:border-teal-400/80 hover:shadow-teal-500/10',
    iconBg: 'bg-teal-100/70',
    iconColor: 'text-teal-600',
    icon: UserCheck,
  },
  {
    id: 'vendor-suppliers',
    title: 'Vendor & Suppliers',
    subtitle: 'Procurement Orders & Supply Dispatch',
    description:
      'Access purchase requisitions, supply orders, batch shipments, and invoice fulfillment status.',
    badge: 'PARTNERS',
    href: '/vendor/login',
    badgeColor: 'bg-orange-50 text-orange-700 border-orange-200/60',
    accentBorder: 'hover:border-orange-400/80 hover:shadow-orange-500/10',
    iconBg: 'bg-orange-100/70',
    iconColor: 'text-orange-600',
    icon: Truck,
  },
];

export default function WorkspacePortalSelector() {
  return (
    <main className="relative flex min-h-screen w-full flex-col justify-between overflow-hidden bg-slate-950 p-6 font-sans selection:bg-emerald-500 selection:text-white sm:p-10">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute top-[-20%] left-[-10%] h-[600px] w-[600px] rounded-full bg-emerald-500/15 blur-[120px]" />
        <div className="absolute top-[20%] right-[-10%] h-[650px] w-[650px] rounded-full bg-cyan-500/15 blur-[130px]" />
        <div className="absolute bottom-[-15%] left-[25%] h-[500px] w-[500px] rounded-full bg-blue-600/15 blur-[140px]" />
        <div className="absolute inset-0 bg-[#0B132B]/40" />
        <div
          className="absolute inset-0 opacity-[0.03] [background-image:linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] [background-size:4rem_4rem]"
        />
      </div>

      <div className="mx-auto max-w-4xl pt-4 text-center sm:pt-6">
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-slate-900/80 px-3.5 py-1.5 shadow-sm backdrop-blur-md">
          <Activity className="h-3.5 w-3.5 animate-pulse text-emerald-400" />
          <span className="text-xs font-medium tracking-wide text-slate-300">
            Regal Healthcare • Unified Clinical Platform
          </span>
        </div>

        <h1 className="mb-3 text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
          Select Your Workspace Portal
        </h1>
        <p className="mx-auto max-w-xl text-sm leading-relaxed text-slate-400 sm:text-base">
          Sign in to your designated clinical role or access patient care services.
        </p>
      </div>

      <div className="mx-auto w-full max-w-7xl py-8">
        <div className="flex flex-wrap justify-center gap-6">
          {PORTAL_ROLES.map((card, index) => {
            const Icon = card.icon;
            const isBottomRow = index >= 3;
            const widthClass = isBottomRow
              ? 'w-full sm:w-[calc(50%-12px)] lg:w-[calc(40%-12px)]'
              : 'w-full sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)]';

            return (
              <Link
                key={card.id}
                href={card.href}
                className={`group relative flex flex-col justify-between rounded-3xl border border-slate-800/80 bg-slate-900/60 p-6 shadow-xl backdrop-blur-xl transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl sm:p-7 ${widthClass} ${card.accentBorder}`}
              >
                <div>
                  <div className="mb-5 flex items-center justify-between">
                    <div
                      className={`rounded-2xl p-3 ring-1 ring-white/10 transition-transform duration-300 group-hover:scale-105 ${card.iconBg} ${card.iconColor}`}
                    >
                      <Icon className="h-6 w-6" />
                    </div>
                    <span
                      className={`rounded-full border px-2.5 py-1 text-[10px] font-bold tracking-wider ${card.badgeColor}`}
                    >
                      {card.badge}
                    </span>
                  </div>

                  <h2 className="text-xl font-bold text-white transition-colors group-hover:text-emerald-400">
                    {card.title}
                  </h2>
                  <p className="mt-0.5 mb-3 text-xs font-medium text-slate-400">{card.subtitle}</p>
                  <p className="text-xs leading-relaxed text-slate-400">{card.description}</p>
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-slate-800/60 pt-4 text-xs font-semibold text-slate-300 transition-colors group-hover:text-white">
                  <span>Access Workspace</span>
                  <ArrowRight className="h-4 w-4 transform text-emerald-400 transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      <footer className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-3 border-t border-slate-800/50 pt-4 text-xs text-slate-500 sm:flex-row">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-400 ring-4 ring-emerald-400/20" />
          <span className="font-medium text-slate-400">
            Platform Node Status: Operational (HOSP-01)
          </span>
        </div>
        <div className="text-slate-400">
          Regal Hospital Network • Multi-Tenant Isolated Architecture • 2026
        </div>
      </footer>
    </main>
  );
}
