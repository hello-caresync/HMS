import type {
  AuthError,
  AuthResponse,
  AuthTokenResponsePassword,
  Session,
} from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

import {
  AUTH_SERVER_UNREACHABLE_MESSAGE,
  extractErrorMessage,
  isServiceRestrictedError,
} from '@/lib/auth/parseAuthError';

import { signUpPatientAccount, type PatientSignUpMetadata } from '@/lib/auth/patient-signup';

export const PATIENT_AUTH_CONNECTION_MESSAGE =
  'Connection failed. Please verify your internet connection and Supabase URL.';

/** Log auth failures as plain text — never pass raw AuthError objects to the console. */
export function warnAuthFailure(context: string, error: unknown): void {
  if (!error) return;

  const name =
    error instanceof Error
      ? error.name
      : typeof error === 'object'
        ? String(Reflect.get(error, 'name') ?? '')
        : '';

  const message = extractErrorMessage(error);
  const label = message || name || 'unknown error';
  console.warn(`Auth request failed [${context}]:`, label);
}

export function resolvePatientAuthFailureMessage(error: unknown, fallback: string): string {
  if (isServiceRestrictedError(error)) {
    return AUTH_SERVER_UNREACHABLE_MESSAGE;
  }

  const message = extractErrorMessage(error);
  if (message && message !== '{}') {
    return message;
  }

  return fallback;
}

type AuthCallResult<T> =
  | { ok: true; data: T; error: null }
  | { ok: false; data: null; error: AuthError | null; message: string };

async function runAuthCall<T extends { data: unknown; error: AuthError | null }>(
  context: string,
  operation: () => PromiseLike<T>,
  fallbackMessage: string,
): Promise<AuthCallResult<T>> {
  try {
    const result = await operation();

    if (result.error) {
      warnAuthFailure(context, result.error);
      return {
        ok: false,
        data: null,
        error: result.error,
        message: resolvePatientAuthFailureMessage(result.error, fallbackMessage),
      };
    }

    return { ok: true, data: result, error: null };
  } catch (err: unknown) {
    warnAuthFailure(`${context}:network`, err);
    return {
      ok: false,
      data: null,
      error: null,
      message: resolvePatientAuthFailureMessage(err, PATIENT_AUTH_CONNECTION_MESSAGE),
    };
  }
}

export async function safeSignInWithPassword(
  supabase: SupabaseClient,
  params: { email: string; password: string },
): Promise<AuthCallResult<AuthTokenResponsePassword>> {
  return runAuthCall(
    'signInWithPassword',
    () =>
      supabase.auth.signInWithPassword({
        email: params.email.trim().toLowerCase(),
        password: params.password,
      }),
    'Unable to complete authentication. Please verify credentials.',
  );
}

export async function safeSignUpPatient(
  supabase: SupabaseClient,
  params: {
    email: string;
    password: string;
    metadata: PatientSignUpMetadata;
  },
): Promise<AuthCallResult<AuthResponse>> {
  return runAuthCall(
    'signUp',
    () => signUpPatientAccount(supabase, params),
    'Unable to complete registration. Please verify your details and try again.',
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export type PostSignUpSessionResult = {
  /** Supabase JWT session when Auth returned one (signup or sign-in). */
  session: Session | null;
  /** User id from sign-in when it differs from signup (usually same). */
  userId: string;
  /** True when signInWithPassword returned an active session. */
  signedInViaPassword: boolean;
};

/**
 * After signUp, Supabase often returns user without session (email confirm off still races).
 * Prefer signup session; otherwise retry signInWithPassword before falling back to local portal session.
 */
export async function establishPatientSessionAfterSignUp(
  supabase: SupabaseClient,
  params: {
    email: string;
    password: string;
    signUpUserId: string;
    signUpSession: Session | null;
  },
): Promise<PostSignUpSessionResult> {
  if (params.signUpSession) {
    return {
      session: params.signUpSession,
      userId: params.signUpUserId,
      signedInViaPassword: false,
    };
  }

  const email = params.email.trim().toLowerCase();

  for (const delayMs of [0, 400, 900]) {
    if (delayMs > 0) {
      await sleep(delayMs);
    }

    try {
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: params.password,
      });

      if (!signInError && signInData.session) {
        return {
          session: signInData.session,
          userId: signInData.user?.id ?? params.signUpUserId,
          signedInViaPassword: true,
        };
      }

      if (signInError) {
        warnAuthFailure('signInWithPassword:afterSignUp', signInError);
      }
    } catch (err: unknown) {
      warnAuthFailure('signInWithPassword:afterSignUp:network', err);
    }
  }

  return {
    session: null,
    userId: params.signUpUserId,
    signedInViaPassword: false,
  };
}
