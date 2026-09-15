export const ADMIN_SESSION_KEY = 'nexora_admin_session';
export const ADMIN_SESSION_COOKIE = 'curasync_session';
export const AUTH_TOKEN_COOKIE = 'auth-token';
export const SUPABASE_TOKEN_COOKIE = 'sb-access-token';

/** Canonical post-login destination for Regal Hospital admin. */
export const ADMIN_DASHBOARD_PATH = '/dashboard';

/** @deprecated Use ADMIN_DASHBOARD_PATH */
export const HOSPITAL_DASHBOARD_PATH = ADMIN_DASHBOARD_PATH;

export type AdminSession = {
  email: string;
  role: 'administrator';
  loggedInAt: string;
};

const BLOCKED_REDIRECT_PREFIXES = ['/login', '/auth', '/auth-console'];

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function writeAdminSessionCookies(session: AdminSession, rememberDevice: boolean): void {
  if (typeof document === 'undefined') return;

  const payload = encodeURIComponent(
    JSON.stringify({ email: session.email, role: session.role, loggedInAt: session.loggedInAt }),
  );
  const accessToken = encodeURIComponent(`admin_${session.email}_${Date.now()}`);
  const maxAge = rememberDevice ? 60 * 60 * 24 * 30 : 60 * 60 * 8;
  const attrs = `path=/; SameSite=Lax; max-age=${maxAge}`;

  document.cookie = `${ADMIN_SESSION_COOKIE}=${payload}; ${attrs}`;
  document.cookie = `${AUTH_TOKEN_COOKIE}=${accessToken}; ${attrs}`;
  document.cookie = `${SUPABASE_TOKEN_COOKIE}=${accessToken}; ${attrs}`;
}

function clearAdminSessionCookies(): void {
  if (typeof document === 'undefined') return;
  const attrs = 'path=/; max-age=0; SameSite=Lax';
  document.cookie = `${ADMIN_SESSION_COOKIE}=; ${attrs}`;
  document.cookie = `${AUTH_TOKEN_COOKIE}=; ${attrs}`;
  document.cookie = `${SUPABASE_TOKEN_COOKIE}=; ${attrs}`;
}

/** Prevent circular or unsafe post-login redirects. */
export function sanitizeAdminRedirectPath(path: string | null | undefined): string {
  const fallback =
    process.env.NEXT_PUBLIC_NEXORA_ADMIN_REDIRECT?.trim() || ADMIN_DASHBOARD_PATH;

  if (!path?.trim()) return fallback;

  let decoded = path.trim();
  try {
    decoded = decodeURIComponent(decoded);
  } catch {
    return fallback;
  }

  if (!decoded.startsWith('/') || decoded.startsWith('//')) {
    return fallback;
  }

  const normalized = decoded.replace(/\/+$/, '') || '/';

  if (BLOCKED_REDIRECT_PREFIXES.some((prefix) => normalized === prefix || normalized.startsWith(`${prefix}/`))) {
    return fallback;
  }

  if (
    normalized === '/hospital' ||
    normalized === '/hospital/dashboard' ||
    normalized.startsWith('/hospital/dashboard/')
  ) {
    return ADMIN_DASHBOARD_PATH;
  }

  if (normalized === '/dashboard' || normalized.startsWith('/dashboard/')) {
    return normalized === '/dashboard' ? ADMIN_DASHBOARD_PATH : decoded;
  }

  return decoded;
}

export function getAdminRedirectPath(override?: string | null): string {
  return sanitizeAdminRedirectPath(override);
}

/** Server-side admin credential check via API route (password never exposed to client bundle). */
export async function authenticateAdmin(
  email: string,
  password: string,
): Promise<{ ok: true; email: string } | { ok: false; error: string }> {
  try {
    const res = await fetch('/api/admin/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = (await res.json()) as {
      success?: boolean;
      user?: { email: string; role: 'administrator' };
      error?: string;
    };

    if (!res.ok || !data.success || !data.user?.email) {
      return { ok: false, error: data.error ?? 'Invalid email or password.' };
    }

    return { ok: true, email: data.user.email };
  } catch {
    return { ok: false, error: 'Unable to reach the authentication service.' };
  }
}

export function persistAdminSession(session: AdminSession, rememberDevice: boolean): void {
  sessionStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
  if (rememberDevice) {
    localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
  } else {
    localStorage.removeItem(ADMIN_SESSION_KEY);
  }
  writeAdminSessionCookies(session, rememberDevice);
}

export function getAdminSession(): AdminSession | null {
  if (typeof window === 'undefined') return null;

  const raw =
    sessionStorage.getItem(ADMIN_SESSION_KEY) ?? localStorage.getItem(ADMIN_SESSION_KEY);

  if (raw) {
    try {
      const parsed = JSON.parse(raw) as AdminSession;
      if (parsed?.email && parsed?.role === 'administrator') {
        writeAdminSessionCookies(parsed, Boolean(localStorage.getItem(ADMIN_SESSION_KEY)));
        return parsed;
      }
    } catch {
      /* fall through to cookie */
    }
  }

  const cookieRaw = readCookie(ADMIN_SESSION_COOKIE);
  if (!cookieRaw) return null;

  try {
    const parsed = JSON.parse(cookieRaw) as AdminSession;
    if (parsed?.email && parsed?.role === 'administrator') {
      sessionStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(parsed));
      return parsed;
    }
  } catch {
    return null;
  }

  return null;
}

export function clearAdminSession(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(ADMIN_SESSION_KEY);
  localStorage.removeItem(ADMIN_SESSION_KEY);
  clearAdminSessionCookies();
}

export function isAdminAuthenticated(): boolean {
  return getAdminSession() !== null;
}

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}
