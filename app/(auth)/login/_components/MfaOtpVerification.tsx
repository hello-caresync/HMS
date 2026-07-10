'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { KeyRound, RefreshCw } from 'lucide-react';

import { MFA_DEMO_CODE, MFA_RESEND_COOLDOWN_SEC } from '../../../lib/security';
import AuthLoginShell, {
  AuthAlert,
  AuthField,
  AuthPrimaryButton,
} from './AuthLoginShell';

type MfaOtpVerificationProps = {
  employeeId: string;
  onVerified: (code: string) => void;
  onCancel: () => void;
  onResend: () => void;
  loading?: boolean;
  error?: string | null;
};

export default function MfaOtpVerification({
  employeeId,
  onVerified,
  onCancel,
  onResend,
  loading = false,
  error,
}: MfaOtpVerificationProps) {
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [resendSeconds, setResendSeconds] = useState(MFA_RESEND_COOLDOWN_SEC);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (resendSeconds <= 0) return;
    const timer = window.setInterval(() => {
      setResendSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [resendSeconds]);

  const handleDigitChange = (index: number, value: string) => {
    const normalized = value.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[index] = normalized;
    setDigits(next);

    if (normalized && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, key: string) => {
    if (key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (event: React.ClipboardEvent) => {
    event.preventDefault();
    const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;

    const next = pasted.split('').concat(Array(6).fill('')).slice(0, 6);
    setDigits(next);
    inputRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onVerified(digits.join(''));
  };

  const handleResend = useCallback(() => {
    if (resendSeconds > 0) return;
    setResendSeconds(MFA_RESEND_COOLDOWN_SEC);
    setDigits(['', '', '', '', '', '']);
    onResend();
    inputRefs.current[0]?.focus();
  }, [onResend, resendSeconds]);

  const codeComplete = digits.every((d) => d.length === 1);

  return (
    <AuthLoginShell
      title="OTP Verification"
      subtitle={`Multi-factor authentication required for ${employeeId}. Enter the 6-digit code sent to your registered device.`}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && <AuthAlert tone="error" message={error} />}

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-200">
            <KeyRound className="h-3.5 w-3.5" />
            Verification Code
          </div>

          <div className="flex justify-between gap-2" onPaste={handlePaste}>
            {digits.map((digit, index) => (
              <input
                key={index}
                ref={(el) => {
                  inputRefs.current[index] = el;
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleDigitChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e.key)}
                aria-label={`Digit ${index + 1}`}
                className="h-12 w-10 rounded-lg border border-slate-200 bg-white text-center font-mono text-lg font-bold text-slate-900 outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100 sm:h-14 sm:w-12"
              />
            ))}
          </div>

          <p className="mt-3 text-center text-[11px] text-slate-200">
            Simulation code: <span className="font-mono font-bold text-slate-200">{MFA_DEMO_CODE}</span>
          </p>
        </div>

        <div className="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-3 text-center">
          {resendSeconds > 0 ? (
            <p className="text-xs text-slate-200">
              Resend code in{' '}
              <span className="font-mono font-bold tabular-nums text-slate-200">
                {String(Math.floor(resendSeconds / 60)).padStart(2, '0')}:
                {String(resendSeconds % 60).padStart(2, '0')}
              </span>
            </p>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-700 hover:text-sky-900"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Resend verification code
            </button>
          )}
        </div>

        <AuthPrimaryButton loading={loading} disabled={!codeComplete}>
          Verify &amp; Continue
        </AuthPrimaryButton>

        <button
          type="button"
          onClick={onCancel}
          className="w-full text-xs font-semibold text-slate-200 hover:text-slate-800"
        >
          Cancel and return to sign in
        </button>
      </form>
    </AuthLoginShell>
  );
}
