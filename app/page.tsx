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
    accentHover: 'hover:border-amber-300/60 hover:shadow-amber-500/10',
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
    accentHover: 'hover:border-sky-300/60 hover:shadow-blue-500/10',
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
    accentHover: 'hover:border-emerald-300/60 hover:shadow-emerald-500/10',
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
    badgeColor: 'bg-[#ede0d4]/90 text-[#7f5539] border-[#e6ccb2]/80',
    accentHover: 'hover:border-[#d4b896]/80 hover:shadow-[#7f5539]/10',
    iconBg: 'bg-[#ede0d4]',
    iconColor: 'text-[#b08968]',
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
    accentHover: 'hover:border-[#ceaef2]/80 hover:shadow-[#6a38a0]/10',
    iconBg: 'bg-[#dcc2f9]/80',
    iconColor: 'text-[#6a38a0]',
    icon: Truck,
  },
];

const CARD_CLASS =
  'group flex flex-col justify-between rounded-2xl border border-white/60 bg-white/80 p-6 shadow-lg shadow-sky-900/5 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-sky-300/60';

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
        <div className="mb-3 flex items-center justify-between">
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

        <h2 className="text-base font-bold text-slate-900 transition-colors group-hover:text-sky-800">
          {card.title}
        </h2>
        <p className="mb-1 text-[11px] font-semibold text-slate-600">{card.subtitle}</p>
        <p className="line-clamp-2 text-[11px] leading-relaxed text-slate-700">{card.description}</p>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-white/70 pt-3 text-[11px] font-semibold text-slate-800 group-hover:text-sky-800">
        <span>Access Workspace</span>
        <ArrowRight className="h-3.5 w-3.5 transform text-sky-600 transition-transform group-hover:translate-x-1" />
      </div>
    </Link>
  );
}

const WATERCOLOR_MESH_FALLBACK =
  'radial-gradient(ellipse 80% 60% at 15% 20%, rgba(186, 230, 253, 0.85) 0%, transparent 55%), radial-gradient(ellipse 70% 55% at 85% 15%, rgba(147, 197, 253, 0.75) 0%, transparent 50%), radial-gradient(ellipse 65% 50% at 50% 85%, rgba(125, 211, 252, 0.7) 0%, transparent 55%), radial-gradient(ellipse 55% 45% at 70% 55%, rgba(224, 242, 254, 0.9) 0%, transparent 45%), linear-gradient(165deg, #e0f2fe 0%, #bae6fd 35%, #f0f9ff 70%, #dbeafe 100%)';

export default function WorkspacePortalSelector() {
  return (
    <main
      className="relative flex min-h-screen w-full flex-col justify-between overflow-x-hidden bg-cover bg-center bg-no-repeat font-sans select-none"
      style={{
        backgroundImage: `${WATERCOLOR_MESH_FALLBACK}, url('/images/bg-watercolor-blue.png')`,
      }}
    >
      {/* Subtle translucent overlay for contrast and soft light bleed */}
      <div className="pointer-events-none absolute inset-0 bg-white/40 backdrop-blur-[2px]" aria-hidden />

      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 flex-col justify-between px-4 py-8 sm:px-6 sm:py-12 lg:px-12">
        <header className="mx-auto max-w-3xl shrink-0 pt-1 text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/75 px-3 py-1 shadow-md shadow-sky-900/5 backdrop-blur-md">
            <Activity className="h-3.5 w-3.5 animate-pulse text-sky-600" />
            <span className="text-xs font-semibold tracking-wide text-slate-800">
              Regal Healthcare • Unified Clinical Platform
            </span>
          </div>

          <h1 className="mb-2 text-2xl font-extrabold tracking-tight text-stone-900 sm:text-4xl">
            Select Your Workspace Portal
          </h1>
          <p className="mx-auto max-w-lg text-xs text-slate-700 sm:text-sm">
            Sign in to your designated clinical role or access patient care services.
          </p>
        </header>

        <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center gap-4 py-4">
          <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-3">
            {PORTAL_ROLES.slice(0, 3).map((card) => (
              <PortalCardLink key={card.id} card={card} />
            ))}
          </div>

          <div className="flex w-full justify-center gap-4">
            {PORTAL_ROLES.slice(3, 5).map((card) => (
              <PortalCardLink
                key={card.id}
                card={card}
                className="w-full max-w-[360px] md:w-[calc(50%-8px)]"
              />
            ))}
          </div>
        </div>

        <footer className="mx-auto flex w-full max-w-6xl shrink-0 flex-col items-center justify-between gap-2 rounded-xl border border-white/50 bg-white/50 px-4 py-2.5 text-[11px] text-slate-600 shadow-sm shadow-sky-900/5 backdrop-blur-sm sm:flex-row">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 ring-4 ring-emerald-100/80" />
            <span className="font-semibold text-slate-800">Node Status: Operational (HOSP-01)</span>
          </div>
          <div className="font-medium text-slate-600">
            Regal Multispeciality Hospital Network • Multi-Tenant Architecture • 2026
          </div>
        </footer>
      </div>
    </main>
  );
}
