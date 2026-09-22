'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  LOGIN_FORM_AUTOCOMPLETE,
  LOGIN_IDENTIFIER_INPUT_PROPS,
  LOGIN_PASSWORD_INPUT_PROPS,
} from '@/lib/auth/login-form-security';
import { persistActiveSession, type ActiveStaffSession } from '@/lib/auth/active-session';
import { DOCTOR_LOGIN_INVALID_MESSAGE } from '@/lib/auth/doctorAuth';
import { buildHospitalStaffSessionCookie } from '@/lib/auth/hospital-staff-login';
import { HOSPITAL_DESK_DASHBOARD_PATH } from '@/lib/auth/hospital-desk-session';
import type { HospitalAuthUser } from '@/lib/auth/hospitalAuth';
import { saveDoctorSession } from '@/lib/doctor/session';
import {
  recordRealStaffLogin,
  resolveCredentialHospitalId,
  resolveCredentialHospitalName,
} from '@/lib/recordStaffLogin';
import { resolveLoginRedirect } from '@/lib/auth/safe-redirect';
import { getSupabaseConfigStatus } from '@/lib/supabase/client';
import { RegalHospitalLogo } from '@/components/common/RegalHospitalLogo';
import {
  AlertCircle,
  ArrowRight,
  Building2,
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
} from 'lucide-react';

