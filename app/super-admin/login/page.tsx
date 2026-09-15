'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  Crown,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Mail,
  ShieldCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import { purgeLocalAdminSessions } from '@/lib/auth/active-session';
import { setNexoraRoleCookie } from '@/lib/auth/role-cookies';
import { createClient } from '@/lib/supabase/client';

const ALLOWED_SUPER_ADMINS = [
  'aishwaryaananya43@gmail.com',
  'superadmin@regalhospital.com',
];

function isAllowlistedSuperAdmin(email: string): boolean {
  return ALLOWED_SUPER_ADMINS.includes(email.trim().toLowerCase());
}

function isAuthorizedGatewayRole(role: unknown): boolean {
  const normalized = String(role ?? '')
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');
  return normalized === 'super_admin' || normalized === 'admin' || normalized === 'superadmin';
}

export default function SuperAdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passcode, setPasscode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    purgeLocalAdminSessions();
  }, []);

  const handleSuperAdminLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    const cleanEmail = email.trim().toLowerCase();
    const cleanPasscode = passcode.trim() || password.trim();

    if (!cleanEmail || !cleanPasscode) {
      setErrorMessage('Invalid email or passcode.');
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { data, error } = await supabase
      .from('hospital_staff')
      .select('*')
      .ilike('email', cleanEmail)
      .eq('passcode_key', cleanPasscode)
      .eq('is_active', true)
      .maybeSingle();

    if (error || !data) {
      setErrorMessage('Invalid email or passcode.');
      setLoading(false);
      return;
    }

    if (
      !isAllowlistedSuperAdmin(cleanEmail) &&
      !isAuthorizedGatewayRole(data.role) &&
      !isAuthorizedGatewayRole(data.staff_type)
    ) {
      setErrorMessage('This account is not authorized for Super Admin access.');
      setLoading(false);
      return;
    }

    const sessionPayload = {
      ...data,
      email: cleanEmail,
      role: 'super_admin',
      accessLevel: 'level_0_root',
      authenticatedAt: new Date().toISOString(),
      portal_access: '/super-vault-access',
    };

    localStorage.setItem('super_admin_session', JSON.stringify(data));
    localStorage.setItem('nexora_superadmin_session', JSON.stringify(sessionPayload));
    localStorage.setItem('curasync_superadmin_session', JSON.stringify(sessionPayload));
    setNexoraRoleCookie('super_admin');
    document.cookie = `nexora_superadmin_session=${encodeURIComponent(JSON.stringify(sessionPayload))}; path=/; max-age=86400; SameSite=Lax`;

    toast.success('Root Master Authentication Verified');
    router.push('/super-vault-access');
    setLoading(false);
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col justify-between overflow-hidden bg-[#1e2433] p-4 font-sans text-slate-100 select-none sm:p-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#334155_1.2px,transparent_1.2px)] opacity-75 [background-size:22px_22px]" />
      <div className="pointer-events-none absolute top-1/4 left-1/2 h-[360px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500/15 blur-[110px]" />
      <div className="pointer-events-none absolute -right-24 -bottom-32 h-[420px] w-[420px] rounded-full bg-indigo-500/15 blur-[120px]" />
      <div className="pointer-events-none absolute -top-32 -left-24 h-[400px] w-[400px] rounded-full bg-amber-500/10 blur-[100px]" />

      <div className="z-10 mx-auto flex w-full max-w-md items-center justify-between pt-2">
        <button
          type="button"
          onClick={() => router.push('/')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-300 transition-colors hover:text-white"
        >
          <span>&larr; Portal Selector</span>
        </button>
        <div className="inline-flex items-center gap-1.5 rounded-full border border-slate-700/80 bg-slate-900/60 px-3 py-1 font-mono text-[10px] font-bold text-amber-300 shadow-sm backdrop-blur-md">
          <ShieldCheck className="h-3.5 w-3.5 text-amber-400" />
          <span>ROOT LEVEL 0</span>
        </div>
      </div>

      <div className="relative z-10 mx-auto my-auto w-full max-w-md space-y-6 rounded-3xl border border-slate-300 bg-[#f8fafc]/98 p-8 text-slate-800 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.45)] backdrop-blur-xl">
        <div className="space-y-2 text-center">
          <div className="inline-flex rounded-2xl border border-amber-200 bg-amber-50 p-3 text-amber-600 shadow-xs">
            <Crown className="h-7 w-7" />
          </div>
          <div>
            <span className="block font-mono text-[10px] font-extrabold tracking-widest text-amber-700 uppercase">
              Global Platform Security
            </span>
            <h1 className="mt-0.5 text-2xl font-black tracking-tight text-slate-900">
              Super Admin Gateway
            </h1>
            <p className="mt-0.5 text-xs font-medium text-slate-500">
              Multi-tenant isolation &amp; hospital node orchestration
            </p>
          </div>
        </div>

        {errorMessage && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-semibold text-rose-700">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSuperAdminLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold tracking-wider text-slate-700 uppercase">
              Platform Master Email
            </label>
            <div className="relative">
              <Mail className="absolute top-3.5 left-3.5 h-4 w-4 text-slate-400" />
              <input
                type="email"
                required
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter platform email"
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
                autoComplete="current-password"
                value={passcode || password}
                onChange={(e) => {
                  setPasscode(e.target.value);
                  setPassword(e.target.value);
                }}
                placeholder="Enter root passcode"
                className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pr-10 pl-10 font-mono text-sm font-bold text-slate-900 shadow-xs placeholder:text-slate-400 transition-all focus:border-amber-500 focus:ring-2 focus:ring-amber-100 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute top-3 right-3.5 text-slate-400 transition hover:text-slate-700"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 py-3.5 text-xs font-black tracking-wider text-slate-950 uppercase shadow-md shadow-amber-500/20 transition-all duration-150 hover:from-amber-400 hover:to-amber-500 active:scale-[0.99] disabled:opacity-60"
          >
            <span>{loading ? 'Authenticating...' : 'Enter Root Console'}</span>
            <ArrowRight className="h-4 w-4 text-slate-950" />
          </button>
        </form>

        <div className="flex items-center justify-center gap-1.5 border-t border-slate-200 pt-3 text-center text-[11px] text-slate-500">
          <Lock className="h-3.5 w-3.5 text-slate-400" />
          <span>Biometric &amp; MFA Guarded Operational Terminal</span>
        </div>
      </div>

      <footer className="z-10 mx-auto w-full max-w-md py-2 text-center font-mono text-[11px] text-slate-400">
        Regal Healthcare Platform &bull; Node 2026-v2.4
      </footer>
    </div>
  );
}
