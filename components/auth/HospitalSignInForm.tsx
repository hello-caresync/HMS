'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight, Eye, EyeOff, KeyRound, Loader2, UserRound } from 'lucide-react';
import { toast } from 'sonner';

import {
  LOGIN_FORM_AUTOCOMPLETE,
  LOGIN_IDENTIFIER_INPUT_PROPS,
  LOGIN_PASSWORD_INPUT_PROPS,
} from '@/lib/auth/login-form-security';
import {
  ADMIN_PROVISIONING_PATH,
  persistActiveSession,
  type ActiveStaffSession,
} from '@/lib/auth/active-session';
import { persistStaffPortalSession } from '@/lib/auth/ecosystem-sessions';
import { authenticateHospitalUser } from '@/lib/auth/hospitalAuth';
import { isHospitalSetupCompleted } from '@/lib/auth/admin-setup';
import { recordRealStaffLogin, type AuthenticatedUserPayload } from '@/lib/recordStaffLogin';
import { saveDoctorSession } from '@/lib/doctor/session';
import { resolveLoginRedirect } from '@/lib/auth/safe-redirect';
import { supabase } from '@/lib/supabase';

type HospitalSignInFormProps = {
  onError?: (message: string) => void;
};

export function HospitalSignInForm({ onError }: HospitalSignInFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [identifier, setIdentifier] = useState('');
  const [passcode, setPasscode] = useState('');
  const [showPasscode, setShowPasscode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSignIn = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      const result = await authenticateHospitalUser(supabase, identifier, passcode);
      if (!result.ok) {
        setErrorMessage(result.error);
        onError?.(result.error);
        return;
      }

      const user = result.user;

      void recordRealStaffLogin({
        id: user.id,
        hospital_id: user.hospital_id,
        hospital_name: user.hospital_name,
        full_name: user.full_name,
        staff_type: user.staff_type as AuthenticatedUserPayload['staff_type'],
        department: user.department,
        email: user.email,
        temporary_passcode: passcode.trim(),
        phone: user.phone,
        portal_access: '/dashboard',
      });

      localStorage.setItem(
        'curasync_session',
        JSON.stringify({
          id: user.id,
          email: user.email,
          fullName: user.full_name,
          role: user.role,
          hospitalId: user.hospital_id,
          employeeId: user.employee_id,
        }),
      );

      if (user.role === 'doctor') {
        saveDoctorSession({
          doctorId: user.id,
          doctorName: user.full_name,
          employeeId: user.employee_id || user.id,
          fullName: user.full_name,
          department: user.department,
          specialization: user.department,
          email: user.email,
          hospitalCode: user.hospital_id,
          portalRoute: '/doctor/dashboard',
        });
        toast.success(`Welcome back, ${user.full_name}!`);
        router.refresh();
        router.push(
          resolveLoginRedirect(searchParams.get('redirect'), '/doctor/dashboard', ['/doctor']),
        );
        return;
      }

      const session: ActiveStaffSession = {
        id: user.id,
        hospital_id: user.hospital_id,
        hospital_name: user.hospital_name,
        full_name: user.full_name,
        staff_type: user.staff_type,
        department: user.department,
        email: user.email,
        portal_access: '/dashboard',
      };

      persistActiveSession(session);
      persistStaffPortalSession({
        id: session.id,
        hospital_id: session.hospital_id,
        hospital_name: session.hospital_name,
        full_name: session.full_name,
        staff_type: session.staff_type,
        department: session.department,
        email: session.email,
        portal_access: session.portal_access,
      });

      if (user.role === 'admin') {
        localStorage.setItem('curasync_admin_role', 'admin');
        localStorage.setItem('admin_authenticated', 'true');
        localStorage.setItem('hospital_id', user.hospital_id);
      }

      document.cookie = `curasync_session_role=${encodeURIComponent(user.staff_type)}; path=/; max-age=86400; SameSite=Lax`;

      toast.success(`Welcome back, ${user.full_name}!`);

      if (user.role === 'admin') {
        const setupDone = await isHospitalSetupCompleted(user.hospital_id);
        router.refresh();
        router.push(
          resolveLoginRedirect(
            searchParams.get('redirect'),
            setupDone ? '/hospital' : ADMIN_PROVISIONING_PATH,
            ['/hospital', '/dashboard', '/staff'],
          ),
        );
        return;
      }

      router.refresh();
      router.push(
        resolveLoginRedirect(searchParams.get('redirect'), '/hospital', [
          '/hospital',
          '/dashboard',
          '/staff',
        ]),
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Authentication failed. Please contact your administrator.';
      setErrorMessage(message);
      onError?.(message);
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

      <form onSubmit={handleSignIn} autoComplete={LOGIN_FORM_AUTOCOMPLETE} className="space-y-4">
        <div className="space-y-1.5">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700">
            Employee ID or Email
          </label>
          <div className="relative">
            <UserRound className="pointer-events-none absolute top-3.5 left-3.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              required
              name="hospital-portal-identifier"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="Employee ID or work email"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pr-4 pl-10 text-sm font-medium text-slate-900 transition focus:border-cyan-600 focus:bg-white focus:outline-none"
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
              name="hospital-portal-passcode"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              placeholder="Assigned login PIN / passcode"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pr-10 pl-10 font-mono text-sm font-bold text-slate-900 transition focus:border-cyan-600 focus:bg-white focus:outline-none"
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
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-cyan-700 py-3.5 text-xs font-bold uppercase tracking-wider text-white shadow-md shadow-cyan-900/20 transition hover:bg-cyan-800 active:scale-[0.99] disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Authenticating...
            </>
          ) : (
            <>
              Enter Hospital Workspace
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </form>
    </>
  );
}
