'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Fingerprint, Lock, ShieldCheck } from 'lucide-react';

export default function DoctorAuthLoginPage() {
  const router = useRouter();
  const [mfaStep, setMfaStep] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setMfaStep(true);
  };

  const handleMfa = (e: React.FormEvent) => {
    e.preventDefault();
    setNotice('Session established · device fingerprint registered (mock)');
    window.setTimeout(() => router.push('/doctor/dashboard'), 800);
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-12">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-lg">
        <div className="mb-6 text-center">
          <ShieldCheck className="mx-auto h-10 w-10 text-[#00758C]" />
          <h1 className="mt-3 text-2xl font-black text-[#00758C]">Nexora Doctor App</h1>
          <p className="text-sm text-slate-600">Clinician-only secure access · RBAC Doctor roles</p>
        </div>

        {!mfaStep ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <label className="block text-sm font-semibold text-slate-700">
              Email / Provider ID
              <input
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                defaultValue="dr.aishwarya@nexora.clinical"
              />
            </label>
            <label className="block text-sm font-semibold text-slate-700">
              Password
              <input type="password" className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" defaultValue="••••••••" />
            </label>
            <button type="submit" className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#00758C] py-2.5 text-sm font-bold text-white">
              <Lock className="h-4 w-4" /> Continue to MFA
            </button>
            <Link href="/login/forgot-password" className="block text-center text-xs font-semibold text-[#008588] hover:underline">
              Reset password
            </Link>
          </form>
        ) : (
          <form onSubmit={handleMfa} className="space-y-4">
            <p className="text-sm text-slate-600">Enter 6-digit authenticator code (mock: 123456)</p>
            <input className="w-full rounded-lg border border-slate-200 px-3 py-2 text-center font-mono text-lg tracking-widest" defaultValue="123456" />
            <button type="submit" className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#008588] py-2.5 text-sm font-bold text-white">
              <Fingerprint className="h-4 w-4" /> Verify &amp; enable biometric session
            </button>
          </form>
        )}

        {notice && <p className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800">{notice}</p>}
      </div>
    </div>
  );
}
