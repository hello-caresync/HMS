import { getDevSessionHeaders } from '@/lib/doctor/auth/dev-auth';

type ApiResponse<T> = { success: boolean; error?: string } & T;

function buildHeaders(init?: RequestInit): HeadersInit {
  const base: Record<string, string> = { 'Content-Type': 'application/json', ...getDevSessionHeaders() };
  return {
    ...base,
    ...(init?.headers as Record<string, string> | undefined),
  };
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    credentials: 'omit',
    headers: buildHeaders(init),
  });

  const data = (await res.json()) as ApiResponse<T>;
  if (!res.ok || data.success === false) {
    const err = data.error;
    throw new Error(typeof err === 'string' ? err : 'Request failed');
  }
  return data as T;
}

export function apiGet<T>(path: string) {
  return apiFetch<T>(path, { method: 'GET' });
}

export function apiPost<T>(path: string, body: unknown) {
  return apiFetch<T>(path, { method: 'POST', body: JSON.stringify(body) });
}

export function apiPatch<T>(path: string, body: unknown) {
  return apiFetch<T>(path, { method: 'PATCH', body: JSON.stringify(body) });
}
