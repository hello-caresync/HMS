'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Heart, Loader2, ArrowRight } from 'lucide-react';
import { ensurePatientIdPersisted } from '@/lib/clinical/bridge';

function hasPatientSession(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return Boolean(
      window.localStorage.getItem('curasync_patient_session') ||
        window.localStorage.getItem('patient_full_name'),
    );
  } catch {
    return false;
  }
}

/** Patient portal entry — routes to dashboard when session exists, otherwise login. */
export function PatientApp() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      ensurePatientIdPersisted();
      const ok = hasPatientSession();
      setAuthenticated(ok);
      setChecking(false);
      if (ok) {
        router.replace('/patient/dashboard/');
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [router]);

  if (checking) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center font-sans text-[#0E2924]">
        <div className="flex items-center gap-3 rounded-2xl border border-[#D5E8E3] bg-white px-6 py-4 shadow-sm">
          <Loader2 className="h-5 w-5 animate-spin text-[#227B6B]" />
          <span className="text-xs font-black">Opening Patient Portal…</span>
        </div>
      </div>
    );
  }

  if (authenticated) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center font-sans text-[#0E2924]">
        <div className="flex items-center gap-3 rounded-2xl border border-[#D5E8E3] bg-white px-6 py-4 shadow-sm">
          <Loader2 className="h-5 w-5 animate-spin text-[#227B6B]" />
          <span className="text-xs font-black">Redirecting to dashboard…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-6 py-12 font-sans text-[#0E2924]">
      <div className="w-full space-y-6 rounded-3xl border border-[#D5E8E3] bg-white p-8 shadow-sm">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#113831] text-white shadow-md">
            <Heart className="h-8 w-8 text-[#A6E2D8]" />
          </div>
          <h1 className="mt-4 text-2xl font-black">CuraSync Patient App</h1>
          <p className="mt-2 text-xs font-bold text-[#227B6B]">
            Sign in to access appointments, prescriptions, and clinical messaging.
          </p>
        </div>

        <Link
          href="/patient/auth/login/"
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#113831] py-4 text-xs font-black text-white shadow-lg transition hover:bg-[#227B6B]"
        >
          Sign In to Patient Portal
          <ArrowRight className="h-4 w-4" />
        </Link>

        <p className="text-center text-[11px] font-bold text-slate-500">
          Testing alongside Doctor Workspace?{' '}
          <Link href="/doctor/dashboard/" className="text-[#227B6B] underline">
            Open doctor desk
          </Link>
        </p>
      </div>
    </div>
  );
}

export default PatientApp;
