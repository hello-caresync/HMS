'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  Mail,
  ShieldCheck,
} from 'lucide-react';

import { HospitalLogo } from '@/components/common/Logo';
import {
  authenticateAdmin,
  isValidEmail,
  persistAdminSession,
} from '@/lib/admin/auth';

type AuthStage = 'idle' | 'authenticating' | 'success' | 'error';

type LoginPanelProps = {
  redirectUrl: string;
};

export default function LoginPanel({ redirectUrl }: LoginPanelProps) {
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
  const [emailTouched, setEmailTouched] = useState(false);

  const emailValid = email.trim() !== '' && isValidEmail(email);
  const isSubmitting = authStage === 'authenticating';
  const showSuccess = authStage === 'success';

  const validate = (): boolean => {
    let ok = true;
    setEmailError('');
    setPasswordError('');
    setFormError('');

    if (!email.trim()) {
      setEmailError('Please enter your work email.');
      ok = false;
    } else if (!isValidEmail(email)) {
      setEmailError('Please enter a valid email address.');
      ok = false;
    }

    if (!password.trim()) {
      setPasswordError('Please enter your password.');
      ok = false;
    } else if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters.');
      ok = false;
    }

    return ok;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isSubmitting || showSuccess) return;
    if (!validate()) return;

    setAuthStage('authenticating');
    setFormError('');
    await new Promise((r) => setTimeout(r, 550));

    const normalizedEmail = email.trim().toLowerCase();
    const authResult = await authenticateAdmin(normalizedEmail, password);
    if (authResult.ok) {
      persistAdminSession(
        { email: authResult.email, role: 'administrator', loggedInAt: new Date().toISOString() },
        rememberDevice,
      );
      setAuthStage('success');
      await new Promise((r) => setTimeout(r, 450));
      router.replace(redirectUrl);
      router.refresh();
      return;
    }

    setAuthStage('error');
    setFormError(authResult.error);
  };

  return (
    <section
      className="relative flex min-h-0 flex-1 flex-col bg-[#F4F8FB] lg:w-[42%]"
      aria-label="Administrator login"
    >
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-[clamp(1rem,3vw,2rem)] py-[clamp(0.75rem,2vh,1.5rem)]">
        <div className="mb-3 flex w-full max-w-[420px] justify-center lg:hidden">
          <HospitalLogo className="h-10 w-auto" priority />
        </div>

        <motion.div
          initial={{ opacity: 0, y: reducedMotion ? 0 : 14, scale: reducedMotion ? 1 : 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-full max-w-[420px] rounded-2xl border border-[#E4EAF3] bg-white p-[clamp(1.25rem,2.5vh,2rem)] shadow-[0_20px_60px_rgba(16,32,51,0.08)]"
        >
          {showSuccess && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 z-20 flex flex-col items-center justify-center rounded-2xl bg-white/95 px-6 text-center backdrop-blur-sm"
              role="status"
              aria-live="polite"
            >
              <CheckCircle2 className="mb-3 h-10 w-10 text-[#0EA5A4]" aria-hidden="true" />
              <p className="text-base font-bold text-[#102033]">Authentication Successful</p>
              <p className="mt-1 text-sm text-[#6B7C8F]">Opening Regal Hospital Dashboard…</p>
            </motion.div>
          )}

          <div className="mb-[clamp(0.75rem,2vh,1.25rem)] flex justify-center">
            <HospitalLogo className="h-10 w-auto" priority />
          </div>

          <h2 className="text-[clamp(1.35rem,2vw,1.75rem)] font-bold text-[#102033]">Welcome back</h2>
          <p className="mt-1 text-[clamp(0.75rem,1vw,0.875rem)] text-[#6B7C8F]">
            Sign in to access your hospital command center.
          </p>

          {formError && (
            <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700" role="alert">
              {formError}
            </p>
          )}

          <form onSubmit={handleSubmit} autoComplete="off" className="mt-[clamp(0.75rem,2vh,1.25rem)] space-y-[clamp(0.65rem,1.5vh,1rem)]" noValidate>
            <div>
              <label htmlFor="regal-email" className="mb-1 block text-xs font-semibold text-[#102033]">
                Work Email
              </label>
              <div className="group relative">
                <Mail
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B7C8F] transition-colors group-focus-within:text-[#0EA5A4]"
                  aria-hidden="true"
                />
                <input
                  id="regal-email"
                  type="email"
                  autoComplete="off"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setEmailError('');
                    setFormError('');
                    if (authStage === 'error') setAuthStage('idle');
                  }}
                  onBlur={() => setEmailTouched(true)}
                  placeholder="Enter admin email"
                  aria-invalid={!!emailError}
                  aria-describedby={emailError ? 'regal-email-error' : undefined}
                  className="w-full rounded-xl border border-[#DCE4F0] bg-[#F8FAFD] py-2.5 pl-10 pr-10 text-sm text-[#102033] outline-none transition-all placeholder:text-[#94A3B8] focus:border-[#0EA5A4] focus:bg-white focus:shadow-[0_0_0_3px_rgba(14,165,164,0.12)]"
                />
                {emailTouched && emailValid && (
                  <Check className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#0EA5A4]" aria-hidden="true" />
                )}
              </div>
              {emailError && (
                <p id="regal-email-error" className="mt-1 text-xs text-rose-600" role="alert">
                  {emailError}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="regal-password" className="mb-1 block text-xs font-semibold text-[#102033]">
                Password
              </label>
              <div className="group relative">
                <LockKeyhole
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B7C8F] transition-colors group-focus-within:text-[#0EA5A4]"
                  aria-hidden="true"
                />
                <input
                  id="regal-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setPasswordError('');
                    setFormError('');
                    if (authStage === 'error') setAuthStage('idle');
                  }}
                  placeholder="Enter your password"
                  aria-invalid={!!passwordError}
                  aria-describedby={passwordError ? 'regal-password-error' : undefined}
                  className="w-full rounded-xl border border-[#DCE4F0] bg-[#F8FAFD] py-2.5 pl-10 pr-10 text-sm text-[#102033] outline-none transition-all placeholder:text-[#94A3B8] focus:border-[#0EA5A4] focus:bg-white focus:shadow-[0_0_0_3px_rgba(14,165,164,0.12)]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((c) => !c)}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-[#6B7C8F] hover:text-[#102033]"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {passwordError && (
                <p id="regal-password-error" className="mt-1 text-xs text-rose-600" role="alert">
                  {passwordError}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between gap-2 text-xs">
              <label className="flex cursor-pointer items-center gap-2 text-[#6B7C8F]">
                <input
                  type="checkbox"
                  checked={rememberDevice}
                  onChange={(e) => setRememberDevice(e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-[#DCE4F0] accent-[#0EA5A4]"
                />
                Remember this device
              </label>
              <Link href="/login/forgot-password" className="font-medium text-[#0EA5A4] hover:text-[#38BDF8] hover:underline">
                Forgot password?
              </Link>
            </div>

            <motion.button
              type="submit"
              disabled={isSubmitting || showSuccess}
              whileHover={reducedMotion || isSubmitting ? undefined : { y: -2 }}
              whileTap={reducedMotion || isSubmitting ? undefined : { scale: 0.98 }}
              className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0EA5A4] to-[#38BDF8] text-sm font-semibold text-white shadow-[0_8px_24px_rgba(14,165,164,0.25)] transition-shadow hover:shadow-[0_12px_32px_rgba(14,165,164,0.35)] disabled:cursor-not-allowed disabled:opacity-80"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  Authenticating...
                </>
              ) : showSuccess ? (
                <>
                  <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                  Opening Dashboard...
                </>
              ) : (
                <>
                  Enter Command Center
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                </>
              )}
            </motion.button>
          </form>

          <div className="mt-[clamp(0.75rem,1.5vh,1rem)] flex items-start gap-2 rounded-lg bg-[#F4F8FB] px-3 py-2">
            <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#0EA5A4]" aria-hidden="true" />
            <div>
              <p className="text-xs font-medium text-[#102033]">Secure Administrative Access</p>
              <p className="text-[10px] text-[#6B7C8F]">Protected with enterprise-grade authentication.</p>
            </div>
          </div>
        </motion.div>

        <footer className="mt-[clamp(0.5rem,1.5vh,1rem)] w-full max-w-[420px] text-center text-[10px] text-[#6B7C8F]">
          <p>© 2026 Regal Hospital</p>
          <div className="mt-1 flex items-center justify-center gap-3">
            <button type="button" className="hover:text-[#0EA5A4]">Privacy</button>
            <span aria-hidden="true">·</span>
            <button type="button" className="hover:text-[#0EA5A4]">Security</button>
            <span aria-hidden="true">·</span>
            <button type="button" className="hover:text-[#0EA5A4]">Support</button>
          </div>
        </footer>
      </div>
    </section>
  );
}
