'use client';

import React, { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, Lock, ShieldCheck } from 'lucide-react';

import { clearStaleAuthArtifacts, purgeLocalAdminSessions } from '@/lib/auth/active-session';
import { HospitalSignInForm } from '@/components/auth/HospitalSignInForm';
import { HOSPITAL_TENANT_ID, REGAL_HOSPITAL_NAME } from '@/lib/regal/constants';
import { RegalHospitalLogo } from '@/components/brand/RegalHospitalLogo';

function UnifiedHospitalLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect');

  useEffect(() => {
    purgeLocalAdminSessions();
    clearStaleAuthArtifacts();
  }, []);

  return (
    <div className="relative flex min-h-screen w-full flex-col justify-between overflow-hidden bg-[#0a2e47] p-4 font-sans text-slate-100 select-none sm:p-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#144970_1.2px,transparent_1.2px)] opacity-60 [background-size:24px_24px]" />
      <div className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 -bottom-32 h-96 w-96 rounded-full bg-blue-600/15 blur-3xl" />

      <div className="relative z-10 mx-auto flex w-full max-w-md items-center justify-between pt-2">
        <button
          type="button"
          onClick={() => router.push('/')}
          className="text-xs font-semibold text-cyan-300/80 transition-colors hover:text-cyan-200"
        >
          &larr; Workspace Directory
        </button>
        <div className="inline-flex items-center gap-1.5 rounded-full border border-[#144970] bg-[#07253a] px-3 py-1 font-mono text-[10px] font-bold text-cyan-300">
          <ShieldCheck className="h-3.5 w-3.5 text-cyan-400" />
          <span>REGAL HOSPITAL OS</span>
        </div>
      </div>

      <div className="relative z-10 mx-auto my-auto w-full max-w-md space-y-6 rounded-3xl border border-slate-200 bg-white p-8 text-slate-800 shadow-2xl">
        <div className="space-y-2 text-center">
          <div className="mb-1 flex justify-center">
            <RegalHospitalLogo heightClass="h-9" showNodeBadge />
          </div>
          <span className="block font-mono text-[10px] font-bold uppercase tracking-widest text-cyan-700">
            Unified Hospital Access
          </span>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Regal Hospital Sign-In</h1>
          <p className="text-xs text-slate-500">
            Single portal for administrators, clinical staff, and operational teams
          </p>
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] font-bold text-slate-600">
            <span className="font-mono text-cyan-800">{HOSPITAL_TENANT_ID}</span>
            <span className="text-slate-300">·</span>
            <span>{REGAL_HOSPITAL_NAME}</span>
          </div>
        </div>

        <HospitalSignInForm redirectUrl={redirectUrl} />

        <div className="flex items-center justify-center gap-1.5 border-t border-slate-100 pt-3 text-[11px] text-slate-500">
          <Lock className="h-3.5 w-3.5 text-slate-400" />
          <span>Role-scoped access · Staff provisioning restricted to admin vault</span>
        </div>
      </div>

      <footer className="relative z-10 mx-auto w-full max-w-md py-2 text-center font-mono text-[11px] text-cyan-300/70">
        {REGAL_HOSPITAL_NAME} · Node {HOSPITAL_TENANT_ID} · Bengaluru
      </footer>
    </div>
  );
}

export default function UnifiedHospitalLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen w-full items-center justify-center bg-[#0a2e47]">
          <Loader2 className="h-6 w-6 animate-spin text-cyan-300" />
        </div>
      }
    >
      <UnifiedHospitalLoginForm />
    </Suspense>
  );
}
