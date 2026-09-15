import type { RealtimePostgresChangesPayload, SupabaseClient } from '@supabase/supabase-js';

import {
  loadChannelMessages,
  subscribeChannelMessages,
  type ChannelMessageRow,
} from '@/lib/ecosystem/channel-messaging-service';
import { resolveHospitalUuid } from '@/lib/hospital/resolve-hospital-context';

export type PatientChatMessage = {
  id: string;
  sender_name: string;
  sender_role: string;
  message: string;
  created_at: string;
  is_read: boolean;
};

function normalizePatientMessage(row: ChannelMessageRow): PatientChatMessage {
  return {
    id: row.id,
    sender_name: row.sender_name,
    sender_role: String(row.sender_role ?? ''),
    message: row.message,
    created_at: row.created_at,
    is_read: row.is_read,
  };
}

function matchesPatient(row: ChannelMessageRow, patientIds: string[]): boolean {
  const normalized = new Set(patientIds.map((id) => id.toLowerCase()).filter(Boolean));
  const recipient = String(row.recipient_id ?? '').toLowerCase();
  const sender = String(row.sender_id ?? '').toLowerCase();
  return normalized.has(recipient) || normalized.has(sender);
}

export async function loadPatientChannelMessages(
  supabase: SupabaseClient,
  patientIds: string[],
): Promise<PatientChatMessage[]> {
  const ids = patientIds.filter(Boolean);
  if (ids.length === 0) return [];

  const hospitalId = await resolveHospitalUuid(supabase);
  if (!hospitalId) return [];

  const [clinical, inquiries] = await Promise.all([
    loadChannelMessages(supabase, {
      channel_type: 'clinical',
      hospital_id: hospitalId,
      patient_ids: ids,
      limit: 100,
    }),
    loadChannelMessages(supabase, {
      channel_type: 'patient_inquiries',
      hospital_id: hospitalId,
      patient_ids: ids,
      limit: 100,
    }),
  ]);

  const merged = [...clinical.rows, ...inquiries.rows]
    .filter((row) => matchesPatient(row, ids))
    .map(normalizePatientMessage)
    .sort((a, b) => a.created_at.localeCompare(b.created_at));

  const seen = new Set<string>();
  return merged.filter((row) => {
    if (seen.has(row.id)) return false;
    seen.add(row.id);
    return true;
  });
}

export function subscribePatientChannelMessages(
  patientIds: string[],
  onMessage: (message: PatientChatMessage) => void,
): () => void {
  return subscribeChannelMessages({
    channel_type: 'clinical',
    onInsert: (row) => {
      if (matchesPatient(row, patientIds)) {
        onMessage(normalizePatientMessage(row));
      }
    },
  });
}

export function handlePatientChannelRealtime(
  payload: RealtimePostgresChangesPayload<Record<string, unknown>>,
  patientIds: string[],
  onMessage: (message: PatientChatMessage) => void,
): void {
  const row = payload.new as Record<string, unknown> | null;
  if (!row) return;
  const normalized = normalizePatientMessage(row as unknown as ChannelMessageRow);
  if (matchesPatient(row as unknown as ChannelMessageRow, patientIds)) {
    onMessage(normalized);
  }
}
