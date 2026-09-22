'use client';

import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import type { AuthError } from '@supabase/supabase-js';
import type { PostgrestSingleResponse } from '@supabase/postgrest-js';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  User,
} from 'lucide-react';
import { toast } from 'sonner';

import { RegalHospitalLogo } from '@/components/common/RegalHospitalLogo';
import {
  extractErrorMessage,
  isDisplayableAuthMessage,
  isServiceRestrictedError,
  resolveAuthUiError,
  runNetworkSafe,
  sanitizeAuthMessage,
  SERVICE_RESTRICTED_MESSAGE,
} from '@/lib/auth/parseAuthError';
import {
  establishPatientSessionAfterSignUp,
  PATIENT_AUTH_CONNECTION_MESSAGE,
  safeSignInWithPassword,
  safeSignUpPatient,
} from '@/lib/auth/patient-auth-request';
import { persistPatientAuthSession } from '@/lib/auth/patientAuth';
import { resolveLoginRedirect } from '@/lib/auth/safe-redirect';
import {
  fetchRegisteredHospitals,
  formatRegisteredHospitalLabel,
  profileBelongsToHospital,
  type RegisteredHospitalOption,
} from '@/lib/patient/registered-hospitals';
import { assertSupabaseConfigured, supabase } from '@/lib/supabase/client';

type AuthMode = 'signin' | 'register';

type PatientProfileRow = {
  id: string;
  role: string | null;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  hospital_id: string | null;
};

const INPUT_CLASS =
  'w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] py-2 px-3 text-[12px] font-medium text-[#361E10] placeholder:text-[#94A3B8] focus:border-[#9E6A4B]/40 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#9E6A4B]/15';
const LABEL_CLASS =
  'mb-1 block text-[10px] font-bold uppercase tracking-wider text-[#52331F]';

const SIGN_IN_DENIED_MESSAGE =
  'Access denied. This identifier is not provisioned or has been revoked by facility administration.';

const PHONE_MISMATCH_MESSAGE =
  'The entered phone number does not match registered records.';

const RBAC_DENIED_MESSAGE =
  'Access Denied: Clinicians and staff must use their designated portal.';

const DUPLICATE_EMAIL_MESSAGE =
  'An account with this email already exists. Please switch to Sign In.';

const FORGOT_PASSWORD_HINT =
  "Forgot password? Switch to 'Register New' to create an account with a new email address.";

const HOSPITAL_SELECTION_REQUIRED =
  'Please select a registered hospital to proceed.';

const HOSPITAL_MISMATCH_MESSAGE =
  'This account is not registered with the selected hospital. Choose the facility where you registered.';

function mintUhid(): string {
  return `NX-PAT-${Math.floor(1000 + Math.random() * 9000)}`;
}

function phoneDigits(value: string | null | undefined): string {
  return String(value ?? '')
    .replace(/\D/g, '')
    .slice(-10);
}

function formatPhone(digits: string): string {
  const clean = phoneDigits(digits);
  return clean ? `+91 ${clean}` : '';
}

function phonesMatch(stored: string | null | undefined, enteredDigits: string): boolean {
  const storedDigits = phoneDigits(stored);
  const entered = phoneDigits(enteredDigits);
  return storedDigits.length === 10 && entered.length === 10 && storedDigits === entered;
}

function normalizeRole(role: string | null | undefined): string {
  return String(role ?? '')
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, '_');
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isInvalidLoginCredentials(error: AuthError | null | undefined): boolean {
  if (!error) return false;

  const message = extractErrorMessage(error).toLowerCase();
  const code = String(
    Reflect.get(error, 'status') ?? Reflect.get(error, 'code') ?? '',
  ).toLowerCase();

  return message.includes('invalid login credentials') || code === '400';
}

