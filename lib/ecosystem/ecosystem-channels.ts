/**
 * Multi-channel ecosystem messaging · Hospital ⇄ Vendor / Doctor / Patient
 * channel_type: vendor | doctor | patient
 */

import type { RealtimePostgresChangesPayload, SupabaseClient } from '@supabase/supabase-js';

import { createClient } from '@/lib/supabase/client';
import { REGAL_HOSPITAL_ID } from '@/lib/ecosystem/messaging-service';
import { DEFAULT_VENDOR_ID } from '@/lib/vendor-supabase/constants';
import {
  buildDoctorToHospitalPayload,
  buildHospitalToDoctorPayload,
  HOSPITAL_ADMIN_ID,
  HOSPITAL_ADMIN_SENDER_NAME,
  isHospitalAdminRole,
  matchesHospitalDoctorThread,
} from '@/lib/ecosystem/hospital-doctor-messaging';

export const ECOSYSTEM_HOSPITAL_ADMIN_ID = HOSPITAL_ADMIN_ID;
export const ECOSYSTEM_VENDOR_TARGET_ID = 'VENDOR-01';
export const HOSPITAL_SENDER_NAME = HOSPITAL_ADMIN_SENDER_NAME;

export type EcosystemChannelTab = 'vendor' | 'doctor' | 'patient';

export type EcosystemChannelMessage = {
  id: string;
  channel_type: EcosystemChannelTab | string;
  sender_role: 'hospital' | 'vendor' | 'doctor' | 'patient' | string;
  sender_id: string | null;
  sender_name: string;
  recipient_type: string;
  recipient_id: string | null;
  message: string;
  created_at: string;
  is_read: boolean;
  hospital_id?: string;
};

export type EcosystemChannelContext = {
  doctorId?: string;
  patientUhid?: string;
  limit?: number;
};

const LEGACY_VENDOR_TYPES = ['vendor', 'vendor_procurement'];
/** Strict: doctor admin desk only — NEVER include 'clinical' (doctor↔patient care) */
const LEGACY_DOCTOR_TYPES = ['doctor', 'hospital_desk'];
/** Strict: hospital↔patient inquiries only — NEVER include 'clinical' or 'doctor' */
const LEGACY_PATIENT_TYPES = ['patient', 'patient_inquiries'];

function normalizeRow(row: Record<string, unknown>): EcosystemChannelMessage {
  const rawRole = String(row.sender_role ?? 'vendor').toLowerCase();
  let sender_role: EcosystemChannelMessage['sender_role'] = rawRole;
  if (rawRole === 'hospital_admin') sender_role = 'hospital';
  if (rawRole === 'vendors') sender_role = 'vendor';

  return {
    id: String(row.id ?? ''),
    channel_type: normalizeChannelType(String(row.channel_type ?? 'vendor')),
    sender_role,
    sender_id: row.sender_id ? String(row.sender_id) : null,
    sender_name: String(row.sender_name ?? 'Unknown'),
    recipient_type: String(row.recipient_type ?? 'all').toLowerCase(),
    recipient_id: row.recipient_id ? String(row.recipient_id) : null,
    message: String(row.message ?? row.message_text ?? '').trim(),
    created_at: row.created_at ? String(row.created_at) : new Date().toISOString(),
    is_read: Boolean(row.is_read),
    hospital_id: row.hospital_id ? String(row.hospital_id) : REGAL_HOSPITAL_ID,
  };
}

export function normalizeChannelType(raw: string): EcosystemChannelTab {
  const value = raw.toLowerCase();
  if (LEGACY_VENDOR_TYPES.includes(value) || value === 'vendor') return 'vendor';
  if (
    LEGACY_DOCTOR_TYPES.includes(value) ||
    value === 'doctor' ||
    value === 'hospital_desk'
  ) {
    return 'doctor';
  }
  if (LEGACY_PATIENT_TYPES.includes(value) || value === 'patient') return 'patient';
  return 'vendor';
}

