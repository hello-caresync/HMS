/**
 * Canonical Nexora standalone applications in the ERP ecosystem.
 * Shared services are consumed by all five; none import UI layers from another app.
 */
export const NEXORA_APPS = [
  'admin',
  'hospital',
  'vendor',
  'patient',
  'operations',
] as const;

export type NexoraAppId = (typeof NEXORA_APPS)[number];

/** Domain modules that can originate cross-cutting events (billing, stock, audit). */
export const NEXORA_MODULES = [
  'auth',
  'notifications',
  'billing',
  'emr',
  'appointments',
  'inventory',
  'procurement',
  'payments',
  'reports',
  'audit',
  'pharmacy',
  'laboratory',
  'radiology',
] as const;

export type NexoraModule = (typeof NEXORA_MODULES)[number];

/** Uniform success / failure envelope for all headless services. */
export type ServiceResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; code?: string };

export function ok<T>(data: T): ServiceResult<T> {
  return { ok: true, data };
}

export function fail<T>(error: string, code?: string): ServiceResult<T> {
  return { ok: false, error, code };
}

export function generateCorrelationId(prefix = 'nxr'): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