function mapSupabaseAuthError(error: AuthError | null | undefined, context: AuthMode): string {
  const fallback =
    context === 'signin'
      ? SIGN_IN_DENIED_MESSAGE
      : 'Registration failed. Please try again.';

  if (!error) return fallback;

  if (isServiceRestrictedError(error)) {
    return SERVICE_RESTRICTED_MESSAGE;
  }

  if (context === 'signin' && isInvalidLoginCredentials(error)) {
    return SIGN_IN_DENIED_MESSAGE;
  }

  const message = extractErrorMessage(error);
  const lower = message.toLowerCase();

  if (
    lower.includes('user already registered') ||
    lower.includes('already been registered') ||
    lower.includes('already exists')
  ) {
    return DUPLICATE_EMAIL_MESSAGE;
  }

  if (lower.includes('password') && (lower.includes('short') || lower.includes('least'))) {
    return 'Password must be at least 6 characters long.';
  }

  if (lower.includes('valid email') || lower.includes('unable to validate email')) {
    return 'Enter a valid email address (for example, user@gmail.com).';
  }

  if (lower.includes('rate limit') || lower.includes('too many requests')) {
    return 'Too many attempts. Please wait a moment and try again.';
  }

  if (lower.includes('email not confirmed')) {
    return 'Please confirm your email address before signing in. Check your inbox for the verification link.';
  }

  if (
    lower.includes('database error') ||
    lower.includes('saving new user') ||
    lower.includes('trigger')
  ) {
    return 'Account provisioning failed on the server (profiles trigger). Plain signup was attempted — contact hospital IT if this persists.';
  }

  return sanitizeAuthMessage(message, fallback);
}

function PatientAuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const postLoginPath = resolveLoginRedirect(
    searchParams.get('redirect'),
    '/patient/dashboard',
    ['/patient'],
  );

  const [authMode, setAuthMode] = useState<AuthMode>('signin');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showForgotPasswordHint, setShowForgotPasswordHint] = useState(false);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [hospitals, setHospitals] = useState<RegisteredHospitalOption[]>([]);
  const [hospitalsLoading, setHospitalsLoading] = useState(true);
  const [hospitalsLoadNotice, setHospitalsLoadNotice] = useState<string | null>(null);
  const [selectedHospitalId, setSelectedHospitalId] = useState('');

  const selectedHospital = useMemo(
    () => hospitals.find((hospital) => hospital.id === selectedHospitalId) ?? null,
    [hospitals, selectedHospitalId],
  );

  const canSubmit = Boolean(selectedHospital) && !hospitalsLoading;
  const hospitalsFetchStartedRef = useRef(false);

  useEffect(() => {
    if (hospitalsFetchStartedRef.current) return;
    hospitalsFetchStartedRef.current = true;

    let cancelled = false;

    void (async () => {
      setHospitalsLoading(true);
      setHospitalsLoadNotice(null);

      try {
        assertSupabaseConfigured();
        const result = await fetchRegisteredHospitals(supabase);

        if (cancelled) return;

        setHospitals(result.hospitals);

        if (result.error && result.hospitals.length === 0) {
          setHospitalsLoadNotice(
            sanitizeAuthMessage(
              result.error,
              'Unable to load registered hospitals. Please try again shortly.',
            ),
          );
          setSelectedHospitalId('');
          return;
        }

        if (result.hospitals.length === 0) {
          setHospitalsLoadNotice('No registered hospitals found. Contact hospital administration.');
          setSelectedHospitalId('');
          return;
        }

        setSelectedHospitalId((current) =>
          current && result.hospitals.some((hospital) => hospital.id === current)
            ? current
            : result.hospitals[0].id,
        );
      } catch (err: unknown) {
        if (cancelled) return;
        setHospitals([]);
        setSelectedHospitalId('');
        setHospitalsLoadNotice(resolveAuthUiError(err, 'Unable to load registered hospitals.'));
      } finally {
        if (!cancelled) setHospitalsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const publishPatientAuthError = (err: unknown, fallback: string, credentialFailure = false) => {
    const message = sanitizeAuthMessage(resolveAuthUiError(err, fallback), fallback);
    if (message === SERVICE_RESTRICTED_MESSAGE && process.env.NODE_ENV === 'development') {
      console.warn('[patient-auth] Connectivity or quota restriction:', message);
    }
    setErrorMessage(message);
    setShowForgotPasswordHint(credentialFailure || message === SIGN_IN_DENIED_MESSAGE);
    toast.error(message);
  };

  const completePatientSession = (params: {
    patientId: string;
    fullName: string;
    email: string;
    phone: string;
    hospital: RegisteredHospitalOption;
    toastMessage?: string;
  }) => {
    persistPatientAuthSession({
      patientId: params.patientId,
      uhid: mintUhid(),
      email: params.email,
      name: params.fullName,
      hospitalId: params.hospital.id,
      hospitalName: params.hospital.name,
      phone: params.phone,
    });
    toast.success(params.toastMessage || 'Welcome to your patient portal.');
    router.refresh();
    router.push(postLoginPath);
  };

  const fetchPatientProfile = async (
    userId: string,
  ): Promise<
    | { ok: true; profile: PatientProfileRow }
    | { ok: false; error: string; signOutRequired: boolean }
  > => {
    const { data: profile, error: profileError } = await runNetworkSafe<
      PostgrestSingleResponse<PatientProfileRow>
    >(async () =>
      supabase
        .from('profiles')
        .select('id, role, full_name, email, phone, hospital_id')
        .eq('id', userId)
        .maybeSingle(),
    );

    if (profileError) {
      const message = extractErrorMessage(profileError).toLowerCase();
      if (
        message.includes('does not exist') ||
        message.includes('relation') ||
        message.includes('schema cache')
      ) {
        return {
          ok: false,
          signOutRequired: true,
          error: 'Patient profiles are not configured yet. Contact hospital support.',
        };
      }
      return {
        ok: false,
        signOutRequired: true,
        error: sanitizeAuthMessage(
          extractErrorMessage(profileError),
          'Could not verify your patient profile. Please try again.',
        ),
      };
    }

    if (!profile) {
      return {
        ok: false,
        signOutRequired: true,
        error: 'No patient profile found for this account. Please register first.',
      };
    }

    return { ok: true, profile };
  };

  const enforcePatientSignInChecks = async (
    userId: string,
    enteredPhoneDigits: string,
    hospital: RegisteredHospitalOption,
  ): Promise<{ ok: true; profile: PatientProfileRow } | { ok: false; error: string }> => {
    const result = await fetchPatientProfile(userId);

    if (!result.ok) {
      if (result.signOutRequired) {
        await runNetworkSafe(() => supabase.auth.signOut());
      }
      return { ok: false, error: result.error };
    }

    const { profile } = result;

    if (normalizeRole(profile.role) !== 'PATIENT') {
      await runNetworkSafe(() => supabase.auth.signOut());
      return { ok: false, error: RBAC_DENIED_MESSAGE };
    }

    if (!profileBelongsToHospital(profile.hospital_id, hospital)) {
      await runNetworkSafe(() => supabase.auth.signOut());
      return { ok: false, error: HOSPITAL_MISMATCH_MESSAGE };
    }

    if (!phonesMatch(profile.phone, enteredPhoneDigits)) {
      await runNetworkSafe(() => supabase.auth.signOut());
      return { ok: false, error: PHONE_MISMATCH_MESSAGE };
    }

    return { ok: true, profile };
  };

  const upsertPatientProfile = async (params: {
    userId: string;
    email: string;
    fullName: string;
    phone: string;
    hospitalId: string;
  }) => {
    const { error } = await runNetworkSafe<PostgrestSingleResponse<null>>(async () =>
      supabase.from('profiles').upsert(
        {
          id: params.userId,
          email: params.email.toLowerCase().trim(),
          full_name: params.fullName.trim(),
          phone: params.phone.trim(),
          role: 'PATIENT',
          hospital_id: params.hospitalId,
        },
        { onConflict: 'id' },
      ),
    );

    if (error) {
      const message = extractErrorMessage(error).toLowerCase();
      if (
        !message.includes('does not exist') &&
        !message.includes('relation') &&
        !message.includes('schema cache')
      ) {
        throw new Error(
          sanitizeAuthMessage(
            extractErrorMessage(error),
            'Could not save your patient profile.',
          ),
        );
      }
    }
  };

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    setShowForgotPasswordHint(false);

    const cleanEmail = email.trim().toLowerCase();
    const cleanPhoneDigits = phoneDigits(phone);
    const cleanPassword = password;

    try {
      assertSupabaseConfigured();

      if (!selectedHospital) {
        throw new Error(HOSPITAL_SELECTION_REQUIRED);
      }

      if (cleanPhoneDigits.length !== 10) {
        throw new Error('Enter your registered 10-digit mobile number.');
      }
      if (!cleanEmail || !isValidEmail(cleanEmail)) {
        throw new Error('Enter a valid email address (for example, user@gmail.com).');
      }
      if (!cleanPassword.trim()) {
        throw new Error('Password is required.');
      }

      const signInResult = await safeSignInWithPassword(supabase, {
        email: cleanEmail,
        password: cleanPassword,
      });

      if (!signInResult.ok) {
        throw new Error(
          signInResult.error
            ? mapSupabaseAuthError(signInResult.error, 'signin')
            : signInResult.message || PATIENT_AUTH_CONNECTION_MESSAGE,
        );
      }

      const { data } = signInResult.data;

      if (!data?.user) {
        throw new Error(SIGN_IN_DENIED_MESSAGE);
      }

      const access = await enforcePatientSignInChecks(
        data.user.id,
        cleanPhoneDigits,
        selectedHospital,
      );
      if (!access.ok) {
        throw new Error(access.error);
      }

      const displayName =
        String(access.profile.full_name ?? '').trim() ||
        String(data.user.user_metadata?.full_name ?? '').trim() ||
        cleanEmail.split('@')[0] ||
        'Patient';

      completePatientSession({
        patientId: data.user.id,
        fullName: displayName,
        email: cleanEmail,
        phone: formatPhone(cleanPhoneDigits),
        hospital: selectedHospital,
        toastMessage: `Welcome back, ${displayName}`,
      });
    } catch (err: unknown) {
      const credentialFailure =
        err instanceof Error && err.message === SIGN_IN_DENIED_MESSAGE;
      publishPatientAuthError(err, SIGN_IN_DENIED_MESSAGE, credentialFailure);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    setShowForgotPasswordHint(false);

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = fullName.trim();
    const cleanPhoneDigits = phoneDigits(phone);
    const formattedPhone = formatPhone(cleanPhoneDigits);

    try {
      assertSupabaseConfigured();

      if (!selectedHospital) {
        throw new Error(HOSPITAL_SELECTION_REQUIRED);
      }

      if (!cleanName) {
        throw new Error('Please enter your full name.');
      }
      if (cleanPhoneDigits.length !== 10) {
        throw new Error('Enter a valid 10-digit mobile number.');
      }
      if (!cleanEmail || !isValidEmail(cleanEmail)) {
        throw new Error('Enter a valid email address (for example, user@gmail.com).');
      }
      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters long.');
      }
      if (password !== confirmPassword) {
        throw new Error('Passwords do not match. Please re-enter your password.');
      }

      const signUpResult = await safeSignUpPatient(supabase, {
        email: cleanEmail,
        password,
        metadata: {
          full_name: cleanName,
          phone: formattedPhone,
          role: 'PATIENT',
          hospital_id: selectedHospital.id,
          hospital_name: selectedHospital.name,
          hospital_code: selectedHospital.code,
        },
      });

      if (!signUpResult.ok) {
        throw new Error(
          signUpResult.error
            ? mapSupabaseAuthError(signUpResult.error, 'register')
            : signUpResult.message || PATIENT_AUTH_CONNECTION_MESSAGE,
        );
      }

      const { data } = signUpResult.data;

      if (!data?.user) {
        throw new Error('Registration failed. Please try again.');
      }

      if (data.user.identities?.length === 0) {
        throw new Error(DUPLICATE_EMAIL_MESSAGE);
      }

      const registeredUserId = data.user.id;

      await upsertPatientProfile({
        userId: registeredUserId,
        email: cleanEmail,
        fullName: cleanName,
        phone: formattedPhone,
        hospitalId: selectedHospital.id,
      });

      const sessionResult = await establishPatientSessionAfterSignUp(supabase, {
        email: cleanEmail,
        password,
        signUpUserId: registeredUserId,
        signUpSession: data.session,
      });

      completePatientSession({
        patientId: sessionResult.userId,
        fullName: cleanName,
        email: cleanEmail,
        phone: formattedPhone,
        hospital: selectedHospital,
        toastMessage: sessionResult.signedInViaPassword || sessionResult.session
          ? 'Patient account created successfully.'
          : 'Welcome to your patient portal.',
      });
      return;
    } catch (err: unknown) {
      publishPatientAuthError(
        err,
        'Registration failed. Please check your inputs and try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (mode: AuthMode) => {
    setAuthMode(mode);
    setErrorMessage(null);
    setSuccessMessage(null);
    setShowForgotPasswordHint(false);
    setPhone('');
    setPassword('');
    setConfirmPassword('');
  };

  return (
    <main className="flex h-screen max-h-screen w-screen flex-col overflow-hidden bg-[#FBF7F2] text-[#361E10] select-none">
      <header className="mx-auto flex w-full max-w-[430px] shrink-0 items-center justify-between px-4 pt-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#8C6044] transition hover:text-[#361E10]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Workspace Directory
        </Link>
        <div className="inline-flex items-center gap-1.5 rounded-full border border-[#EFE7DE] bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-[#52331F] shadow-xs">
          <ShieldCheck className="h-3.5 w-3.5 text-[#0D9488]" />
          Patient Encounter Cloud
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-[430px] flex-1 flex-col justify-center px-4 py-2">
        <div className="rounded-[2rem] border border-[#EFE7DE] bg-white p-5 shadow-[0_12px_40px_rgba(140,96,68,0.06)] sm:p-6">
          <div className="mb-4 text-center">
            <div className="mb-3 flex justify-center">
              <RegalHospitalLogo heightClass="h-10" framed />
            </div>
            <span className="inline-flex rounded-full bg-[#ECFDF5] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#0D9488]">
              Patient Portal · {selectedHospital?.code ?? 'HOSP-01'} •{' '}
              {(selectedHospital?.city ?? 'Bengaluru').toUpperCase()}
            </span>
            <h1 className="sr-only">Patient Portal Sign In</h1>
            <p className="mt-1 text-[11px] leading-relaxed text-[#7D6354]">
              {authMode === 'signin'
                ? 'Sign in with your registered email, mobile number, and password.'
                : 'First-time patients must register before accessing the portal.'}
            </p>
          </div>

          <div className="mb-3 grid grid-cols-2 rounded-full border border-[#EFE7DE] bg-[#FBF7F2] p-1">
            <button
              type="button"
              onClick={() => switchMode('signin')}
              className={`rounded-full py-1.5 text-[11px] font-bold transition ${
                authMode === 'signin'
                  ? 'bg-white text-[#361E10] shadow-xs'
                  : 'text-[#8C6044] hover:text-[#52331F]'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => switchMode('register')}
              className={`rounded-full py-1.5 text-[11px] font-bold transition ${
                authMode === 'register'
                  ? 'bg-white text-[#361E10] shadow-xs'
                  : 'text-[#8C6044] hover:text-[#52331F]'
              }`}
            >
              Register New
            </button>
          </div>

          {successMessage ? (
            <div
              role="status"
              className="mb-3 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-[11px] font-medium leading-snug text-emerald-900"
            >
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          ) : null}

          {isDisplayableAuthMessage(errorMessage) ? (
            <div className="mb-3 space-y-2">
              <div
                role="alert"
                className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-[11px] font-medium leading-snug text-rose-900"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
                <span>{errorMessage}</span>
              </div>
              {authMode === 'signin' && showForgotPasswordHint ? (
                <p className="rounded-xl border border-[#EFE7DE] bg-[#FBF7F2] px-3 py-2 text-[10px] font-medium leading-snug text-[#7D6354]">
                  {FORGOT_PASSWORD_HINT}
                </p>
              ) : null}
            </div>
          ) : null}

          <form
            onSubmit={authMode === 'signin' ? handleLogin : handleRegister}
            autoComplete="off"
            className="space-y-2.5"
          >
            <div>
              <label className={LABEL_CLASS}>Hospital / Healthcare Clinic</label>
              <select
                value={selectedHospitalId}
                onChange={(e) => setSelectedHospitalId(e.target.value)}
                disabled={hospitalsLoading || hospitals.length === 0}
                aria-label="Hospital clinic"
                className={`${INPUT_CLASS} font-semibold ${hospitalsLoading ? 'opacity-70' : ''}`}
              >
                {hospitalsLoading ? (
                  <option value="">Loading registered hospitals…</option>
                ) : hospitals.length === 0 ? (
                  <option value="">No registered hospitals found</option>
                ) : (
                  hospitals.map((hospital) => (
                    <option key={hospital.id} value={hospital.id}>
                      {formatRegisteredHospitalLabel(hospital)}
                    </option>
                  ))
                )}
              </select>
              {hospitalsLoadNotice ? (
                <p className="mt-1 text-[10px] font-medium text-[#7D6354]">{hospitalsLoadNotice}</p>
              ) : null}
              {!hospitalsLoading && !selectedHospital ? (
                <p className="mt-1 text-[10px] font-medium text-rose-700">
                  {HOSPITAL_SELECTION_REQUIRED}
                </p>
              ) : null}
            </div>

            {authMode === 'register' ? (
              <div>
                <label className={LABEL_CLASS}>Full Name</label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#94A3B8]" />
                  <input
                    type="text"
                    required
                    autoComplete="off"
                    name="patient-full-name"
                    placeholder="Your full name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className={`${INPUT_CLASS} pl-9`}
                  />
                </div>
              </div>
            ) : null}

            <div>
              <label className={LABEL_CLASS}>
                {authMode === 'signin' ? 'Registered Mobile Phone Number' : 'Mobile Phone Number'}
              </label>
              <div className="flex overflow-hidden rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] focus-within:border-[#9E6A4B]/40 focus-within:ring-2 focus-within:ring-[#9E6A4B]/15">
                <span className="flex items-center border-r border-[#E2E8F0] bg-[#FBF7F2] px-3 text-[12px] font-bold text-[#52331F]">
                  +91
                </span>
                <input
                  key={`phone-${authMode}`}
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]{10}"
                  maxLength={10}
                  required
                  autoComplete="off"
                  name="phone_number_no_autofill"
                  placeholder="Enter 10-digit mobile number"
                  aria-autocomplete="none"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  className="w-full bg-transparent py-2 px-3 text-[12px] font-medium text-[#361E10] placeholder:text-[#94A3B8] focus:outline-none"
                  data-1p-ignore
                  data-lpignore="true"
                />
              </div>
            </div>

            <div>
              <label className={LABEL_CLASS}>
                {authMode === 'signin' ? 'Registered Email Address' : 'Email Address'}
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#94A3B8]" />
                <input
                  type="email"
                  required
                  autoComplete="one-time-code"
                  name={
                    authMode === 'signin'
                      ? 'patient-signin-email'
                      : 'patient-register-email'
                  }
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`${INPUT_CLASS} pl-9`}
                  data-1p-ignore
                  data-lpignore="true"
                />
              </div>
            </div>

            <div>
              <label className={LABEL_CLASS}>Password</label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#94A3B8]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={authMode === 'register' ? 6 : undefined}
                  autoComplete="new-password"
                  name={
                    authMode === 'signin'
                      ? 'patient-signin-password'
                      : 'patient-register-password'
                  }
                  placeholder={
                    authMode === 'register' ? 'Minimum 6 characters' : 'Enter your password'
                  }
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`${INPUT_CLASS} pl-9 pr-10`}
                  data-1p-ignore
                  data-lpignore="true"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8C6044] hover:text-[#361E10]"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {authMode === 'register' ? (
              <div>
                <label className={LABEL_CLASS}>Confirm Password</label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#94A3B8]" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    autoComplete="new-password"
                    name="patient-register-confirm-password"
                    placeholder="Re-enter your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`${INPUT_CLASS} pl-9 pr-10`}
                    data-1p-ignore
                    data-lpignore="true"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8C6044] hover:text-[#361E10]"
                    aria-label={
                      showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'
                    }
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            ) : null}

            <button
              type="submit"
              disabled={loading || !canSubmit}
              className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-[#9E6A4B] py-2.5 text-[11px] font-bold uppercase tracking-wide text-white transition hover:bg-[#8B593C] disabled:opacity-60"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowRight className="h-4 w-4" />
              )}
              <span>
                {loading
                  ? authMode === 'signin'
                    ? 'Signing in…'
                    : 'Creating account…'
                  : authMode === 'signin'
                    ? 'Sign In to Patient Portal →'
                    : 'Create Patient Account →'}
              </span>
            </button>
          </form>

          <p className="mt-4 text-center text-[10px] font-medium text-[#7D6354]">
            Protected by End-to-End Hospital OS Encryption
          </p>
        </div>
      </div>

      <footer className="shrink-0 pb-4 text-center text-[10px] font-medium text-[#8C6044]">
        {selectedHospital?.name ?? 'Healthcare Network'} • Patient Node{' '}
        {selectedHospital?.code ?? selectedHospital?.id ?? '—'}
      </footer>
    </main>
  );
}

export default function PatientLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen w-full items-center justify-center bg-[#FBF7F2]">
          <Loader2 className="h-6 w-6 animate-spin text-[#9E6A4B]" />
        </div>
      }
    >
      <PatientAuthForm />
    </Suspense>
  );
}
