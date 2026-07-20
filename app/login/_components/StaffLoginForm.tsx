'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

import { useAuth } from '../../context/AuthProvider';
import { APP_ROUTES } from '../../lib/routes';
import {
  completeStaffLogin,
  initiateStaffLogin,
  resendMfaChallenge,
  resolvePostLoginRoute,
  verifyStaffMfa,
} from '../../lib/auth/authService';
import type { HospitalStaffProfile } from '../../lib/auth/hospital/types';
import AuthLoginShell, {
  AuthAlert,
  AuthField,
  AuthPrimaryButton,
} from './AuthLoginShell';
import MfaOtpVerification from './MfaOtpVerification';

type LoginStep = 'credentials' | 'mfa';

export default function StaffLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setSession } = useAuth();

  const [step, setStep] = useState<LoginStep>('credentials');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingEmployeeId, setPendingEmployeeId] = useState('');
  const [pendingProfile, setPendingProfile] = useState<HospitalStaffProfile | null>(null);

  const reason = searchParams.get('reason');
  const redirect = searchParams.get('redirect');

  const bannerMessage =
    reason === 'inactivity' || reason === 'idle_timeout'
      ? 'Session terminated due to inactivity. Re-authenticate to continue.'
      : reason === 'expired'
        ? 'Your secure session has expired.'
        : reason === 'manual'
          ? 'You have been signed out.'
          : null;

  const finishLogin = (profile: HospitalStaffProfile, destination?: string) => {
    setSession(profile);
    router.push(destination ?? redirect ?? resolvePostLoginRoute(profile.role));
  };

  const handleCredentialsSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const email = identifier.trim().toLowerCase();
    const isDevMockBypass =
      email === 'hospital@curasync.com' && password === '123456';

    if (isDevMockBypass) {
      const now = new Date().toISOString();
      const mockProfile: HospitalStaffProfile = {
        userId: 'USR-DEV-ADMIN',
        employeeId: 'EMP-DEV-001',
        email: 'hospital@curasync.com',
        displayName: 'Dr. Aishwarya D S',
        role: 'hospital_admin',
        department: 'Clinical Operations',
        shiftLabel: 'Doctor Console',
        permissions: ['*'],
        authMethod: 'password',
        issuedAtUtc: now,
        lastActivityAtUtc: now,
        mfaPending: false,
      };

      const completed = await completeStaffLogin(mockProfile);
      setLoading(false);

      if (!completed.ok) {
        setError(completed.error);
        return;
      }

      finishLogin(mockProfile, APP_ROUTES.hospitalDashboard);
      return;
    }

    const result = await initiateStaffLogin(identifier, password);
    setLoading(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    if (result.requiresMfa) {
      setPendingEmployeeId(result.employeeId);
      setPendingProfile(result.profile);
      setStep('mfa');
      return;
    }

    const completed = await completeStaffLogin(result.profile);
    if (!completed.ok) {
      setError(completed.error);
      return;
    }

    finishLogin(result.profile);
  };

  const handleMfaVerify = async (code: string) => {
    setLoading(true);
    setError(null);

    const result = await verifyStaffMfa(code);
    setLoading(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    if (!pendingProfile) {
      setError('Authentication state lost. Sign in again.');
      setStep('credentials');
      return;
    }

    const completed = await completeStaffLogin(pendingProfile);
    if (!completed.ok) {
      setError(completed.error);
      return;
    }

    finishLogin(pendingProfile);
  };

  const handleMfaResend = () => {
    if (pendingEmployeeId) {
      resendMfaChallenge(pendingEmployeeId);
    }
  };

  if (step === 'mfa') {
    return (
      <MfaOtpVerification
        employeeId={pendingEmployeeId}
        onVerified={handleMfaVerify}
        onCancel={() => {
          setStep('credentials');
          setError(null);
          setPendingProfile(null);
        }}
        onResend={handleMfaResend}
        loading={loading}
        error={error}
      />
    );
  }

  return (
    <AuthLoginShell
      title="Clinical Staff Sign-In"
      subtitle="Enter credentials to access the Nexora Doctor workspace."
    >
      <form onSubmit={handleCredentialsSubmit} className="space-y-4">
        {bannerMessage && <AuthAlert tone="info" message={bannerMessage} />}
        {error && <AuthAlert tone="error" message={error} />}

        <AuthField
          id="staff-identifier"
          label="Employee ID / Email"
          value={identifier}
          onChange={setIdentifier}
          placeholder="hospital@curasync.com"
          autoComplete="username"
        />

        <AuthField
          id="staff-password"
          label="Password"
          type="password"
          value={password}
          onChange={setPassword}
          placeholder="••••••••••"
          autoComplete="current-password"
        />

        <div className="flex items-center justify-between pt-1">
          <Link
            href={APP_ROUTES.loginForgotPassword}
            className="text-xs font-semibold text-teal-800 hover:text-teal-950 hover:underline"
          >
            Forgot Password?
          </Link>
          <span className="font-mono text-[10px] uppercase tracking-wider text-slate-400">
            Sandbox
          </span>
        </div>

        <AuthPrimaryButton loading={loading}>Sign In</AuthPrimaryButton>
      </form>
    </AuthLoginShell>
  );
}
