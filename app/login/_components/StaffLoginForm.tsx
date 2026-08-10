'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

import { useAuth } from '../../context/AuthProvider';
import { APP_ROUTES } from '../../lib/routes';
import { completeStaffLogin } from '../../lib/auth/authService';
import type { HospitalStaffProfile } from '../../lib/auth/hospital/types';
import {
  authenticateHospitalMember,
  resolveMemberPostLoginRoute,
} from '@/lib/auth/hospital/member-auth';
import type { LoginPortalRole } from '@/lib/auth/hospital/member-types';
import AuthLoginShell, {
  AuthAlert,
  AuthField,
  AuthPrimaryButton,
} from './AuthLoginShell';

const PORTAL_ROLES: { value: LoginPortalRole; label: string; hint: string }[] = [
  { value: 'Staff', label: 'Staff', hint: 'Nurse · Reception · Billing · Pharmacy' },
  { value: 'Doctor', label: 'Doctor', hint: 'Clinical workspace' },
  { value: 'Admin', label: 'Admin', hint: 'Hospital administration' },
];

export default function StaffLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setSession } = useAuth();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [portalRole, setPortalRole] = useState<LoginPortalRole>('Staff');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const finishLogin = (profile: HospitalStaffProfile, destination: string) => {
    setSession(profile);
    toast.success('Signed in successfully', {
      description: `Redirecting to ${profile.shiftLabel}.`,
    });
    router.push(destination ?? redirect ?? APP_ROUTES.dashboard);
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
        shiftLabel: 'Hospital Operations',
        permissions: ['*'],
        authMethod: 'password',
        issuedAtUtc: now,
        lastActivityAtUtc: now,
        mfaPending: false,
      };

      const completed = await completeStaffLogin(mockProfile);
      setLoading(false);

      if (completed.ok === false) {
        setError(completed.error);
        toast.error('Sign-in failed', { description: completed.error });
        return;
      }

      const destination =
        portalRole === 'Doctor'
          ? '/doctor/dashboard'
          : redirect ?? APP_ROUTES.dashboard;
      finishLogin(mockProfile, destination);
      return;
    }

    const result = await authenticateHospitalMember(identifier, password, portalRole);
    setLoading(false);

    if (result.ok === false) {
      setError(result.error);
      if (result.code === 'suspended') {
        toast.error('Account suspended', { description: result.error });
      } else if (result.code === 'no_hospital') {
        toast.error('Hospital not configured', { description: result.error });
      } else if (result.code === 'role_mismatch') {
        toast.warning('Role mismatch', { description: result.error });
      } else {
        toast.error('Invalid credentials', { description: result.error });
      }
      return;
    }

    const profile: HospitalStaffProfile = {
      ...result.staffSession,
      mfaPending: false,
    };

    const completed = await completeStaffLogin(profile);
    if (completed.ok === false) {
      setError(completed.error);
      toast.error('Sign-in failed', { description: completed.error });
      return;
    }

    finishLogin(profile, resolveMemberPostLoginRoute(result.member.role));
  };

  return (
    <AuthLoginShell
      title="Unified Role-Based Sign-In"
      subtitle="Authenticate with your hospital-issued credentials. Access is routed by role."
    >
      <form onSubmit={handleCredentialsSubmit} className="space-y-5">
        {bannerMessage && <AuthAlert tone="info" message={bannerMessage} />}
        {error && <AuthAlert tone="error" message={error} />}

        <fieldset className="space-y-2">
          <legend className="text-base font-medium text-slate-800">Sign in as</legend>
          <div className="grid grid-cols-3 gap-2">
            {PORTAL_ROLES.map((option) => {
              const active = portalRole === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setPortalRole(option.value)}
                  className={`rounded-xl border px-2 py-3 text-center transition ${
                    active
                      ? 'border-teal-700 bg-teal-50 ring-2 ring-teal-600/20'
                      : 'border-slate-200 bg-slate-50 hover:border-teal-300'
                  }`}
                >
                  <span className="block text-sm font-bold uppercase tracking-wider text-slate-900">
                    {option.label}
                  </span>
                  <span className="mt-1 block text-[11px] font-medium leading-tight text-slate-600">
                    {option.hint}
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>

        <AuthField
          id="staff-identifier"
          label="Email / Employee ID"
          value={identifier}
          onChange={setIdentifier}
          placeholder="you@hospital.org or EMP-1001"
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
            className="text-sm font-bold uppercase tracking-wider text-teal-800 hover:text-teal-950 hover:underline"
          >
            Forgot Password?
          </Link>
          <Link
            href={APP_ROUTES.adminOnboarding}
            className="text-sm font-bold uppercase tracking-wider text-slate-500 hover:text-slate-800"
          >
            Onboard Hospital
          </Link>
        </div>

        <AuthPrimaryButton loading={loading}>Sign In</AuthPrimaryButton>
      </form>
    </AuthLoginShell>
  );
}
