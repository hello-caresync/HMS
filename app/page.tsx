'use client';

import Link from 'next/link';
import { Heart, Stethoscope, ArrowRight, ShieldCheck } from 'lucide-react';

/** Local launch portal — pick Doctor or Patient workspace without blank root redirects. */
export default function HomePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F2F6FA] p-6 font-sans text-[#2C243B]">
      <div className="pointer-events-none absolute -left-24 top-16 h-72 w-72 rounded-full bg-[#BDE2F5]/70 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-0 h-96 w-96 rounded-full bg-[#9887B1]/25 blur-3xl" />

      <div className="relative w-full max-w-2xl space-y-8 rounded-3xl border border-white/70 bg-white/60 p-8 shadow-[14px_14px_30px_rgba(137,74,102,0.13),-10px_-10px_26px_rgba(255,255,255,0.9)] backdrop-blur-2xl md:p-12">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#894A66] to-[#572E54] text-white shadow-lg">
            <ShieldCheck className="h-7 w-7 text-[#D8A657]" />
          </div>
          <h1 className="mt-5 text-3xl font-black tracking-tight text-[#2C243B]">CuraSync Health</h1>
          <p className="mt-2 text-sm font-bold text-[#9887B1]">
            Regal Hospital — local development launch portal
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Link
            href="/doctor/dashboard/"
            className="group flex flex-col rounded-3xl border border-white/80 bg-gradient-to-br from-white/90 to-[#BDE2F5]/30 p-6 shadow-[8px_8px_20px_rgba(157,166,205,0.2)] transition hover:border-[#894A66]/30 hover:shadow-lg"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#2C1929] text-[#D8A657]">
              <Stethoscope className="h-5 w-5" />
            </div>
            <h2 className="mt-4 text-lg font-black text-[#2C243B]">Doctor Workspace</h2>
            <p className="mt-1 flex-1 text-xs font-bold text-[#2C243B]/55">
              OPD SmartQ desk, e-prescriptions, and clinician queue filtered by RH-Dxx profile.
            </p>
            <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-black text-[#894A66] group-hover:gap-2.5 transition-all">
              Open /doctor/dashboard <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </Link>

          <Link
            href="/patient/"
            className="group flex flex-col rounded-3xl border border-white/80 bg-gradient-to-br from-white/90 to-[#EAF5F2]/50 p-6 shadow-[8px_8px_20px_rgba(157,166,205,0.2)] transition hover:border-[#227B6B]/30 hover:shadow-lg"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#113831] text-[#A6E2D8]">
              <Heart className="h-5 w-5" />
            </div>
            <h2 className="mt-4 text-lg font-black text-[#0E2924]">Patient App</h2>
            <p className="mt-1 flex-1 text-xs font-bold text-[#227B6B]/80">
              Book appointments, view prescriptions, and receive doctor advice in real time.
            </p>
            <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-black text-[#113831] group-hover:gap-2.5 transition-all">
              Open /patient <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </Link>
        </div>

        <p className="text-center text-[11px] font-bold text-[#9887B1]">
          Tip: open both links in separate tabs to test bi-directional OPD sync locally.
        </p>
      </div>
    </div>
  );
}