function channelTypeFilter(channel: EcosystemChannelTab): string[] {
  if (channel === 'vendor') return LEGACY_VENDOR_TYPES;
  if (channel === 'doctor') return LEGACY_DOCTOR_TYPES;
  return LEGACY_PATIENT_TYPES;
}

function matchesDoctorThread(row: EcosystemChannelMessage, doctorId: string): boolean {
  return matchesHospitalDoctorThread(row, doctorId);
}

function matchesPatientThread(row: EcosystemChannelMessage, uhid: string): boolean {
  const id = uhid.toLowerCase();
  return (
    row.recipient_id?.toLowerCase() === id ||
    row.sender_id?.toLowerCase() === id ||
    (row.sender_role === 'patient' &&
      row.recipient_id?.toLowerCase() === ECOSYSTEM_HOSPITAL_ADMIN_ID.toLowerCase())
  );
}

export function isHospitalSender(role: string): boolean {
  return isHospitalAdminRole(role);
}

export async function loadEcosystemChannelMessages(
  supabase: SupabaseClient,
  channel: EcosystemChannelTab,
  context: EcosystemChannelContext = {},
): Promise<{ rows: EcosystemChannelMessage[]; error?: string }> {
  const limit = context.limit ?? 300;
  const types = channelTypeFilter(channel);

  try {
    const { data, error } = await supabase
      .from('channel_messages')
      .select(
        'id, channel_type, sender_role, sender_id, sender_name, recipient_type, recipient_id, message, message_text, is_read, created_at, hospital_id',
      )
      .in('channel_type', types)
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) throw new Error(error.message);

    let rows = ((data ?? []) as Record<string, unknown>[]).map(normalizeRow);

    if (channel === 'doctor' && context.doctorId) {
      rows = rows.filter((row) => matchesDoctorThread(row, context.doctorId!));
    }

    if (channel === 'patient' && context.patientUhid) {
      rows = rows.filter((row) => matchesPatientThread(row, context.patientUhid!));
    }

    return { rows };
  } catch (error) {
    return {
      rows: [],
      error: error instanceof Error ? error.message : 'Could not load channel messages',
    };
  }
}

export async function sendHospitalEcosystemMessage(
  supabase: SupabaseClient,
  input: {
    channel: EcosystemChannelTab;
    message: string;
    recipientId: string;
    recipientType: EcosystemChannelTab;
  },
): Promise<{ ok: boolean; error?: string; row?: EcosystemChannelMessage }> {
  const trimmed = input.message.trim();
  if (!trimmed) return { ok: false, error: 'Message cannot be empty.' };

  let payload: Record<string, unknown>;

  if (input.channel === 'doctor') {
    payload = buildHospitalToDoctorPayload({
      doctorId: input.recipientId,
      message: trimmed,
      hospitalId: REGAL_HOSPITAL_ID,
    });
  } else if (input.channel === 'patient') {
    payload = {
      hospital_id: REGAL_HOSPITAL_ID,
      facility_code: 'RH-BLR-01',
      hospital_code: 'RH-BLR-01',
      channel_type: 'patient',
      sender_role: 'hospital',
      sender_id: ECOSYSTEM_HOSPITAL_ADMIN_ID,
      sender_name: HOSPITAL_SENDER_NAME,
      recipient_type: 'patient',
      recipient_id: input.recipientId,
      message: trimmed,
      message_text: trimmed,
      priority: 'normal',
      is_read: false,
      created_at: new Date().toISOString(),
    };
  } else if (input.channel === 'vendor') {
    payload = {
      hospital_id: REGAL_HOSPITAL_ID,
      facility_code: 'RH-BLR-01',
      hospital_code: 'RH-BLR-01',
      channel_type: 'vendor',
      sender_role: 'hospital',
      sender_id: ECOSYSTEM_HOSPITAL_ADMIN_ID,
      sender_name: HOSPITAL_SENDER_NAME,
      recipient_type: 'vendor',
      recipient_id: input.recipientId,
      message: trimmed,
      message_text: trimmed,
      priority: 'normal',
      is_read: false,
      created_at: new Date().toISOString(),
      vendor_id: DEFAULT_VENDOR_ID,
    };
  } else {
    return { ok: false, error: `Unsupported channel: ${input.channel}` };
  }

  try {
    const { data, error } = await supabase.from('channel_messages').insert(payload).select('*').single();
    if (error) throw new Error(error.message);
    return { ok: true, row: normalizeRow((data ?? payload) as Record<string, unknown>) };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Send failed' };
  }
}

