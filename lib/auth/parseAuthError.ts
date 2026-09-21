const USELESS_AUTH_MESSAGES = new Set(['{}', '[object Object]', 'undefined', 'null']);

const AUTH_ERROR_FIELD_KEYS = [
  'message',
  'error_description',
  'details',
  'hint',
  'msg',
  'error',
] as const;

export const AUTH_SERVER_UNREACHABLE_MESSAGE =
  'Unable to reach the authentication server. Please check database connectivity or service quota status.';

function isUsefulAuthMessage(value: string | null | undefined): value is string {
  const trimmed = String(value ?? '').trim();
  if (!trimmed || USELESS_AUTH_MESSAGES.has(trimmed)) return false;
  if (trimmed.startsWith('{') && trimmed.includes('"name"')) return false;
  return true;
}

function readErrorName(err: unknown): string {
  if (!err || typeof err !== 'object') return '';
  return String(Reflect.get(err, 'name') ?? (err as Record<string, unknown>).name ?? '').trim();
}

function readErrorStatusCode(err: unknown): number | null {
  if (!err || typeof err !== 'object') return null;
  const status = Reflect.get(err, 'status') ?? (err as Record<string, unknown>).status;
  const parsed = Number(status);
  return Number.isFinite(parsed) ? parsed : null;
}

function isDatabaseSignupFailureMessage(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes('database error') ||
    lower.includes('saving new user') ||
    lower.includes('trigger') ||
    lower.includes('duplicate key')
  );
}

function isAuthServerConnectivityFailure(err: unknown): boolean {
  const name = readErrorName(err);
  const status = readErrorStatusCode(err);
  if (name === 'AuthRetryableFetchError') return true;

  const message =
    err instanceof Error
      ? err.message
      : typeof err === 'string'
        ? err
        : readAuthErrorField(err, 'message') ?? '';

  if (isDatabaseSignupFailureMessage(message)) return false;

  if (status === 500) {
    return !isUsefulAuthMessage(message) || message === '{}';
  }

  return (
    message.includes('AuthRetryableFetchError') ||
    (message.includes('"status":500') && !isDatabaseSignupFailureMessage(message)) ||
    (message.includes('"status": 500') && !isDatabaseSignupFailureMessage(message))
  );
}

function readAuthErrorField(record: unknown, key: string): string | null {
  if (!record || typeof record !== 'object') return null;

  const direct = (record as Record<string, unknown>)[key];
  if (typeof direct === 'string' && isUsefulAuthMessage(direct)) {
    return direct.trim();
  }

  const reflected = Reflect.get(record, key);
  if (typeof reflected === 'string' && isUsefulAuthMessage(reflected)) {
    return reflected.trim();
  }

  return null;
}

/**
 * Unpack Supabase AuthError, PostgrestError, and native Error objects even when
 * properties are non-enumerable (avoids `{}` from String(err) / JSON.stringify).
 */
export function extractErrorMessage(err: unknown): string {
  if (!err) return '';
  if (typeof err === 'string') {
    if (isAuthServerConnectivityFailure(err)) return AUTH_SERVER_UNREACHABLE_MESSAGE;
    return isUsefulAuthMessage(err)
      ? err.trim()
      : 'An unexpected authentication error occurred. Please try again.';
  }

  if (typeof err === 'object') {
    if (isAuthServerConnectivityFailure(err)) {
      return AUTH_SERVER_UNREACHABLE_MESSAGE;
    }

    for (const key of AUTH_ERROR_FIELD_KEYS) {
      const value = readAuthErrorField(err, key);
      if (value) return value;
    }

    if (err instanceof Error && isUsefulAuthMessage(err.message)) {
      if (isAuthServerConnectivityFailure(err.message)) {
        return AUTH_SERVER_UNREACHABLE_MESSAGE;
      }
      return err.message.trim();
    }
  }

  return 'An unexpected authentication error occurred. Please try again.';
}

/** @deprecated Prefer extractErrorMessage — kept for existing imports. */
export function parseAuthError(error: unknown): string {
  return extractErrorMessage(error);
}

/** Never surface `{}` or other useless strings in UI toasts/banners. */
export function sanitizeAuthMessage(
  message: string | null | undefined,
  fallback = 'Authentication request could not be processed. Please check your inputs.',
): string {
  return isUsefulAuthMessage(message) ? message.trim() : fallback;
}

/** True when a message is safe to render in the error banner. */
export function isDisplayableAuthMessage(message: string | null | undefined): message is string {
  return isUsefulAuthMessage(message);
}

export const SERVICE_RESTRICTED_MESSAGE = AUTH_SERVER_UNREACHABLE_MESSAGE;

function readErrorStatus(err: unknown): string {
  if (!err || typeof err !== 'object') return '';
  const status = Reflect.get(err, 'status') ?? Reflect.get(err, 'code');
  return String(status ?? '').trim();
}

/** Detect network failures, quota blocks, and HTTP 402-style restrictions. */
export function isServiceRestrictedError(err: unknown): boolean {
  if (isAuthServerConnectivityFailure(err)) return true;

  const name = readErrorName(err);
  const message = extractErrorMessage(err).toLowerCase();
  const status = readErrorStatus(err).toLowerCase();

  if (name === 'TypeError' && message.includes('failed to fetch')) return true;
  if (status === '402' || status === '402 payment required') return true;

  return (
    message.includes('failed to fetch') ||
    message.includes('networkerror') ||
    message.includes('network request failed') ||
    message.includes('load failed') ||
    message.includes('402') ||
    message.includes('payment required') ||
    message.includes('quota') ||
    message.includes('exceeded') ||
    message.includes('service unavailable') ||
    message.includes('unable to reach the authentication server')
  );
}

/** Map auth/network failures to a safe UI string — never `{}`. */
export function resolveAuthUiError(err: unknown, fallback: string): string {
  if (isServiceRestrictedError(err)) return SERVICE_RESTRICTED_MESSAGE;

  const raw = extractErrorMessage(err);
  if (raw === SERVICE_RESTRICTED_MESSAGE) return SERVICE_RESTRICTED_MESSAGE;

  return sanitizeAuthMessage(raw, fallback);
}

/** Wrap Supabase auth/REST calls — converts fetch failures into actionable UI errors. */
export async function runNetworkSafe<T>(operation: () => PromiseLike<T>): Promise<T> {
  try {
    return await operation();
  } catch (err: unknown) {
    if (isServiceRestrictedError(err)) {
      throw new Error(SERVICE_RESTRICTED_MESSAGE);
    }
    throw err;
  }
}
