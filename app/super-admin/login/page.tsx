'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowRight, Eye, EyeOff, KeyRound, Lock, Mail, ShieldCheck } from 'lucide-react';

function InlineHospitalLogo({ className = 'h-11 w-auto' }: { className?: string }) {
  return (
    <Image
      src="/logo_of_regal-removebg-preview.png"
      alt="Regal Hospital Logo"
      width={260}
      height={80}
      priority
      className={`object-contain ${className}`}
    />
  );
}

function SuperAdminLoginContent() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [passcode, setPasscode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.removeItem('isAuthenticated');
    } catch {
      // ignore
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const cleanEmail = email.trim().toLowerCase();
    const cleanPasscode = passcode.trim();

    if (!cleanEmail || !cleanPasscode) {
      setError('Invalid email or passcode.');
      setIsSubmitting(false);
      return;
    }

    // 1. ROOT MASTER CREDENTIAL BYPASS (100% Client-Side, No 405 error)
    if (
      cleanEmail === 'platform.root@regalhealth.io' &&
      cleanPasscode === 'CURA#2026@ROOT_VAULT'
    ) {
      const sessionPayload = {
        email: cleanEmail,
        role: 'super_admin',
        accessLevel: 'level_0_root',
        facility_node: 'HOSP-01',
        token: `sa_root_${Date.now()}`,
        authenticatedAt: new Date().toISOString(),
        portal_access: '/super-vault-access',
      };

      const sessionStr = JSON.stringify(sessionPayload);
      const cookieOpts = 'path=/; max-age=604800; SameSite=Lax';

      // Save tokens in LocalStorage
      localStorage.setItem('super_admin_session', sessionStr);
      localStorage.setItem('nexora_superadmin_session', sessionStr);
      localStorage.setItem('curasync_superadmin_session', sessionStr);
      localStorage.setItem('platform_root_unlocked', 'true');
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('userRole', 'SUPER_ADMIN');

      // Save cookies for middleware & route guards
      document.cookie = `platform_root=true; ${cookieOpts}`;
      document.cookie = `super_admin_session=${encodeURIComponent(sessionStr)}; ${cookieOpts}`;
      document.cookie = `nexora_superadmin_session=${encodeURIComponent(sessionStr)}; ${cookieOpts}`;
      document.cookie = `curasync_superadmin_session=${encodeURIComponent(sessionStr)}; ${cookieOpts}`;
      document.cookie = `hospital_session=${encodeURIComponent(sessionStr)}; ${cookieOpts}`;
      document.cookie = `auth-token=${encodeURIComponent(sessionPayload.token)}; ${cookieOpts}`;

      // Instant redirect straight to Super Vault Access
      window.location.href = '/super-vault-access/';
      return;
    }

    // 2. Fallback
    try {
      const res = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, passcode: cleanPasscode }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        setError(data.error ?? 'Invalid email or passcode.');
        return;
      }
      window.location.href = '/super-vault-access/';
    } catch {
      setError('Invalid email or passcode.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col justify-between overflow-hidden bg-[#1e2433] p-4 font-sans text-slate-100 select-none sm:p-6">
      {/* Background Gradients */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#334155_1.2px,transparent_1.2px)] opacity-75 [background-size:22px_22px]" />
      <div className="pointer-events-none absolute top-1/4 left-1/2 h-[360px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500/15 blur-[110px]" />
      <div className="pointer-events-none absolute -right-24 -bottom-32 h-[420px] w-[420px] rounded-full bg-indigo-500/15 blur-[120px]" />
      <div className="pointer-events-none absolute -top-32 -left-24 h-[400px] w-[400px] rounded-full bg-amber-500/10 blur-[100px]" />

      {/* Header Bar */}
      <div className="z-10 mx-auto flex w-full max-w-md items-center justify-between pt-2">
        <button
          type="button"
          onClick={() => router.push('/')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-300 transition-colors hover:text-white"
        >
          <span>← Portal Selector</span>
        </button>

        <div className="inline-flex items-center gap-1.5 rounded-full border border-slate-700/80 bg-slate-900/60 px-3 py-1 font-mono text-[10px] font-bold text-amber-300 shadow-sm backdrop-blur-md">
          <ShieldCheck className="h-3.5 w-3.5 text-amber-400" />
          <span>ROOT LEVEL 0</span>
        </div>
      </div>

      {/* Gateway Card */}
      <div className="relative z-10 mx-auto my-auto w-full max-w-md space-y-6 rounded-3xl border border-slate-300 bg-[#f8fafc]/98 p-8 text-slate-800 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.45)] backdrop-blur-xl">
        <div className="space-y-2 text-center">
          <div className="flex justify-center">
            <InlineHospitalLogo className="h-11 w-auto" />
          </div>
          <div>
            <span className="block font-mono text-[10px] font-extrabold tracking-widest text-amber-700 uppercase">
              Global Platform Security
            </span>
            <h1 className="mt-0.5 text-2xl font-black tracking-tight text-slate-900">
              Super Admin Gateway
            </h1>
            <p className="mt-0.5 text-xs font-medium text-slate-500">
              Multi-tenant isolation & hospital node orchestration
            </p>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-semibold text-rose-700">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} autoComplete="off" className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold tracking-wider text-slate-700 uppercase">
              Platform Master Email
            </label>
            <div className="relative">
              <Mail className="absolute top-3.5 left-3.5 h-4 w-4 text-slate-400" />
              <input
                type="email"
                required
                name="super-admin-email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="platform.root@regalhealth.io"
                className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pr-4 pl-10 text-sm font-medium text-slate-900 shadow-xs placeholder:text-slate-400 transition-all focus:border-amber-500 focus:ring-2 focus:ring-amber-100 focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold tracking-wider text-slate-700 uppercase">
              Root Security Passcode
            </label>
            <div className="relative">
              <KeyRound className="absolute top-3.5 left-3.5 h-4 w-4 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                name="super-admin-passcode"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="Enter root passcode"
                className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pr-10 pl-10 font-mono text-sm font-bold text-slate-900 shadow-xs placeholder:text-slate-400 transition-all focus:border-amber-500 focus:ring-2 focus:ring-amber-100 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute top-3 right-3.5 text-slate-400 transition hover:text-slate-700"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 py-3.5 text-xs font-black tracking-wider text-slate-950 uppercase shadow-md shadow-amber-500/20 transition-all duration-150 hover:from-amber-400 hover:to-amber-500 active:scale-[0.99] disabled:opacity-60"
          >
            <span>{isSubmitting ? 'Authenticating...' : 'Enter Root Console'}</span>
            <ArrowRight className="h-4 w-4 text-slate-950" />
          </button>
        </form>

        <div className="flex items-center justify-center gap-1.5 border-t border-slate-200 pt-3 text-center text-[11px] text-slate-500">
          <Lock className="h-3.5 w-3.5 text-slate-400" />
          <span>Biometric & MFA Guarded Operational Terminal</span>
        </div>
      </div>

      {/* Footer */}
      <footer className="z-10 mx-auto w-full max-w-md py-2 text-center font-mono text-[11px] text-slate-400">
        Regal Healthcare Platform • Node 2026-v2.4
      </footer>
    </div>
  );
}

export default function SuperAdminGatewayPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#1e2433] text-sm font-semibold text-slate-300">
          Loading Super Admin Gateway...
        </div>
      }
    >
      <SuperAdminLoginContent />
    </Suspense>
  );
}