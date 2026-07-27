'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { Eye, EyeOff, Loader2, Stethoscope, UserRound } from 'lucide-react';
import { toast } from 'sonner';

import { useDoctorAuth } from '@/lib/doctor/auth/DoctorAuthProvider';
import { DEV_DEMO_ACCOUNT_LABELS } from '@/lib/doctor/auth/dev-auth';
import { sageUi } from '@/lib/doctor/ui-tokens';

type FieldErrors = {
  email?: string;
  password?: string;
  form?: string;
};

function validateForm(email: string, password: string): FieldErrors {
  const errors: FieldErrors = {};
  if (!email.trim()) errors.email = 'Email is required';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) errors.email = 'Enter a valid email address';
  if (!password) errors.password = 'Password is required';
  return errors;
}

export default function DoctorAuthLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get('next') ?? '/doctor/dashboard';
  const { signIn } = useDoctorAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fieldErrors = validateForm(email, password);
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      const session = await signIn(email.trim(), password, rememberMe);
      toast.success(`Welcome, ${session.fullName}`);
      router.push(nextPath);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Invalid email or password.';
      setErrors({ form: message });
    } finally {
      setLoading(false);
    }
  };

  const useDemoAccount = (demoEmail: string, demoPassword: string) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setErrors({});
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#FAFAF5] via-[#F7F6E8] to-[#E6E3C5]/40 px-4 py-12">
      <div className="w-full max-w-md">
        <div className={`${sageUi.cardSolid} overflow-hidden shadow-xl`}>
          <div className="border-b border-[#E6E3C5] bg-gradient-to-r from-[#2B2A22] to-[#3D3C32] px-8 py-6 text-center text-[#FAFAF5]">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#A39E75]/20 ring-1 ring-[#A39E75]/40">
              <Stethoscope className="h-7 w-7 text-[#C7C39E]" aria-hidden />
            </div>
            <h1 className="text-xl font-black tracking-tight">Nexora Doctor</h1>
            <p className="mt-1 text-sm text-[#C7C39E]">Development workstation</p>
          </div>

          <div className="p-8">
            <div className="mb-6 text-center">
              <h2 className="text-lg font-bold text-[#2B2A22]">Sign in</h2>
              <p className="mt-1 text-sm text-[#5C5A4E]">Use a demo account or enter credentials below.</p>
            </div>

            {errors.form && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
                {errors.form}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-[#2B2A22]">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors((p) => ({ ...p, email: undefined }));
                  }}
                  className={`${sageUi.input} mt-1 ${errors.email ? 'border-red-400' : ''}`}
                  placeholder="doctor@nexora.com"
                  disabled={loading}
                />
                {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-[#2B2A22]">
                  Password
                </label>
                <div className="relative mt-1">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errors.password) setErrors((p) => ({ ...p, password: undefined }));
                    }}
                    className={`${sageUi.input} pr-10 ${errors.password ? 'border-red-400' : ''}`}
                    placeholder="Enter password"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5C5A4E] hover:text-[#2B2A22]"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
              </div>

              <label className="flex cursor-pointer items-center gap-2 text-sm text-[#5C5A4E]">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="accent-[#A39E75]"
                  disabled={loading}
                />
                Remember me
              </label>

              <button
                type="submit"
                disabled={loading}
                className={`${sageUi.btnPrimary} flex w-full items-center justify-center gap-2 py-2.5 disabled:opacity-70`}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    Signing in…
                  </>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            <div className="mt-8 border-t border-[#E6E3C5] pt-6">
              <p className="mb-3 text-center text-xs font-bold uppercase tracking-wider text-[#5C5A4E]">
                Development Demo Accounts
              </p>
              <ul className="space-y-2">
                {DEV_DEMO_ACCOUNT_LABELS.map(({ key, label, account }) => (
                  <li key={key}>
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => useDemoAccount(account.email, account.password)}
                      className="flex w-full items-center justify-between rounded-xl border border-[#E6E3C5] bg-[#FAFAF5] px-3 py-2.5 text-left text-sm transition hover:border-[#A39E75]/50 hover:bg-[#F7F6E8] disabled:opacity-60"
                    >
                      <span>
                        <span className="font-bold text-[#2B2A22]">{label}</span>
                        <span className="mt-0.5 block text-xs text-[#5C5A4E]">{account.email}</span>
                      </span>
                      <span className="flex shrink-0 items-center gap-1 text-xs font-bold text-[#A39E75]">
                        <UserRound className="h-3.5 w-3.5" aria-hidden />
                        Use Demo Account
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
