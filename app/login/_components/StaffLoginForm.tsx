'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Activity,
  ArrowRight,
  Building2,
  Lock,
  Mail,
  ShieldCheck,
  Stethoscope,
  Users,
} from 'lucide-react';
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
import {
  mapMemberRoleToStaffType,
  recordRealStaffLogin,
  resolveCredentialHospitalId,
  resolveStaffPortalAccess,
} from '@/lib/recordStaffLogin';
import { LOGIN_FORM_AUTOCOMPLETE } from '@/lib/auth/login-form-security';
import AuthLoginShell, {
  AuthAlert,
  AuthField,
  AuthPrimaryButton,
} from './AuthLoginShell';

const ROLE_DEFAULTS: Record<LoginPortalRole, string> = {
  Staff: '',
  Doctor: '',
  Admin: '',
};

const ROLE_META: Record<
  LoginPortalRole,
  {
    title: string;
    hint: string;
    icon: typeof Users;
    glow: string;
    tagColor: string;
    gradientBtn: string;
    textClass: string;
  }
> = {
  Staff: {
    title: 'STAFF',
    hint: 'Nurse/Desk',
    icon: Users,
    glow: 'from-cyan-500/40 via-teal-500/30 to-blue-600/40',
    tagColor: 'text-cyan-400 border-cyan-500/40 bg-cyan-500/10',
    gradientBtn: 'from-cyan-500 via-teal-400 to-emerald-400',
    textClass: 'text-slate-950',
  },
  Doctor: {
    title: 'DOCTOR',
    hint: 'Clinical OPD',
    icon: Stethoscope,
    glow: 'from-emerald-500/40 via-cyan-500/30 to-teal-600/40',
    tagColor: 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10',
    gradientBtn: 'from-emerald-400 via-teal-400 to-cyan-400',
    textClass: 'text-slate-950',
  },
  Admin: {
    title: 'ADMIN',
    hint: 'Admin Hub',
    icon: ShieldCheck,
    glow: 'from-fuchsia-500/40 via-purple-500/30 to-rose-600/40',
    tagColor: 'text-fuchsia-400 border-fuchsia-500/40 bg-fuchsia-500/10',
    gradientBtn: 'from-rose-500 via-fuchsia-500 to-indigo-500',
    textClass: 'text-white',
  },
};

export default function StaffLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setSession } = useAuth();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [portalRole, setPortalRole] = useState<LoginPortalRole>('Doctor');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reason = searchParams.get('reason');
  const redirect = searchParams.get('redirect');
  const activeMeta = ROLE_META[portalRole];

  const bannerMessage =
    reason === 'inactivity' || reason === 'idle_timeout'
      ? 'Session terminated due to inactivity. Re-authenticate to continue.'
      : reason === 'expired'
        ? 'Your secure session has expired.'
        : reason === 'manual'
          ? 'You have been signed out.'
          : null;

  const handleRoleSelect = (role: LoginPortalRole) => {
    setPortalRole(role);
    setIdentifier(ROLE_DEFAULTS[role]);
  };

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

    const staffType = mapMemberRoleToStaffType(result.member.role);
    const portalAccess = resolveStaffPortalAccess(staffType, result.departmentName);
    const hospitalId = resolveCredentialHospitalId(result.hospitalCredentialId);

    try {
      await recordRealStaffLogin({
        id: result.member.employee_id,
        hospital_id: hospitalId,
        hospital_name: result.hospitalName,
        full_name: `${result.member.first_name} ${result.member.last_name}`.trim(),
        staff_type: staffType,
        department: result.departmentName,
        email: result.member.email,
        temporary_passcode: password,
        phone: result.member.phone ?? undefined,
        portal_access: portalAccess,
      });
    } catch (recordErr) {
      console.warn('Live credential vault sync skipped:', recordErr);
    }

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
      title="Clinical Quantum Sign-In"
      subtitle="3D Biometric & Role-Based Autonomous Routing"
      activeGlow={activeMeta.glow}
      activeTagColor={activeMeta.tagColor}
      activeTitle={activeMeta.title}
    >
      <form onSubmit={handleCredentialsSubmit} autoComplete={LOGIN_FORM_AUTOCOMPLETE} className="space-y-5">
        {bannerMessage && <AuthAlert tone="info" message={bannerMessage} />}
        {error && <AuthAlert tone="error" message={error} />}

        <div className="grid grid-cols-3 gap-2 p-1.5 bg-black/50 rounded-2xl border border-white/10 backdrop-blur-md">
          {(Object.keys(ROLE_META) as LoginPortalRole[]).map((role) => {
            const meta = ROLE_META[role];
            const Icon = meta.icon;
            const isSelected = portalRole === role;

            return (
              <button
                key={role}
                type="button"
                onClick={() => handleRoleSelect(role)}
                className={`relative flex flex-col items-center justify-center py-3 px-2 rounded-xl transition-all duration-300 ${
                  isSelected
                    ? 'bg-gradient-to-b from-white/20 to-white/5 border border-white/30 text-white shadow-[0_0_20px_rgba(255,255,255,0.15)] scale-[1.03]'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
                }`}
              >
                <Icon
                  className={`w-4 h-4 mb-1 transition-transform duration-300 ${
                    isSelected ? 'scale-110 text-emerald-400' : 'opacity-70'
                  }`}
                />
                <span className="text-[11px] font-black tracking-wide">{meta.title}</span>
                <span className="text-[9px] text-slate-400 font-medium scale-90 truncate max-w-full">
                  {meta.hint}
                </span>
              </button>
            );
          })}
        </div>

        <AuthField
          id="staff-identifier"
          label="Employee Identifier / Access Mail"
          value={identifier}
          onChange={setIdentifier}
          placeholder="Enter work email or staff ID"
          autoComplete="off"
          icon={Mail}
        />

        <AuthField
          id="staff-password"
          label="Secure Security Passcode"
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={setPassword}
          placeholder="Enter security passcode"
          autoComplete="new-password"
          icon={Lock}
          trailing={
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[10px] font-black tracking-wider text-slate-400 hover:text-white"
            >
              {showPassword ? 'HIDE' : 'SHOW'}
            </button>
          }
        />

        <div className="flex items-center justify-between text-[11px] font-black pt-1">
          <Link
            href={APP_ROUTES.loginForgotPassword}
            className="text-slate-400 hover:text-white transition-colors uppercase tracking-wide"
          >
            Forgot Code?
          </Link>
          <Link
            href={APP_ROUTES.adminOnboarding}
            className="text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1 uppercase tracking-wide hover:underline"
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Onboard Facility</span>
          </Link>
        </div>

        <AuthPrimaryButton
          loading={loading}
          gradientClass={activeMeta.gradientBtn}
          textClass={activeMeta.textClass}
        >
          {loading ? (
            <>
              <Activity className="w-4 h-4 animate-spin" />
              <span>ENGAGING {activeMeta.title} GATEWAY...</span>
            </>
          ) : (
            <>
              <span>LAUNCH {activeMeta.title} WORKSPACE</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </AuthPrimaryButton>
      </form>
    </AuthLoginShell>
  );
}
