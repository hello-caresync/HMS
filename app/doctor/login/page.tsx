'use client';

import React, { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Lock, ShieldCheck } from 'lucide-react';

import { DoctorLoginForm } from '@/components/doctor/DoctorLoginForm';
import { RegalHospitalLogo } from '@/components/brand/RegalHospitalLogo';
import { HOSPITAL_TENANT_ID, REGAL_HOSPITAL_NAME } from '@/lib/regal/constants';

function DoctorLoginInner() {
  const router = useRouter();

  return (
    <div className="relative flex min-h-screen w-full flex-col justify-between overflow-hidden bg-[#062a24] p-4 font-sans text-slate-100 select-none sm:p-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#0f4d42_1.2px,transparent_1.2px)] opacity-60 [background-size:24px_24px]" />
      <div className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-teal-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 -bottom-32 h-96 w-96 rounded-full bg-emerald-600/15 blur-3xl" />

      <div className="relative z-10 mx-auto flex w-full max-w-md items-center justify-between pt-2">
        <button
          type="button"
          onClick={() => router.push('/')}
          className="text-xs font-semibold text-teal-200/80 transition-colors hover:text-teal-100"
        >
          &larr; Workspace Directory
        </button>
        <div className="inline-flex items-center gap-1.5 rounded-full border border-teal-800 bg-[#08352f] px-3 py-1 font-mono text-[10px] font-bold text-teal-200">
          <ShieldCheck className="h-3.5 w-3.5 text-teal-300" />
          <span>EMR CLINICIAN PORTAL</span>
        </div>
      </div>

      <div className="relative z-10 mx-auto my-auto w-full max-w-md space-y-6 rounded-3xl border border-slate-200 bg-white p-8 text-slate-800 shadow-2xl">
        <div className="space-y-2 text-center">
          <div className="mb-1 flex justify-center">
            <RegalHospitalLogo heightClass="h-9" showNodeBadge />
          </div>
          <span className="block font-mono text-[10px] font-bold uppercase tracking-widest text-teal-700">
            Isolated Clinician Environment
          </span>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Doctor Consultation Login</h1>
          <p className="text-xs text-slate-500">
            Access your live OPD queue, consultations, and prescription workspace
          </p>
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] font-bold text-slate-600">
            <span className="font-mono text-teal-800">{HOSPITAL_TENANT_ID}</span>
            <span className="text-slate-300">·</span>
            <span>{REGAL_HOSPITAL_NAME}</span>
          </div>
        </div>

        <DoctorLoginForm />

        <div className="flex items-center justify-center gap-1.5 border-t border-slate-100 pt-3 text-[11px] text-slate-500">
          <Lock className="h-3.5 w-3.5 text-slate-400" />
          <span>Doctor-scoped queue · Patients assigned to you only</span>
        </div>
      </div>

      <footer className="relative z-10 mx-auto w-full max-w-md py-2 text-center font-mono text-[11px] text-teal-200/70">
        {REGAL_HOSPITAL_NAME} · Node {HOSPITAL_TENANT_ID} · Bengaluru
      </footer>
    </div>
  );
}

export default function DoctorLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen w-full items-center justify-center bg-[#062a24]">
          <Loader2 className="h-6 w-6 animate-spin text-teal-300" />
        </div>
      }
    >
      <DoctorLoginInner />
    </Suspense>
  );
}
