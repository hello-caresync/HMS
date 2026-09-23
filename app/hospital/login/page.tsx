'use client';

import React, { Suspense, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Lock, ShieldCheck } from 'lucide-react';

import { clearStaleAuthArtifacts, purgeLocalAdminSessions } from '@/lib/auth/active-session';
import { CURASYNC_DOCTOR_SESSION_COOKIE } from '@/lib/auth/portal-route-guard';
import { clearDoctorSession } from '@/lib/doctor/session';
import { HospitalSignInForm } from '@/components/auth/HospitalSignInForm';
import { HOSPITAL_TENANT_ID, REGAL_HOSPITAL_NAME } from '@/lib/regal/constants';
import { RegalHospitalLogo } from '@/components/common/RegalHospitalLogo';

function UnifiedHospitalLoginForm() {
  const router = useRouter();

  useEffect(() => {
    purgeLocalAdminSessions();
    clearStaleAuthArtifacts();
    clearDoctorSession();

    const cookieAttrs = 'path=/; max-age=0; SameSite=Lax';
    document.cookie = `${CURASYNC_DOCTOR_SESSION_COOKIE}=; ${cookieAttrs}`;
    document.cookie = `regal_role=; ${cookieAttrs}`;
    document.cookie = `nexora_role=; ${cookieAttrs}`;
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
          <span>HOSP-01</span>
        </div>
      </div>

      <div className="relative z-10 mx-auto my-auto w-full max-w-md space-y-6 rounded-3xl border border-slate-200 bg-white p-8 text-slate-800 shadow-2xl">
        <div className="space-y-3 text-center">
          <div className="flex justify-center">
            <RegalHospitalLogo heightClass="h-11" framed />
          </div>
          <span className="block font-mono text-[10px] font-bold uppercase tracking-widest text-cyan-700">
            Unified Hospital Access
          </span>
          <p className="text-xs text-slate-500">
            Single portal for administrators, clinical staff, and operational teams · Node{' '}
            {HOSPITAL_TENANT_ID}
          </p>
        </div>

        <HospitalSignInForm />

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
