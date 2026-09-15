'use client';

import React from 'react';
import Link from 'next/link';
import {
  Crown,
  ShieldCheck,
  Stethoscope,
  HeartPulse,
  Truck,
  ArrowRight,
  Sparkles,
  Building2,
} from 'lucide-react';

import { RegalHospitalLogo } from '@/components/brand/RegalHospitalLogo';

interface PortalOption {
  title: string;
  role: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  badge: string;
  colorScheme: {
    iconBg: string;
    iconColor: string;
    badgeBg: string;
    badgeText: string;
    borderHover: string;
    arrowHover: string;
  };
}

export default function BalancedEcosystemGateway() {
  const portals: PortalOption[] = [
    {
      title: 'Super Admin',
      role: 'Platform & Global Network Control',
      description:
        'Master platform orchestration, hospital node provisioning, multi-tenant isolation, and global security.',
      icon: Crown,
      href: '/super-admin/login',
      badge: 'Level 0 Root',
      colorScheme: {
        iconBg: 'bg-amber-500/10 border-amber-500/20',
        iconColor: 'text-amber-600',
        badgeBg: 'bg-amber-50 border-amber-200',
        badgeText: 'text-amber-700',
        borderHover: 'hover:border-amber-400 hover:shadow-amber-500/10',
        arrowHover: 'group-hover:text-amber-600',
      },
    },
    {
      title: 'Hospital Portal',
      role: 'Admin, Nursing, Desk & Pharmacy',
      description:
        'Unified Regal Hospital workspace for administrators and operational staff — triage, tokens, billing, and pharmacy.',
      icon: ShieldCheck,
      href: '/hospital/login',
      badge: 'Hospital OS',
      colorScheme: {
        iconBg: 'bg-blue-500/10 border-blue-500/20',
        iconColor: 'text-blue-600',
        badgeBg: 'bg-blue-50 border-blue-200',
        badgeText: 'text-blue-700',
        borderHover: 'hover:border-blue-400 hover:shadow-blue-500/10',
        arrowHover: 'group-hover:text-blue-600',
      },
    },
    {
      title: 'Doctor Portal',
      role: 'OPD Queue, Clinical Rx & Consults',
      description:
        'Review patient queues, access health records, conduct consultations, and issue digital prescriptions.',
      icon: Stethoscope,
      href: '/doctor/login',
      badge: 'Clinicians',
      colorScheme: {
        iconBg: 'bg-teal-500/10 border-teal-500/20',
        iconColor: 'text-teal-600',
        badgeBg: 'bg-teal-50 border-teal-200',
        badgeText: 'text-teal-700',
        borderHover: 'hover:border-teal-400 hover:shadow-teal-500/10',
        arrowHover: 'group-hover:text-teal-600',
      },
    },
    {
      title: 'Patient Care',
      role: 'Live Tokens, Booking & Records',
      description:
        'Book appointments, track queue position in real time, and download consultation records.',
      icon: HeartPulse,
      href: '/patient/login',
      badge: 'Public & Patients',
      colorScheme: {
        iconBg: 'bg-emerald-500/10 border-emerald-500/20',
        iconColor: 'text-emerald-600',
        badgeBg: 'bg-emerald-50 border-emerald-200',
        badgeText: 'text-emerald-700',
        borderHover: 'hover:border-emerald-400 hover:shadow-emerald-500/10',
        arrowHover: 'group-hover:text-emerald-600',
      },
    },
    {
      title: 'Vendor & Suppliers',
      role: 'Procurement Orders & Supply Dispatch',
      description:
        'Access purchase requisitions, supply orders, batch shipments, and invoice fulfillment status.',
      icon: Truck,
      href: '/vendor/login',
      badge: 'Partners',
      colorScheme: {
        iconBg: 'bg-orange-500/10 border-orange-500/20',
        iconColor: 'text-orange-600',
        badgeBg: 'bg-orange-50 border-orange-200',
        badgeText: 'text-orange-700',
        borderHover: 'hover:border-orange-400 hover:shadow-orange-500/10',
        arrowHover: 'group-hover:text-orange-600',
      },
    },
  ];

  return (
    <div className="relative flex min-h-screen w-full flex-col justify-between overflow-hidden bg-[#f8fafc] p-4 font-sans text-slate-800 select-none sm:p-6 lg:p-8">
      {/* Dynamic Multi-Tone Ambient Light Background */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] opacity-60 [background-size:24px_24px]" />
      <div className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-blue-200/40 blur-3xl" />
      <div className="pointer-events-none absolute top-1/4 -right-32 h-96 w-96 rounded-full bg-teal-200/35 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 left-1/3 h-96 w-96 rounded-full bg-indigo-200/35 blur-3xl" />

      {/* Header Section */}
      <header className="z-10 mx-auto w-full max-w-6xl shrink-0 space-y-3 pt-2 text-center">
        <div className="flex justify-center">
          <RegalHospitalLogo heightClass="h-9" showNodeBadge className="justify-center" />
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/90 px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm backdrop-blur-md">
          <Sparkles className="h-3.5 w-3.5 animate-pulse text-teal-600" />
          <span>Regal Healthcare &bull; Unified Clinical Platform</span>
        </div>

        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
          Select Your Workspace Portal
        </h1>
        <p className="mx-auto max-w-xl text-xs text-slate-500 sm:text-sm">
          Sign in to your designated clinical role or access patient care services.
        </p>
      </header>

      {/* 2x3 Grid Section */}
      <main className="z-10 mx-auto my-auto w-full max-w-6xl py-3">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 lg:gap-5">
          {portals.map((portal) => {
            const Icon = portal.icon;
            return (
              <Link
                key={portal.title}
                href={portal.href}
                className={`group flex cursor-pointer flex-col justify-between rounded-2xl border border-slate-200/90 bg-white/95 p-5 shadow-sm backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl ${portal.colorScheme.borderHover}`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div
                      className={`rounded-xl border p-2.5 ${portal.colorScheme.iconBg} ${portal.colorScheme.iconColor}`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <span
                      className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase ${portal.colorScheme.badgeBg} ${portal.colorScheme.badgeText}`}
                    >
                      {portal.badge}
                    </span>
                  </div>

                  <div>
                    <h2 className="text-base font-bold text-slate-900 transition-colors group-hover:text-slate-950">
                      {portal.title}
                    </h2>
                    <p className="mt-0.5 text-[11px] font-semibold text-slate-400">{portal.role}</p>
                  </div>

                  <p className="line-clamp-2 text-xs leading-relaxed text-slate-500">
                    {portal.description}
                  </p>
                </div>

                <div
                  className={`mt-3.5 flex items-center justify-between border-t border-slate-100 pt-3.5 text-xs font-semibold text-slate-400 transition-colors ${portal.colorScheme.arrowHover}`}
                >
                  <span>Access Workspace</span>
                  <ArrowRight className="h-3.5 w-3.5 transform transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            );
          })}
        </div>
      </main>

      {/* Footer Section */}
      <footer className="z-10 mx-auto flex w-full max-w-6xl shrink-0 flex-col items-center justify-between gap-2 border-t border-slate-200/60 py-2 text-center text-xs text-slate-500 sm:flex-row">
        <div className="flex items-center gap-2 text-slate-500">
          <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
          <span>Platform Node Status: Operational</span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
          <Building2 className="h-3.5 w-3.5" />
          <span>Regal Hospital Network &bull; Multi-Tenant Isolated Architecture &bull; 2026</span>
        </div>
      </footer>
    </div>
  );
}
