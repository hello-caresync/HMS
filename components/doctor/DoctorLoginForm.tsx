'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight, Eye, EyeOff, KeyRound, Loader2, Stethoscope } from 'lucide-react';
import { toast } from 'sonner';

import {
  LOGIN_FORM_AUTOCOMPLETE,
  LOGIN_IDENTIFIER_INPUT_PROPS,
  LOGIN_PASSWORD_INPUT_PROPS,
} from '@/lib/auth/login-form-security';
import { authenticateDoctorCredential } from '@/lib/auth/doctorAuth';
import { saveDoctorSession } from '@/lib/doctor/session';
import { supabase } from '@/lib/supabase';

type DoctorLoginFormProps = {
  redirectTo?: string;
};

export function DoctorLoginForm({ redirectTo = '/doctor/dashboard' }: DoctorLoginFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [identifier, setIdentifier] = useState('');
  const [passcode, setPasscode] = useState('');
  const [showPasscode, setShowPasscode] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    const rawIdentifier = identifier.trim();
    const cleanPasscode = passcode.trim().toUpperCase();

    try {
      const result = await authenticateDoctorCredential(supabase, rawIdentifier, cleanPasscode);

      if (!result.ok) {
        setErrorMessage(result.error);
        toast.error(result.error);
        return;
      }

      saveDoctorSession(result.doctor);

      localStorage.setItem('doctor_session', JSON.stringify(result.portalSession));
      sessionStorage.setItem('current_doctor', JSON.stringify(result.portalSession));
      document.cookie = 'curasync_session_role=doctor; path=/; max-age=86400; SameSite=Lax';

      toast.success(`Welcome, ${result.doctor.doctorName}!`);

      const destination =
        searchParams.get('redirect')?.startsWith('/doctor') ?
          searchParams.get('redirect')!
        : redirectTo;

      router.push(destination);
    } catch (err: unknown) {
      console.error('Doctor login failed:', err);
      const message =
        err instanceof Error ?
          err.message
        : 'Clinician registry lookup failed. Check your network and try again.';
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {errorMessage && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-semibold text-rose-700">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-rose-600" />
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleLogin} autoComplete={LOGIN_FORM_AUTOCOMPLETE} className="space-y-4">
        <div className="space-y-1.5">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700">
            Doctor ID or Hospital Email
          </label>
          <div className="relative">
            <Stethoscope className="pointer-events-none absolute top-3.5 left-3.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              required
              name="doctor-portal-identifier"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="Doctor ID or hospital email"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pr-4 pl-10 text-sm font-medium text-slate-900 transition focus:border-teal-600 focus:bg-white focus:outline-none"
              {...LOGIN_IDENTIFIER_INPUT_PROPS}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700">
            Security Passcode
          </label>
          <div className="relative">
            <KeyRound className="pointer-events-none absolute top-3.5 left-3.5 h-4 w-4 text-slate-400" />
            <input
              type={showPasscode ? 'text' : 'password'}
              required
              name="doctor-portal-passcode"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              placeholder="Assigned clinician passcode"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pr-10 pl-10 font-mono text-sm font-bold text-slate-900 transition focus:border-teal-600 focus:bg-white focus:outline-none"
              {...LOGIN_PASSWORD_INPUT_PROPS}
            />
            <button
              type="button"
              onClick={() => setShowPasscode(!showPasscode)}
              className="absolute top-3 right-3.5 text-slate-400 transition hover:text-slate-600"
            >
              {showPasscode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-teal-700 py-3.5 text-xs font-bold uppercase tracking-wider text-white shadow-md shadow-teal-900/20 transition hover:bg-teal-800 active:scale-[0.99] disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Verifying clinician registry...
            </>
          ) : (
            <>
              Enter Doctor Workspace
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </form>
    </>
  );
}
