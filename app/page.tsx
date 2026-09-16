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
  accentHover: string;
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
      'Master platform orchestration, hospital node provisioning, and multi-tenant security.',
    badge: 'LEVEL 0 ROOT',
    href: '/super-admin/login',
    badgeColor: 'bg-amber-100/70 text-amber-800 border-amber-300/60',
    accentHover: 'hover:border-amber-400 hover:shadow-amber-500/10',
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-700',
    icon: ShieldCheck,
  },
  {
    id: 'hospital-portal',
    title: 'Hospital Portal',
    subtitle: 'Admin, Nursing, Desk & Pharmacy',
    description:
      'Unified operational workstation for patient intake, triage queues, billing, and pharmacy.',
    badge: 'HOSPITAL OS',
    href: '/hospital/login',
    badgeColor: 'bg-blue-100/70 text-blue-800 border-blue-300/60',
    accentHover: 'hover:border-blue-400 hover:shadow-blue-500/10',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-700',
    icon: Building2,
  },
  {
    id: 'doctor-portal',
    title: 'Doctor Portal',
    subtitle: 'OPD Queue, Clinical Rx & Consults',
    description:
      'Manage active queues, review 360 longitudinal history, and generate digital prescriptions.',
    badge: 'CLINICIANS',
    href: '/doctor/login',
    badgeColor: 'bg-emerald-100/70 text-emerald-800 border-emerald-300/60',
    accentHover: 'hover:border-emerald-400 hover:shadow-emerald-500/10',
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-700',
    icon: Stethoscope,
  },
  {
    id: 'patient-care',
    title: 'Patient Care',
    subtitle: 'Live Tokens, Booking & Records',
    description:
      'Self-service registration, real-time token tracking, and medical record access.',
    badge: 'PUBLIC & PATIENTS',
    href: '/patient/login',
    badgeColor: 'bg-teal-100/70 text-teal-800 border-teal-300/60',
    accentHover: 'hover:border-teal-400 hover:shadow-teal-500/10',
    iconBg: 'bg-teal-100',
    iconColor: 'text-teal-700',
    icon: UserCheck,
  },
  {
    id: 'vendor-suppliers',
    title: 'Vendor & Suppliers',
    subtitle: 'Procurement Orders & Supply Dispatch',
    description:
      'Access hospital requisitions, batch shipment orders, and invoice clearance logs.',
    badge: 'PARTNERS',
    href: '/vendor/login',
    badgeColor: 'bg-[#dcc2f9]/70 text-[#3b1466] border-[#ceaef2]/60',
    accentHover: 'hover:border-[#a36fdb] hover:shadow-[#6a38a0]/10',
    iconBg: 'bg-[#dcc2f9]/80',
    iconColor: 'text-[#6a38a0]',
    icon: Truck,
  },
];

const CARD_CLASS =
  'group flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white/85 p-4 shadow-xs backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg';

function PortalCardLink({
  card,
  className = '',
}: {
  card: PortalCard;
  className?: string;
}) {
  const Icon = card.icon;

  return (
    <Link
      href={card.href}
      className={`${CARD_CLASS} ${card.accentHover} ${className}`}
    >
      <div>
        <div className="mb-2.5 flex items-center justify-between">
          <div
            className={`rounded-xl p-2.5 transition-transform group-hover:scale-105 ${card.iconBg} ${card.iconColor}`}
          >
            <Icon className="h-5 w-5" />
          </div>
          <span
            className={`rounded-full border px-2 py-0.5 text-[10px] font-bold tracking-wider ${card.badgeColor}`}
          >
            {card.badge}
          </span>
        </div>

        <h2 className="text-base font-bold text-slate-900 transition-colors group-hover:text-emerald-700">
          {card.title}
        </h2>
        <p className="mb-1 text-[11px] font-semibold text-slate-500">{card.subtitle}</p>
        <p className="line-clamp-2 text-[11px] leading-relaxed text-slate-600">{card.description}</p>
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 text-[11px] font-semibold text-slate-700 group-hover:text-emerald-700">
        <span>Access Workspace</span>
        <ArrowRight className="h-3.5 w-3.5 transform text-emerald-600 transition-transform group-hover:translate-x-1" />
      </div>
    </Link>
  );
}

export default function WorkspacePortalSelector() {
  return (
    <main className="relative flex h-screen max-h-screen w-full flex-col justify-between overflow-hidden overscroll-none bg-gradient-to-br from-slate-50 via-teal-50/30 to-emerald-50/40 p-4 font-sans select-none sm:p-6 lg:px-12">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-teal-200/40 blur-[100px]" />
        <div className="absolute top-1/4 -right-24 h-96 w-96 rounded-full bg-emerald-200/40 blur-[110px]" />
        <div className="absolute -bottom-32 left-1/3 h-80 w-80 rounded-full bg-blue-100/50 blur-[100px]" />
      </div>

      <header className="mx-auto max-w-3xl shrink-0 pt-1 text-center">
        <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-emerald-200/70 bg-white/80 px-3 py-1 shadow-xs backdrop-blur-md">
          <Activity className="h-3.5 w-3.5 animate-pulse text-emerald-600" />
          <span className="text-xs font-semibold tracking-wide text-slate-700">
            Regal Healthcare • Unified Clinical Platform
          </span>
        </div>

        <h1 className="mb-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
          Select Your Workspace Portal
        </h1>
        <p className="mx-auto max-w-lg text-xs text-slate-500 sm:text-sm">
          Sign in to your designated clinical role or access patient care services.
        </p>
      </header>

      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center gap-3 py-2">
        <div className="grid w-full grid-cols-1 gap-3.5 md:grid-cols-3">
          {PORTAL_ROLES.slice(0, 3).map((card) => (
            <PortalCardLink key={card.id} card={card} />
          ))}
        </div>

        <div className="flex w-full justify-center gap-3.5">
          {PORTAL_ROLES.slice(3, 5).map((card) => (
            <PortalCardLink
              key={card.id}
              card={card}
              className="w-full max-w-[360px] md:w-[calc(50%-7px)]"
            />
          ))}
        </div>
      </div>

      <footer className="mx-auto flex w-full max-w-6xl shrink-0 flex-col items-center justify-between gap-2 border-t border-slate-200/70 pt-2 pb-1 text-[11px] text-slate-500 sm:flex-row">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500 ring-4 ring-emerald-100" />
          <span className="font-semibold text-slate-600">Node Status: Operational (HOSP-01)</span>
        </div>
        <div className="font-medium text-slate-500">
          Regal Multispeciality Hospital Network • Multi-Tenant Architecture • 2026
        </div>
      </footer>
    </main>
  );
}
