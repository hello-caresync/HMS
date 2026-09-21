const LOGIN_PATH_FRAGMENT = '/login';

/** Prevent open redirects and login redirect loops after successful sign-in. */
export function resolveSafePortalRedirect(
  redirect: string | null | undefined,
  fallback: string,
  allowedPrefix: string,
): string {
  const raw = String(redirect ?? '').trim();
  if (!raw.startsWith('/') || raw.startsWith('//')) return fallback;
  if (!raw.startsWith(allowedPrefix)) return fallback;
  if (raw.includes(LOGIN_PATH_FRAGMENT)) return fallback;
  return raw;
}

export function appendRedirectQuery(loginPath: string, originalPath: string): string {
  const url = new URL(loginPath, 'http://local');
  url.searchParams.set('redirect', originalPath);
  return `${url.pathname}${url.search}`;
}

export function resolveLoginRedirect(
  redirect: string | null | undefined,
  fallback: string,
  allowedPrefixes: string[],
): string {
  const raw = String(redirect ?? '').trim();
  if (!raw.startsWith('/') || raw.startsWith('//')) return fallback;
  if (raw.includes(LOGIN_PATH_FRAGMENT)) return fallback;

  for (const prefix of allowedPrefixes) {
    if (raw === prefix || raw.startsWith(`${prefix}/`)) {
      return raw;
    }
  }

  return fallback;
}