export default function DoctorLoginPortal() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const postLoginPath = resolveLoginRedirect(
    searchParams.get('redirect'),
    '/doctor/dashboard',
    ['/doctor'],
  );

  const [identifier, setIdentifier] = useState('');
  const [passcode, setPasscode] = useState('');
  const [showPasscode, setShowPasscode] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    try {
      const cleanInput = identifier.trim();
      const cleanPasscode = passcode.trim();

      if (!cleanInput || !cleanPasscode) {
        setErrorMessage('Enter your hospital-issued Doctor ID and security PIN.');
        return;
      }

      const config = getSupabaseConfigStatus();
      if (!config.ok) {
        setErrorMessage('Clinician authentication service is not configured.');
        return;
      }

      const loginResponse = await fetch('/api/doctor/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ identifier: cleanInput, passcode: cleanPasscode }),
      });

      const loginPayload = (await loginResponse.json()) as {
        success?: boolean;
        kind?: 'doctor' | 'admin';
        error?: string;
        redirectTo?: string;
        doctor?: {
          doctorId: string;
          doctorUuid?: string;
          employeeId?: string;
          doctorName: string;
          fullName?: string;
          email?: string;
          department?: string;
          hospitalCode?: string;
          portalRoute?: string;
        };
        portalSession?: {
          doctorId: string;
          doctorName: string;
          email?: string;
          department: string;
          hospitalId: string;
          doctorCode: string;
          employeeId: string;
          fullName: string;
          portalRoute: string;
        };
        user?: HospitalAuthUser;
      };

      if (!loginResponse.ok || !loginPayload.success) {
        setErrorMessage(loginPayload.error || DOCTOR_LOGIN_INVALID_MESSAGE);
        return;
      }

      if (loginPayload.kind === 'admin' && loginPayload.user) {
        const user = loginPayload.user;
        const session: ActiveStaffSession = {
          id: user.id,
          hospital_id: user.hospital_id,
          hospital_name: user.hospital_name,
          full_name: user.full_name,
          staff_type: user.staff_type,
          department: user.department,
          staff_id_code: user.employee_id,
          email: user.email,
          portal_access: HOSPITAL_DESK_DASHBOARD_PATH,
        };

        const deskCookie = buildHospitalStaffSessionCookie(user, HOSPITAL_DESK_DASHBOARD_PATH);
        const cookieAttrs = 'path=/; max-age=86400; SameSite=Lax';
        document.cookie = `hospital_session=${encodeURIComponent(JSON.stringify(deskCookie))}; ${cookieAttrs}`;
        document.cookie = `curasync_active_session=${encodeURIComponent(JSON.stringify(deskCookie))}; ${cookieAttrs}`;

        persistActiveSession(session);
        setLoginSuccess(true);
        router.refresh();
        router.replace(loginPayload.redirectTo ?? HOSPITAL_DESK_DASHBOARD_PATH);
        return;
      }

      const doctor = loginPayload.doctor;
      const portalSession = loginPayload.portalSession;
      if (!doctor) {
        setErrorMessage(DOCTOR_LOGIN_INVALID_MESSAGE);
        return;
      }

      const hospitalId = resolveCredentialHospitalId(doctor.hospitalCode);

      try {
        await recordRealStaffLogin({
          id: doctor.doctorUuid || doctor.doctorId,
          hospital_id: hospitalId,
          hospital_name: resolveCredentialHospitalName(hospitalId),
          full_name: doctor.doctorName,
          staff_type: 'Doctor',
          department: doctor.department ?? 'General Medicine',
          email: doctor.email ?? `${doctor.doctorId.toLowerCase()}@regalhospital.com`,
          temporary_passcode: cleanPasscode,
          portal_access: '/doctor/dashboard',
        });
      } catch (recordErr) {
        console.warn('Live credential vault sync skipped:', recordErr);
      }

      saveDoctorSession(
        {
          doctorId: doctor.doctorId,
          doctorUuid: doctor.doctorUuid,
          employeeId: doctor.employeeId || doctor.doctorId,
          doctorName: doctor.doctorName,
          fullName: doctor.fullName || doctor.doctorName,
          email: doctor.email,
          department: doctor.department,
          hospitalCode: doctor.hospitalCode,
          portalRoute: '/doctor/dashboard',
        },
        rememberMe,
      );

      localStorage.setItem(
        'doctor_session',
        JSON.stringify(
          portalSession ?? {
            doctorId: doctor.doctorUuid || doctor.doctorId,
            doctorCode: doctor.employeeId || doctor.doctorId,
            employeeId: doctor.employeeId || doctor.doctorId,
            doctorName: doctor.doctorName,
            fullName: doctor.fullName || doctor.doctorName,
            email: doctor.email,
            department: doctor.department,
            hospitalId: doctor.hospitalCode,
            portalRoute: '/doctor/dashboard',
          },
        ),
      );

      setLoginSuccess(true);
      router.refresh();
      router.replace(
        resolveLoginRedirect(
          searchParams.get('redirect'),
          loginPayload.redirectTo ?? postLoginPath,
          ['/doctor'],
        ),
      );
    } catch (err) {
      console.error('Login error:', err);
      setErrorMessage('Authentication failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-slate-900/95 p-4 font-sans">
      <div className="w-full max-w-md rounded-3xl border border-slate-100 bg-white p-8 shadow-2xl">
        <div className="mb-8 flex flex-col items-center text-center">
          <RegalHospitalLogo heightClass="h-10" framed className="mb-5" />
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Clinician Login</h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-500">
            Enter your hospital-issued credentials to access your OPD desk.
          </p>
        </div>

        {errorMessage ? (
          <div className="mb-6 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span className="font-medium leading-relaxed">{errorMessage}</span>
          </div>
        ) : null}

        {loginSuccess ? (
          <div className="flex flex-col items-center gap-4 py-10 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <div>
              <p className="text-base font-bold text-slate-900">Identity Verified</p>
              <p className="mt-1 text-xs text-slate-500">Opening your workstation…</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleLogin} autoComplete={LOGIN_FORM_AUTOCOMPLETE} className="space-y-5">
            <div>
              <label
                htmlFor="doctor-portal-identifier"
                className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500"
              >
                Doctor ID / Email
              </label>
              <div className="group relative">
                <Building2 className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400 transition-colors group-focus-within:text-teal-600" />
                <input
                  id="doctor-portal-identifier"
                  type="text"
                  name="doctor-portal-identifier"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Doctor ID or hospital email"
                  required
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm font-medium text-slate-900 outline-none transition-all focus:border-teal-500 focus:bg-white focus:ring-2 focus:ring-teal-500/20"
                  {...LOGIN_IDENTIFIER_INPUT_PROPS}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="doctor-portal-passcode"
                className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500"
              >
                Security PIN
              </label>
              <div className="group relative">
                <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400 transition-colors group-focus-within:text-teal-600" />
                <input
                  id="doctor-portal-passcode"
                  type={showPasscode ? 'text' : 'password'}
                  name="doctor-portal-passcode"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  placeholder="Enter your security PIN"
                  required
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-11 text-sm font-medium text-slate-900 outline-none transition-all focus:border-teal-500 focus:bg-white focus:ring-2 focus:ring-teal-500/20"
                  {...LOGIN_PASSWORD_INPUT_PROPS}
                />
                <button
                  type="button"
                  onClick={() => setShowPasscode(!showPasscode)}
                  className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-700"
                  aria-label={showPasscode ? 'Hide PIN' : 'Show PIN'}
                >
                  {showPasscode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <label className="flex cursor-pointer select-none items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded accent-teal-600"
              />
              Remember this device
            </label>

            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-700 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-teal-800 active:scale-[0.99] disabled:opacity-60"
            >
              {isLoading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Verifying…
                </>
              ) : (
                <>
                  Unlock Workstation
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