export async function sendPartnerEcosystemMessage(
  supabase: SupabaseClient,
  input: {
    channel: EcosystemChannelTab;
    sender_role: 'vendor' | 'doctor' | 'patient';
    sender_id: string;
    sender_name: string;
    message: string;
  },
): Promise<{ ok: boolean; error?: string; row?: EcosystemChannelMessage }> {
  const trimmed = input.message.trim();
  if (!trimmed) return { ok: false, error: 'Message cannot be empty.' };

  const payload: Record<string, unknown> =
    input.sender_role === 'doctor'
      ? buildDoctorToHospitalPayload({
          doctorId: input.sender_id,
          doctorName: input.sender_name,
          message: trimmed,
          hospitalId: REGAL_HOSPITAL_ID,
        })
      : {
          hospital_id: REGAL_HOSPITAL_ID,
          facility_code: 'RH-BLR-01',
          hospital_code: 'RH-BLR-01',
          channel_type: input.channel,
          sender_role: input.sender_role,
          sender_id: input.sender_id,
          sender_name: input.sender_name,
          recipient_type: 'hospital',
          recipient_id: ECOSYSTEM_HOSPITAL_ADMIN_ID,
          message: trimmed,
          message_text: trimmed,
          priority: 'normal',
          is_read: false,
          created_at: new Date().toISOString(),
        };

  if (input.channel === 'vendor') {
    payload.vendor_id = DEFAULT_VENDOR_ID;
  }

  try {
    const { data, error } = await supabase.from('channel_messages').insert(payload).select('*').single();
    if (error) throw new Error(error.message);
    return { ok: true, row: normalizeRow((data ?? payload) as Record<string, unknown>) };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Send failed' };
  }
}

export function countUnreadForChannel(
  rows: EcosystemChannelMessage[],
  channel: EcosystemChannelTab,
  context: EcosystemChannelContext = {},
): number {
  let filtered = rows.filter((row) => normalizeChannelType(String(row.channel_type)) === channel);
  if (channel === 'doctor' && context.doctorId) {
    filtered = filtered.filter((row) => matchesDoctorThread(row, context.doctorId!));
  }
  if (channel === 'patient' && context.patientUhid) {
    filtered = filtered.filter((row) => matchesPatientThread(row, context.patientUhid!));
  }
  return filtered.filter((row) => !row.is_read && !isHospitalSender(String(row.sender_role))).length;
}

export function subscribeEcosystemChannel(
  channel: EcosystemChannelTab,
  onInsert: (row: EcosystemChannelMessage) => void,
): () => void {
  const supabase = createClient();
  const channelName = `ecosystem-hub-${channel}-${Date.now()}`;

  try {
    const sub = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'channel_messages' },
        (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
          const raw = (payload.new ?? {}) as Record<string, unknown>;
          const row = normalizeRow(raw);
          const rawChannel = String(raw.channel_type ?? '').toLowerCase();
          const normalized = normalizeChannelType(rawChannel);
          const channelMatch =
            normalized === channel ||
            (channel === 'doctor' && rawChannel === 'hospital_desk');
          if (!channelMatch) return;
          onInsert(row);
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(sub);
    };
  } catch {
    return () => {};
  }
}

export function formatChannelTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
