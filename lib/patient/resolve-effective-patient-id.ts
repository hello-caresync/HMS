import type { SupabaseClient } from '@supabase/supabase-js';

import { REGAL_HOSPITAL_CODE } from '@/lib/regal/constants';

import { normalizePatientPhone } from '@/lib/patient/patients-record';

export type ResolvedPatientIdentity = {
  authUserId: string | null;
  patientRecordId: string | null;
  effectivePatientId: string | null;
  linkedPatientIds: string[];
};

function uniqueIds(values: Array<string | null | undefined>): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    const trimmed = String(value ?? '').trim();
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    result.push(trimmed);
  }
  return result;
}

function isUuid(value: string): boolean {
  return /^[0-9a-f-]{36}$/i.test(value);
}

async function lookupPatientRowByAuthUser(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ id: string } | null> {
  const withUserId = await supabase
    .from('patients')
    .select('id')
    .or(`user_id.eq.${userId},id.eq.${userId}`)
    .maybeSingle();

  if (!withUserId.error && withUserId.data?.id) {
    return { id: String(withUserId.data.id) };
  }

  if (missingColumnError(withUserId.error?.message, 'user_id')) {
    const byId = await supabase.from('patients').select('id').eq('id', userId).maybeSingle();
    if (!byId.error && byId.data?.id) {
      return { id: String(byId.data.id) };
    }
  }

  const byPatientId = await supabase
    .from('patients')
    .select('id')
    .eq('patient_id', userId)
    .maybeSingle();

  if (!byPatientId.error && byPatientId.data?.id) {
    return { id: String(byPatientId.data.id) };
  }

  return null;
}

async function lookupPatientRowByPhone(
  supabase: SupabaseClient,
  phone: string,
): Promise<{ id: string } | null> {
  const normalized = normalizePatientPhone(phone);
  if (!normalized) return null;

  const exact = await supabase
    .from('patients')
    .select('id')
    .eq('hospital_id', REGAL_HOSPITAL_CODE)
    .eq('phone', normalized)
    .maybeSingle();

  if (!exact.error && exact.data?.id) {
    return { id: String(exact.data.id) };
  }

  const suffix = await supabase
    .from('patients')
    .select('id')
    .eq('hospital_id', REGAL_HOSPITAL_CODE)
    .ilike('phone', `%${normalized}`)
    .maybeSingle();

  if (!suffix.error && suffix.data?.id) {
    return { id: String(suffix.data.id) };
  }

  return null;
}

function missingColumnError(message: string | null | undefined, column: string): boolean {
  const text = String(message ?? '').toLowerCase();
  return text.includes(column.toLowerCase()) && (text.includes('does not exist') || text.includes('schema cache'));
}

/**
 * Resolves the canonical patient UUID used on appointments.
 * Booking and dashboard must both use this helper.
 */
export async function resolveEffectivePatientId(
  supabase: SupabaseClient,
  hints: { phone?: string | null; sessionPatientId?: string | null } = {},
): Promise<ResolvedPatientIdentity> {
  const { data: authData } = await supabase.auth.getUser();
  const authUserId = authData.user?.id ? String(authData.user.id) : null;
  const sessionPatientId = String(hints.sessionPatientId ?? '').trim() || null;

  let patientRecord: { id: string } | null = null;

  if (authUserId) {
    patientRecord = await lookupPatientRowByAuthUser(supabase, authUserId);
  }

  if (!patientRecord && sessionPatientId && isUuid(sessionPatientId)) {
    const bySession = await supabase
      .from('patients')
      .select('id')
      .eq('id', sessionPatientId)
      .maybeSingle();
    if (!bySession.error && bySession.data?.id) {
      patientRecord = { id: String(bySession.data.id) };
    }
  }

  if (!patientRecord && hints.phone) {
    patientRecord = await lookupPatientRowByPhone(supabase, hints.phone);
  }

  const patientRecordId = patientRecord?.id ?? null;
  const effectivePatientId = patientRecordId || authUserId || sessionPatientId;

  return {
    authUserId,
    patientRecordId,
    effectivePatientId,
    linkedPatientIds: uniqueIds([patientRecordId, authUserId, sessionPatientId]),
  };
}
