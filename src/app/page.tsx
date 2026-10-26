'use client';

export const dynamic = 'force-static';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  Building2,
  Package,
  ShieldCheck,
  Stethoscope,
  UserRound,
} from 'lucide-react';

import { MedicalDoodleBackdrop } from '@/components/auth/MedicalDoodleBackdrop';
import { shouldDisableSuperAdminLinkPrefetch } from '@/lib/auth/superAdminAuth';

interface PortalCard {
  id: string;
  title: string;
  description: string;
  badge: string;
  cta: string;
  href: string;
  accent: string;
  badgeClass: string;
  iconBg: string;
  iconColor: string;
  icon: React.ElementType;
}

const PORTALS: PortalCard[] = [
  {
    id: 'super-admin',
    title: 'Super Admin Vault',
    description:
      'Multi-tenant governance, healthcare facility onboarding, and cluster encryption keys.',
    badge: 'PLATFORM ROOT',
    cta: 'Access Vault',
    href: '/superadmin/login/',
    accent: 'bg-violet-500',
    badgeClass: 'bg-violet-50 text-violet-700 ring-violet-200/80',
    iconBg: 'bg-violet-500/10',
    iconColor: 'text-violet-600',
    icon: ShieldCheck,
  },
  {
    id: 'hospital-admin',
    title: 'Hospital Admin Portal',
    description:
      'Facility command center, smart triage desk, staff onboarding, and financial ledgers.',
    badge: 'TENANT COMMAND',
    cta: 'Enter Command Center',
    href: '/hospital/login/',
    accent: 'bg-amber-500',
    badgeClass: 'bg-amber-50 text-amber-800 ring-amber-200/80',
    iconBg: 'bg-amber-500/10',
    iconColor: 'text-amber-700',
    icon: Building2,
  },
  {
    id: 'doctor',
    title: 'Doctor Portal',
    description:
      'Encrypted patient queue, diagnostic charting, lab evaluations, and e-prescriptions.',
    badge: 'CLINICAL CARE',
    cta: 'Launch Terminal',
    href: '/doctor/login/',
    accent: 'bg-emerald-500',
    badgeClass: 'bg-emerald-50 text-emerald-800 ring-emerald-200/80',
    iconBg: 'bg-emerald-500/10',
    iconColor: 'text-emerald-600',
    icon: Stethoscope,
  },
  {
    id: 'patient',
    title: 'Patient Portal',
    description:
      'Smart UHID tracking, appointment booking, lab results, and live queue status.',
    badge: 'CARE ACCESS',
    cta: 'Open Patient Desk',
    href: '/patient/login/',
    accent: 'bg-sky-500',
    badgeClass: 'bg-sky-50 text-sky-800 ring-sky-200/80',
    iconBg: 'bg-sky-500/10',
    iconColor: 'text-sky-600',
    icon: UserRound,
  },
  {
    id: 'vendor',
    title: 'Vendor & Supply Hub',
    description:
      'Pharmacy supply chain, purchase order invoices, procurement tracking, and inventory logs.',
    badge: 'SUPPLY CHAIN',
    cta: 'Access Supply Desk',
    href: '/vendor/login/',
    accent: 'bg-rose-500',
    badgeClass: 'bg-rose-50 text-rose-800 ring-rose-200/80',
    iconBg: 'bg-rose-500/10',
    iconColor: 'text-rose-600',
    icon: Package,
  },
];

function PortalCardLink({
  card,
  gridClass,
}: {
  card: PortalCard;
  gridClass: string;
}) {
  const Icon = card.icon;
  const prefetch = !shouldDisableSuperAdminLinkPrefetch(card.href);

  return (
    <Link
      href={card.href}
      prefetch={prefetch}
      className={`group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.06)] ring-1 ring-white transition-all duration-200 hover:-translate-y-1 hover:border-slate-300/90 hover:shadow-[0_16px_40px_rgba(15,23,42,0.1)] ${gridClass}`}
    >
      <span className={`absolute inset-x-0 top-0 h-1 ${card.accent}`} aria-hidden />
      <div className="flex flex-1 flex-col p-4 sm:p-[18px]">
        <div className="flex items-start justify-between gap-3">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${card.iconBg} ${card.iconColor}`}
          >
            <Icon className="h-5 w-5" strokeWidth={2} />
          </div>
          <span
            className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1 ${card.badgeClass}`}
          >
            {card.badge}
          </span>
        </div>

        <h2 className="mt-3 text-[15px] font-bold leading-snug text-slate-900 sm:text-base">
          {card.title}
        </h2>
        <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-slate-500">
          {card.description}
        </p>

        <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-slate-800 group-hover:text-sky-800">
          <span>{card.cta}</span>
          <ArrowRight className="h-3.5 w-3.5 text-sky-600 transition-transform group-hover:translate-x-0.5" />
        </div>
      </div>
    </Link>
  );
}

const HOME_WASH = `
            radial-gradient(1200px 600px at 50% -10%, rgba(56, 189, 248, 0.22), transparent 55%),
            radial-gradient(900px 500px at 100% 100%, rgba(14, 165, 233, 0.12), transparent 50%),
            linear-gradient(180deg, #e0f2fe 0%, #f0f9ff 48%, #dbeafe 100%)
          `;

export default function HomePage() {
  return (
    <main className="relative isolate flex h-dvh max-h-dvh w-full flex-col overflow-hidden bg-slate-50 font-sans text-slate-900 antialiased">
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        aria-hidden
        style={{ background: HOME_WASH }}
      />
      <MedicalDoodleBackdrop tint="navy" intensity={0.8} />

      <div className="mx-auto flex h-full w-full max-w-[1120px] flex-col px-4 py-5 sm:px-6 sm:py-6">
        <header className="flex shrink-0 flex-col items-center text-center">
          <Image
            src="/logo_of_regal-removebg-preview.png"
            alt="Regal Healthcare"
            width={56}
            height={56}
            className="mb-2 h-11 w-auto object-contain sm:h-12"
            priority
          />
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
            Regal Healthcare Systems · Enterprise Workspace
          </p>
          <h1 className="mt-2 max-w-2xl text-xl font-bold tracking-tight text-slate-900 sm:text-[1.75rem] sm:leading-tight">
            Regal Hospital Management System
          </h1>
          <p className="mt-1.5 max-w-lg text-xs leading-relaxed text-slate-600 sm:text-[13px]">
            Select an authorized operational terminal to access multi-tenant hospital
            infrastructure.
          </p>
        </header>

        <div className="flex min-h-0 flex-1 items-center justify-center py-4 sm:py-5">
          <div className="w-full rounded-3xl border border-white/60 bg-white/40 p-3 shadow-sm backdrop-blur-sm sm:p-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-6 sm:gap-4">
              {PORTALS.slice(0, 3).map((card) => (
                <PortalCardLink key={card.id} card={card} gridClass="sm:col-span-2" />
              ))}
              <PortalCardLink card={PORTALS[3]} gridClass="sm:col-span-2 sm:col-start-2" />
              <PortalCardLink card={PORTALS[4]} gridClass="sm:col-span-2 sm:col-start-4" />
            </div>
          </div>
        </div>

        <footer className="shrink-0 text-center text-[11px] font-medium text-slate-500">
          Regal Hospital Management System · Production Enterprise Core
        </footer>
      </div>
    </main>
  );
}
