'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  Mail,
  Server,
  ShieldCheck,
  Zap,
} from 'lucide-react';

import {
  authenticateAdmin,
  isValidEmail,
  persistAdminSession,
} from '@/lib/admin/auth';

type AuthStage = 'idle' | 'authenticating' | 'verifying' | 'granted' | 'success' | 'error';

type LoginPortalPanelProps = {
  redirectUrl: string;
};

const easeOut = [0.22, 1, 0.36, 1] as const;

export default function LoginPortalPanel({ redirectUrl }: LoginPortalPanelProps) {
  const router = useRouter();
  const reducedMotion = useReducedMotion();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(true);
  const [authStage, setAuthStage] = useState<AuthStage>('idle');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [formError, setFormError] = useState('');

  const isSubmitting = authStage === 'authenticating' || authStage === 'verifying' || authStage === 'granted';
  const showSuccess = authStage === 'success';

  const validate = (): boolean => {
    let ok = true;
    setEmailError('');
    setPasswordError('');
    setFormError('');

    if (!email.trim()) {
      setEmailError('Please enter your administrator email.');
      ok = false;
    } else if (!isValidEmail(email)) {
      setEmailError('Please enter a valid administrator email.');
      ok = false;
    }

    if (!password.trim()) {
      setPasswordError('Please enter your password.');
      ok = false;
    } else if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters.');
      ok = false;
    }

    if (!ok) setAuthStage('error');
    return ok;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isSubmitting) return;
    if (!validate()) return;

    setAuthStage('authenticating');
    await new Promise((r) => setTimeout(r, 650));
    setAuthStage('verifying');
    await new Promise((r) => setTimeout(r, 700));

    const normalizedEmail = email.trim().toLowerCase();
    const authResult = await authenticateAdmin(normalizedEmail, password);
    if (authResult.ok) {
      persistAdminSession(
        { email: authResult.email, role: 'administrator', loggedInAt: new Date().toISOString() },
        rememberDevice,
      );
      setAuthStage('granted');
      await new Promise((r) => setTimeout(r, 500));
      setAuthStage('success');
      await new Promise((r) => setTimeout(r, 800));
      router.push(redirectUrl);
      router.refresh();
      return;
    }

    setAuthStage('error');
    setFormError(authResult.error);
  };

  return (
    <section
      className="relative flex min-h-0 flex-1 flex-col lg:w-[45%]"
      style={{ background: 'linear-gradient(135deg, #F8FAFF, #EEF4FF)' }}
      aria-label="Administrator login portal"
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -right-16 top-0 h-48 w-48 rounded-full bg-[#F3EEFF]/80 blur-[70px]" />
        <div className="absolute bottom-0 left-1/4 h-40 w-40 rounded-full bg-[#22D3EE]/8 blur-[60px]" />
      </div>

      <div className="relative z-10 flex min-h-0 flex-1 flex-col items-center justify-center px-[clamp(1rem,3vw,2rem)] py-[clamp(0.5rem,1.5vh,1.25rem)]">
        <div className="mb-3 w-full max-w-[460px] rounded-xl border border-[#111A46]/20 bg-gradient-to-br from-[#050816] to-[#0A1028] p-3 lg:hidden">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-[#22D3EE]" aria-hidden="true" />
            <p className="text-xs font-black tracking-wide text-white">NEXORA • ADMIN COMMAND CENTER</p>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: reducedMotion ? 0 : 18, scale: reducedMotion ? 1 : 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 1, duration: 0.6, ease: easeOut }}
          className="relative w-full max-w-[460px]"
        >
          <div className="pointer-events-none absolute -top-5 left-1/2 h-12 w-3/4 -translate-x-1/2 rounded-full bg-gradient-to-r from-[#3B82F6]/20 via-[#8B5CF6]/15 to-transparent blur-2xl" aria-hidden="true" />

          <div className="relative overflow-hidden rounded-[28px] border border-white/95 bg-white/[0.92] p-[clamp(1.25rem,2.5vh,2rem)] shadow-[0_30px_100px_rgba(30,50,100,0.16)] backdrop-blur-[28px]">
            {showSuccess && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/95 px-6 text-center backdrop-blur-md" role="status" aria-live="polite">
                <CheckCircle2 className="mb-3 h-10 w-10 text-[#10B981]" aria-hidden="true" />
                <p className="text-base font-black text-[#14213D]">ACCESS GRANTED</p>
                <p className="mt-1 text-sm text-[#64748B]">Opening Command Center...</p>
              </motion.div>
            )}

            <div className="mb-[clamp(0.75rem,1.5vh,1.25rem)]">
              <div className="mb-2.5 inline-flex items-center gap-2 rounded-full border border-[#DCE8FF] bg-[#EEF4FF] px-3 py-1 text-[10px] font-bold tracking-[0.16em] text-[#3B82F6]">
                <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                SECURE ADMIN PORTAL
              </div>
              <h2 className="text-[clamp(1.35rem,2vw,1.65rem)] font-black text-[#14213D]">Administrator Access</h2>
              <p className="mt-1.5 text-[clamp(0.75rem,1vw,0.875rem)] text-[#64748B]">
                Welcome back. Sign in to continue to your NEXORA command center.
              </p>
            </div>

            {formError && (
              <p className="mb-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs text-rose-700" role="alert">
                {formError}
              </p>
            )}

            <form onSubmit={handleSubmit} className="space-y-[clamp(0.65rem,1.2vh,0.9rem)]" noValidate>
              <div>
                <label htmlFor="nexora-email" className="mb-1 block text-[11px] font-bold tracking-[0.12em] text-[#64748B]">WORK EMAIL</label>
                <div className="group relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64748B] transition-colors group-focus-within:text-[#3B82F6]" aria-hidden="true" />
                  <input
                    id="nexora-email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setEmailError(''); setFormError(''); if (authStage === 'error') setAuthStage('idle'); }}
                    placeholder="Enter admin email"
                    aria-invalid={!!emailError}
                    className="w-full rounded-[14px] border border-[#D9E2F2] bg-[#F9FBFF] py-2.5 pl-10 pr-4 text-sm text-[#14213D] outline-none transition-all placeholder:text-[#94A3B8] focus:border-[#3B82F6] focus:bg-white focus:shadow-[0_0_0_4px_rgba(59,130,246,0.10)]"
                  />
                </div>
                {emailError && <p className="mt-1 text-xs text-rose-600" role="alert">{emailError}</p>}
              </div>

              <div>
                <label htmlFor="nexora-password" className="mb-1 block text-[11px] font-bold tracking-[0.12em] text-[#64748B]">PASSWORD</label>
                <div className="group relative">
                  <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64748B] transition-colors group-focus-within:text-[#8B5CF6]" aria-hidden="true" />
                  <input
                    id="nexora-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setPasswordError(''); setFormError(''); if (authStage === 'error') setAuthStage('idle'); }}
                    placeholder="Enter your password"
                    aria-invalid={!!passwordError}
                    className="w-full rounded-[14px] border border-[#D9E2F2] bg-[#F9FBFF] py-2.5 pl-10 pr-10 text-sm text-[#14213D] outline-none transition-all placeholder:text-[#94A3B8] focus:border-[#3B82F6] focus:bg-white focus:shadow-[0_0_0_4px_rgba(59,130,246,0.10)]"
                  />
                  <button type="button" onClick={() => setShowPassword((c) => !c)} className="absolute inset-y-0 right-0 flex items-center px-3 text-[#64748B] hover:text-[#14213D]" aria-label={showPassword ? 'Hide password' : 'Show password'}>
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {passwordError && <p className="mt-1 text-xs text-rose-600" role="alert">{passwordError}</p>}
              </div>

              <div className="flex items-center justify-between gap-2 text-xs">
                <label className="flex cursor-pointer items-center gap-2 text-[#64748B]">
                  <input type="checkbox" checked={rememberDevice} onChange={(e) => setRememberDevice(e.target.checked)} className="h-3.5 w-3.5 rounded accent-[#3B82F6]" />
                  Remember this device
                </label>
                <Link href="/login/forgot-password" className="font-semibold text-[#3B82F6] hover:text-[#8B5CF6] hover:underline">Forgot password?</Link>
              </div>

              <motion.button
                type="submit"
                disabled={isSubmitting || showSuccess}
                whileHover={reducedMotion || isSubmitting ? undefined : { y: -2 }}
                whileTap={reducedMotion || isSubmitting ? undefined : { scale: 0.98 }}
                className="group flex h-[52px] w-full items-center justify-center gap-2 rounded-[14px] bg-gradient-to-r from-[#3B82F6] via-[#6366F1] to-[#8B5CF6] text-xs font-black tracking-[0.16em] text-white shadow-[0_14px_36px_rgba(59,130,246,0.28)] disabled:cursor-not-allowed disabled:opacity-80"
              >
                {authStage === 'authenticating' && (<><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />AUTHENTICATING...</>)}
                {authStage === 'verifying' && (<><Zap className="h-4 w-4" aria-hidden="true" />VERIFYING ACCESS...</>)}
                {authStage === 'granted' && (<><ShieldCheck className="h-4 w-4" aria-hidden="true" />ACCESS GRANTED</>)}
                {authStage === 'success' && (<><CheckCircle2 className="h-4 w-4" aria-hidden="true" />OPENING COMMAND CENTER...</>)}
                {(authStage === 'idle' || authStage === 'error') && (<>ENTER COMMAND<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" /></>)}
              </motion.button>

              <div className="relative py-0.5">
                <div className="absolute inset-0 flex items-center" aria-hidden="true"><div className="w-full border-t border-[#DCE5F5]" /></div>
                <div className="relative flex justify-center"><span className="bg-white px-3 text-[10px] font-semibold tracking-[0.18em] text-[#94A3B8]">OR</span></div>
              </div>

              <button type="button" disabled title="SSO integration coming soon" className="flex h-10 w-full cursor-not-allowed items-center justify-center gap-2 rounded-[14px] border border-[#DCE5F5] bg-[#F8FAFF] text-[11px] font-semibold tracking-wide text-[#94A3B8] opacity-70">
                <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                SIGN IN WITH SSO
              </button>
            </form>

            <div className="mt-[clamp(0.75rem,1.5vh,1rem)] border-t border-[#EEF4FF] pt-3">
              <div className="flex items-center gap-2 text-xs text-[#64748B]">
                <ShieldCheck className="h-3.5 w-3.5 text-[#3B82F6]" aria-hidden="true" />
                <span>Secure administrator session</span>
              </div>
              <p className="mt-1 text-[10px] text-[#94A3B8]">Protected access • NEXORA Healthcare OS</p>
            </div>
          </div>

          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.2, duration: 0.5 }} className="absolute -bottom-1 right-0 hidden rounded-xl border border-[#DCE5F5] bg-white/85 px-3 py-2 text-[10px] font-mono shadow-sm backdrop-blur-sm lg:block">
            <div className="flex items-center gap-1.5 text-[#64748B]">
              <Server className="h-3 w-3 text-[#3B82F6]" aria-hidden="true" />
              <span className="font-semibold text-[#14213D]">NXR-ADMIN-01</span>
            </div>
            <p className="mt-0.5 flex items-center gap-1 text-[#10B981]"><span className="h-1.5 w-1.5 rounded-full bg-[#10B981]" aria-hidden="true" />NODE ONLINE</p>
          </motion.div>
        </motion.div>

        <footer className="mt-[clamp(0.4rem,1vh,0.75rem)] w-full max-w-[460px] shrink-0 text-center text-[10px] text-[#64748B]">
          <p>© 2026 NEXORA Healthcare OS</p>
          <div className="mt-1 flex items-center justify-center gap-3 text-[#94A3B8]">
            <button type="button" className="hover:text-[#3B82F6]">Privacy</button>
            <button type="button" className="hover:text-[#3B82F6]">Security</button>
            <button type="button" className="hover:text-[#3B82F6]">Support</button>
          </div>
        </footer>
      </div>
    </section>
  );
}
