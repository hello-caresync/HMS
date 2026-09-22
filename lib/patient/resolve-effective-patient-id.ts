import type { SupabaseClient } from '@supabase/supabase-js';

import { REGAL_HOSPITAL_CODE } from '@/lib/regal/constants';

import { normalizePatientPhone } from '@/lib/patient/patients-record';
import { loadFamilyMembersForPatient } from '@/lib/patient/family-members';

export type ResolvedPatientIdentity = {
  authUserId: string | null;
  patientRecordId: string | null;
  effectivePatientId: string | null;
  linkedPatientIds: string[];
  familyMemberIds: string[];
  familyMemberNames: string[];
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

function uniqueNames(values: Array<string | null | undefined>): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    const trimmed = String(value ?? '').trim();
    const key = trimmed.toLowerCase();
    if (!trimmed || seen.has(key)) continue;
    seen.add(key);
    result.push(trimmed);
  }
  return result;
}

function isUuid(value: string): boolean {
  return /^[0-9a-f-]{36}$/i.test(value);
}

function escapeOrFilterValue(value: string): string {
  return value.replace(/,/g, ' ').trim();
}

function extractFamilyMembersFromProfile(familyMembers: unknown): {
  ids: string[];
  names: string[];
} {
  if (!Array.isArray(familyMembers)) {
    return { ids: [], names: [] };
  }

  const ids: string[] = [];
  const names: string[] = [];

  for (const member of familyMembers) {
    if (!member || typeof member !== 'object') continue;
    const record = member as Record<string, unknown>;
    const id = String(record.id ?? '').trim();
    const name = String(record.fullName ?? record.full_name ?? record.name ?? '').trim();
    if (id && id !== 'self') ids.push(id);
    if (name) names.push(name);
  }

  return { ids, names };
}

type PatientProfileRow = {
  id: string;
  family_members?: unknown;
};

async function lookupPatientProfile(
  supabase: SupabaseClient,
  userId: string | null,
  email: string | null,
): Promise<PatientProfileRow | null> {
  const filters: string[] = [];
  if (userId) {
    filters.push(`id.eq.${escapeOrFilterValue(userId)}`);
    filters.push(`patient_id.eq.${escapeOrFilterValue(userId)}`);
  }
  if (email) {
    filters.push(`email.eq.${escapeOrFilterValue(email)}`);
  }
  if (!filters.length) return null;

  const primary = await supabase
    .from('patients')
    .select('id, email, family_members')
    .or(filters.join(','))
    .maybeSingle();

  if (!primary.error && primary.data?.id) {
    return {
      id: String(primary.data.id),
      family_members: primary.data.family_members,
    };
  }

  if (userId && missingColumnError(primary.error?.message, 'family_members')) {
    const fallback = await supabase
      .from('patients')
      .select('id, email')
      .or(filters.join(','))
      .maybeSingle();
    if (!fallback.error && fallback.data?.id) {
      return { id: String(fallback.data.id) };
    }
  }

  if (userId) {
    const withLegacyUserId = await supabase
      .from('patients')
      .select('id, email, family_members')
      .or(`user_id.eq.${escapeOrFilterValue(userId)},id.eq.${escapeOrFilterValue(userId)}`)
      .maybeSingle();

    if (!withLegacyUserId.error && withLegacyUserId.data?.id) {
      return {
        id: String(withLegacyUserId.data.id),
        family_members: withLegacyUserId.data.family_members,
      };
    }

    if (missingColumnError(withLegacyUserId.error?.message, 'user_id')) {
      const byId = await supabase
        .from('patients')
        .select('id, email, family_members')
        .eq('id', userId)
        .maybeSingle();
      if (!byId.error && byId.data?.id) {
        return {
          id: String(byId.data.id),
          family_members: byId.data.family_members,
        };
      }
    }
  }

  return null;
}

async function lookupPatientRowByPhone(
  supabase: SupabaseClient,
  phone: string,
): Promise<PatientProfileRow | null> {
  const normalized = normalizePatientPhone(phone);
  if (!normalized) return null;

  const exact = await supabase
    .from('patients')
    .select('id, family_members')
    .eq('hospital_id', REGAL_HOSPITAL_CODE)
    .eq('phone', normalized)
    .maybeSingle();

  if (!exact.error && exact.data?.id) {
    return {
      id: String(exact.data.id),
      family_members: exact.data.family_members,
    };
  }

  const suffix = await supabase
    .from('patients')
    .select('id, family_members')
    .eq('hospital_id', REGAL_HOSPITAL_CODE)
    .ilike('phone', `%${normalized}`)
    .maybeSingle();

  if (!suffix.error && suffix.data?.id) {
    return {
      id: String(suffix.data.id),
      family_members: suffix.data.family_members,
    };
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
  hints: {
    phone?: string | null;
    sessionPatientId?: string | null;
    email?: string | null;
  } = {},
): Promise<ResolvedPatientIdentity> {
  const { data: authData } = await supabase.auth.getUser();
  const authUserId = authData.user?.id ? String(authData.user.id) : null;
  const authEmail = authData.user?.email ? String(authData.user.email).trim().toLowerCase() : null;
  const sessionPatientId = String(hints.sessionPatientId ?? '').trim() || null;
  const hintEmail = String(hints.email ?? '').trim().toLowerCase() || null;
  const lookupEmail = hintEmail || authEmail;

  let patientRecord: PatientProfileRow | null = null;

  if (authUserId || lookupEmail) {
    patientRecord = await lookupPatientProfile(supabase, authUserId, lookupEmail);
  }

  if (!patientRecord && sessionPatientId && isUuid(sessionPatientId)) {
    const bySession = await supabase
      .from('patients')
      .select('id, family_members')
      .eq('id', sessionPatientId)
      .maybeSingle();
    if (!bySession.error && bySession.data?.id) {
      patientRecord = {
        id: String(bySession.data.id),
        family_members: bySession.data.family_members,
      };
    }
  }

  if (!patientRecord && hints.phone) {
    patientRecord = await lookupPatientRowByPhone(supabase, hints.phone);
  }

  const patientRecordId = patientRecord?.id ?? null;
  const effectivePatientId = patientRecordId || authUserId || sessionPatientId;
  const profileFamily = extractFamilyMembersFromProfile(patientRecord?.family_members);

  const localFamily =
    typeof window !== 'undefined' && effectivePatientId
      ? loadFamilyMembersForPatient(effectivePatientId)
      : [];

  const familyMemberIds = uniqueIds([
    ...profileFamily.ids,
    ...localFamily.map((member) => member.id),
  ]);
  const familyMemberNames = uniqueNames([
    ...profileFamily.names,
    ...localFamily.map((member) => member.fullName),
  ]);

  return {
    authUserId,
    patientRecordId,
    effectivePatientId,
    linkedPatientIds: uniqueIds([
      patientRecordId,
      authUserId,
      sessionPatientId,
      ...familyMemberIds,
    ]),
    familyMemberIds,
    familyMemberNames,
  };
}

export { isUuid as isPatientUuid };
