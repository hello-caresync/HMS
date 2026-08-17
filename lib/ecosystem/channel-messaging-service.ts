/**
 * Unified bi-directional channel_messages service.
 * Hospital ⇄ Vendor ⇄ Doctor ⇄ Patient · Supabase Realtime.
 */

import type { RealtimePostgresChangesPayload, SupabaseClient } from '@supabase/supabase-js';

import { createClient } from '@/lib/supabase/client';
import { DEFAULT_VENDOR_ID } from '@/lib/vendor-supabase/constants';
import { ALL_HOSPITALS_CODE, DEFAULT_HOSPITAL_CODE } from '@/lib/vendor/hospitals';

import { REGAL_HOSPITAL_ID } from './messaging-service';
import { ECOSYSTEM_HOSPITAL_ADMIN_ID, ECOSYSTEM_VENDOR_TARGET_ID } from './ecosystem-channels';

export const REGAL_FACILITY_CODE = 'RH-BLR-01';
export const DEFAULT_DOCTOR_EMPLOYEE_ID = 'RH-D02';
export const REALTIME_CHANNEL = 'ecosystem-channel-messages';

export type ChannelType =
  | 'vendor'
  | 'doctor'
  | 'patient'
  | 'vendor_procurement'
  | 'clinical'
  | 'patient_inquiries'
  | 'general';

export type ChannelRecipientType = 'hospital' | 'vendor' | 'doctor' | 'patient' | 'all';

export type ChannelSenderRole = 'vendor' | 'hospital_admin' | 'doctor' | 'patient';

export type ChannelPriority = 'normal' | 'high' | 'urgent';

export type ChannelMessageRow = {
  id: string;
  hospital_id: string;
  channel_type: ChannelType | string;
  recipient_type: ChannelRecipientType | string;
  recipient_id: string | null;
  sender_role: ChannelSenderRole | string;
  sender_name: string;
  subject: string | null;
  message: string;
  priority: ChannelPriority | string;
  is_read: boolean;
  created_at: string;
  /** Legacy vendor portal column */
  hospital_code?: string | null;
  vendor_id?: string | null;
  sender_id?: string | null;
};

export type SendChannelMessageInput = {
  channel_type: ChannelType;
  recipient_type: ChannelRecipientType;
  recipient_id?: string | null;
  sender_role: ChannelSenderRole;
  sender_name: string;
  message: string;
  subject?: string | null;
  priority?: ChannelPriority;
  hospital_id?: string;
  hospital_code?: string;
  sender_id?: string | null;
};

export type ChannelMessageFilter = {
  channel_type: ChannelType;
  hospital_id?: string;
  /** Vendor procurement: RH-BLR-01 facility filter */
  facility_code?: string;
  /** Clinical: doctor UUID or employee id (RH-D02) */
  doctor_ids?: string[];
  /** Clinical: patient UUID */
  patient_ids?: string[];
  /** Vendor thread */
  vendor_id?: string;
  limit?: number;
};

export type LoadChannelResult = { rows: ChannelMessageRow[]; error?: string };
export type WriteChannelResult = { ok: boolean; error?: string; row?: ChannelMessageRow };

function nowIso(): string {
  return new Date().toISOString();
}

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

function normalizeSenderRole(raw: string): string {
  const value = raw.trim().toLowerCase();
  if (value === 'hospital' || value === 'hospital_admin') return 'hospital_admin';
  if (value === 'vendors' || value === 'vendor') return 'vendor';
  if (value === 'doctor' || value === 'doctors') return 'doctor';
  if (value === 'patient' || value === 'patients') return 'patient';
  return value || 'vendor';
}

export function normalizeChannelMessageRow(row: Record<string, unknown>): ChannelMessageRow {
  const message = String(row.message ?? row.message_text ?? '').trim();
  const hospitalCode = row.hospital_code ? String(row.hospital_code) : null;

  return {
    id: String(row.id ?? ''),
    hospital_id: String(row.hospital_id ?? REGAL_HOSPITAL_ID),
    channel_type: String(row.channel_type ?? 'general'),
    recipient_type: String(row.recipient_type ?? 'all').toLowerCase(),
    recipient_id: row.recipient_id ? String(row.recipient_id) : null,
    sender_role: normalizeSenderRole(String(row.sender_role ?? 'vendor')),
    sender_name: String(row.sender_name ?? 'System'),
    subject: row.subject ? String(row.subject) : null,
    message,
    priority: String(row.priority ?? 'normal').toLowerCase(),
    is_read: Boolean(row.is_read),
    created_at: row.created_at ? String(row.created_at) : nowIso(),
    hospital_code: hospitalCode,
    vendor_id: row.vendor_id ? String(row.vendor_id) : null,
    sender_id: row.sender_id ? String(row.sender_id) : null,
  };
}

function matchesFacilityFilter(row: ChannelMessageRow, facilityCode?: string): boolean {
  if (!facilityCode || facilityCode === ALL_HOSPITALS_CODE) return true;
  const code = row.hospital_code ?? row.recipient_id ?? DEFAULT_HOSPITAL_CODE;
  if (facilityCode === DEFAULT_HOSPITAL_CODE) {
    return code === DEFAULT_HOSPITAL_CODE || code === REGAL_FACILITY_CODE;
  }
  return code === facilityCode;
}

function matchesChannelFilter(rowType: string, filterType: ChannelType | string): boolean {
  const row = rowType.toLowerCase();
  const filter = String(filterType).toLowerCase();
  if (row === filter) return true;
  if (filter === 'vendor_procurement' && (row === 'vendor' || row === 'vendor_procurement')) return true;
  if (filter === 'vendor' && (row === 'vendor' || row === 'vendor_procurement')) return true;
  if (filter === 'doctor' && (row === 'doctor' || row === 'hospital_desk')) return true;
  if (filter === 'clinical' && (row === 'clinical' || row === 'patient_direct')) return true;
  if (filter === 'patient' && (row === 'patient' || row === 'patient_inquiries')) return true;
  if (filter === 'patient_inquiries' && (row === 'patient' || row === 'patient_inquiries')) return true;
  return false;
}

function matchesClinicalFilter(row: ChannelMessageRow, doctorIds: string[], patientIds: string[]): boolean {
  const channel = String(row.channel_type ?? '').toLowerCase();
  if (channel === 'doctor' || channel === 'hospital_desk') return false;

  const doctorSet = new Set(doctorIds.map((id) => id.toLowerCase()));
  const patientSet = new Set(patientIds.map((id) => id.toLowerCase()));

  const recipient = (row.recipient_id ?? '').toLowerCase();
  const sender = (row.sender_id ?? '').toLowerCase();
  const senderRole = row.sender_role.toLowerCase();

  if (doctorSet.has(recipient) || patientSet.has(recipient)) return true;
  if (doctorSet.has(sender) || patientSet.has(sender)) return true;
  if (senderRole === 'doctor' && patientSet.has(recipient)) return true;
  if (senderRole === 'patient' && doctorSet.has(recipient)) return true;

  return false;
}

function matchesPatientHospitalFilter(row: ChannelMessageRow, patientIds: string[]): boolean {
  const channel = String(row.channel_type ?? '').toLowerCase();
  if (channel !== 'patient' && channel !== 'patient_inquiries') return false;

  const patientSet = new Set(patientIds.map((id) => id.toLowerCase()));
  const adminId = ECOSYSTEM_HOSPITAL_ADMIN_ID.toLowerCase();
  const recipient = (row.recipient_id ?? '').toLowerCase();
  const sender = (row.sender_id ?? '').toLowerCase();
  const senderRole = row.sender_role.toLowerCase();

  if (patientSet.has(recipient) || patientSet.has(sender)) return true;
  if (senderRole === 'hospital' && patientSet.has(recipient)) return true;
  if (senderRole === 'patient' && recipient === adminId) return true;

  return false;
}

export function isOutboundMessage(row: ChannelMessageRow, viewerRole: ChannelSenderRole): boolean {
  return normalizeSenderRole(String(row.sender_role)) === viewerRole;
}

export async function loadChannelMessages(
  supabase: SupabaseClient,
  filter: ChannelMessageFilter,
): Promise<LoadChannelResult> {
  const limit = filter.limit ?? 200;

  try {
    const channelTypes =
      filter.channel_type === 'vendor_procurement'
        ? ['vendor', 'vendor_procurement']
        : filter.channel_type === 'vendor'
          ? ['vendor', 'vendor_procurement']
          : filter.channel_type === 'doctor'
            ? ['doctor', 'hospital_desk']
            : filter.channel_type === 'clinical'
              ? ['clinical', 'patient_direct']
              : filter.channel_type === 'patient' || filter.channel_type === 'patient_inquiries'
                ? ['patient', 'patient_inquiries']
                : [filter.channel_type];

    let query = supabase
      .from('channel_messages')
      .select(
        'id, hospital_id, channel_type, recipient_type, recipient_id, sender_id, sender_role, sender_name, subject, message, message_text, priority, is_read, created_at, hospital_code, vendor_id',
      )
      .eq('hospital_id', filter.hospital_id ?? REGAL_HOSPITAL_ID)
      .in('channel_type', channelTypes)
      .order('created_at', { ascending: true })
      .limit(limit);

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    let rows = ((data ?? []) as Record<string, unknown>[]).map(normalizeChannelMessageRow);

    if (filter.channel_type === 'vendor_procurement') {
      const vendorId = filter.vendor_id ?? DEFAULT_VENDOR_ID;
      rows = rows.filter((row) => {
        const vendorMatch =
          row.vendor_id === vendorId ||
          row.recipient_id === vendorId ||
          row.sender_role === 'vendor' ||
          row.recipient_type === 'vendor';
        return vendorMatch && matchesFacilityFilter(row, filter.facility_code);
      });
    }

    if (filter.channel_type === 'clinical') {
      const doctorIds = filter.doctor_ids ?? [];
      const patientIds = filter.patient_ids ?? [];
      if (doctorIds.length > 0 || patientIds.length > 0) {
        rows = rows.filter((row) => matchesClinicalFilter(row, doctorIds, patientIds));
      } else {
        rows = rows.filter((row) => {
          const channel = String(row.channel_type ?? '').toLowerCase();
          return channel === 'clinical' || channel === 'patient_direct';
        });
      }
    }

    if (filter.channel_type === 'patient' || filter.channel_type === 'patient_inquiries') {
      const patientIds = filter.patient_ids ?? [];
      if (patientIds.length > 0) {
        rows = rows.filter((row) => matchesPatientHospitalFilter(row, patientIds));
      }
    }

    if (filter.channel_type === 'doctor') {
      const doctorIds = filter.doctor_ids ?? [];
      if (doctorIds.length > 0) {
        rows = rows.filter((row) => {
          const channel = String(row.channel_type ?? '').toLowerCase();
          if (channel !== 'doctor' && channel !== 'hospital_desk') return false;
          const employeeId = doctorIds.find((id) => id.toLowerCase().startsWith('rh-d')) ?? doctorIds[0];
          const recipient = (row.recipient_id ?? '').toLowerCase();
          const sender = (row.sender_id ?? '').toLowerCase();
          const adminId = ECOSYSTEM_HOSPITAL_ADMIN_ID.toLowerCase();
          const docSet = new Set(doctorIds.map((id) => id.toLowerCase()));
          return (
            docSet.has(recipient) ||
            docSet.has(sender) ||
            (sender === employeeId?.toLowerCase() && recipient === adminId)
          );
        });
      }
    }

    return { rows };
  } catch (error) {
    return { rows: [], error: errorMessage(error, 'Could not load channel messages') };
  }
}

export async function sendChannelMessage(
  supabase: SupabaseClient,
  input: SendChannelMessageInput,
): Promise<WriteChannelResult> {
  const trimmed = input.message.trim();
  if (!trimmed) return { ok: false, error: 'Message cannot be empty.' };

  const facilityCode = input.hospital_code ?? REGAL_FACILITY_CODE;
  const payload: Record<string, unknown> = {
    hospital_id: input.hospital_id ?? REGAL_HOSPITAL_ID,
    channel_type: input.channel_type,
    recipient_type: input.recipient_type,
    recipient_id: input.recipient_id ?? null,
    sender_role: normalizeSenderRole(input.sender_role),
    sender_name: input.sender_name.trim(),
    subject: input.subject?.trim() || null,
    message: trimmed,
    message_text: trimmed,
    priority: input.priority ?? 'normal',
    is_read: false,
    hospital_code: facilityCode,
    created_at: nowIso(),
  };

  if (input.sender_id) {
    payload.sender_id = input.sender_id;
  }

  if (input.channel_type === 'vendor_procurement') {
    payload.vendor_id =
      input.recipient_type === 'vendor' ? input.recipient_id ?? DEFAULT_VENDOR_ID : DEFAULT_VENDOR_ID;
  }

  try {
    const { data, error } = await supabase.from('channel_messages').insert(payload).select('*').single();
    if (error) throw new Error(error.message);
    return { ok: true, row: normalizeChannelMessageRow((data ?? payload) as Record<string, unknown>) };
  } catch (error) {
    return { ok: false, error: errorMessage(error, 'Could not send message') };
  }
}

export async function markChannelMessageRead(
  supabase: SupabaseClient,
  messageId: string,
): Promise<boolean> {
  const { error } = await supabase
    .from('channel_messages')
    .update({ is_read: true })
    .eq('id', messageId);
  return !error;
}

export async function markChannelThreadRead(
  supabase: SupabaseClient,
  filter: ChannelMessageFilter,
  viewerRole: ChannelSenderRole,
): Promise<void> {
  const result = await loadChannelMessages(supabase, filter);
  const unreadIds = result.rows
    .filter((row) => !row.is_read && !isOutboundMessage(row, viewerRole))
    .map((row) => row.id);
  if (unreadIds.length === 0) return;
  await supabase.from('channel_messages').update({ is_read: true }).in('id', unreadIds);
}

/* ── Convenience send helpers ─────────────────────────────────────────────── */

export async function sendVendorProcurementMessage(
  supabase: SupabaseClient,
  input: {
    message: string;
    sender_role: 'vendor' | 'hospital_admin';
    sender_name: string;
    facility_code?: string;
    vendor_id?: string;
    subject?: string;
  },
): Promise<WriteChannelResult> {
  const facility = input.facility_code ?? REGAL_FACILITY_CODE;
  const vendorId = input.vendor_id ?? DEFAULT_VENDOR_ID;

  if (input.sender_role === 'vendor') {
    return sendChannelMessage(supabase, {
      channel_type: 'vendor',
      recipient_type: 'hospital',
      recipient_id: ECOSYSTEM_HOSPITAL_ADMIN_ID,
      sender_role: 'vendor',
      sender_name: input.sender_name,
      sender_id: vendorId,
      message: input.message,
      subject: input.subject,
      hospital_code: facility,
    });
  }

  return sendChannelMessage(supabase, {
    channel_type: 'vendor',
    recipient_type: 'vendor',
    recipient_id: ECOSYSTEM_VENDOR_TARGET_ID,
    sender_role: 'hospital_admin',
    sender_name: input.sender_name,
    sender_id: ECOSYSTEM_HOSPITAL_ADMIN_ID,
    message: input.message,
    subject: input.subject,
    hospital_code: facility,
  });
}

export async function sendPatientHospitalMessage(
  supabase: SupabaseClient,
  input: {
    message: string;
    sender_role: 'patient' | 'hospital_admin';
    sender_name: string;
    sender_id: string;
    patient_id: string;
  },
): Promise<WriteChannelResult> {
  if (input.sender_role === 'patient') {
    return sendChannelMessage(supabase, {
      channel_type: 'patient',
      recipient_type: 'hospital',
      recipient_id: ECOSYSTEM_HOSPITAL_ADMIN_ID,
      sender_role: 'patient',
      sender_name: input.sender_name,
      sender_id: input.sender_id,
      message: input.message,
    });
  }

  return sendChannelMessage(supabase, {
    channel_type: 'patient',
    recipient_type: 'patient',
    recipient_id: input.patient_id,
    sender_role: 'hospital_admin',
    sender_name: input.sender_name,
    sender_id: ECOSYSTEM_HOSPITAL_ADMIN_ID,
    message: input.message,
  });
}

export async function sendClinicalMessage(
  supabase: SupabaseClient,
  input: {
    message: string;
    sender_role: 'doctor' | 'patient';
    sender_name: string;
    doctor_id: string;
    patient_id: string;
    subject?: string;
    priority?: ChannelPriority;
  },
): Promise<WriteChannelResult> {
  if (input.sender_role === 'patient') {
    return sendChannelMessage(supabase, {
      channel_type: 'clinical',
      recipient_type: 'doctor',
      recipient_id: input.doctor_id,
      sender_role: 'patient',
      sender_name: input.sender_name,
      sender_id: input.patient_id,
      message: input.message,
      subject: input.subject,
      priority: input.priority,
    });
  }

  return sendChannelMessage(supabase, {
    channel_type: 'clinical',
    recipient_type: 'patient',
    recipient_id: input.patient_id,
    sender_role: 'doctor',
    sender_name: input.sender_name,
    sender_id: input.doctor_id,
    message: input.message,
    subject: input.subject,
    priority: input.priority,
  });
}

/* ── Realtime ─────────────────────────────────────────────────────────────── */

export type ChannelRealtimeOptions = {
  channel_type?: ChannelType;
  onInsert?: (row: ChannelMessageRow) => void;
  onUpdate?: (row: ChannelMessageRow) => void;
  onConnectionChange?: (connected: boolean) => void;
};

export function subscribeChannelMessages(options: ChannelRealtimeOptions = {}): () => void {
  const supabase = createClient();
  const channelName = `${REALTIME_CHANNEL}-${options.channel_type ?? 'all'}-${Date.now()}`;

  try {
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'channel_messages' },
        (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
          const row = normalizeChannelMessageRow((payload.new ?? {}) as Record<string, unknown>);
          if (options.channel_type && !matchesChannelFilter(String(row.channel_type), options.channel_type)) return;
          options.onInsert?.(row);
        },
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'channel_messages' },
        (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
          const row = normalizeChannelMessageRow((payload.new ?? {}) as Record<string, unknown>);
          if (options.channel_type && !matchesChannelFilter(String(row.channel_type), options.channel_type)) return;
          options.onUpdate?.(row);
        },
      )
      .subscribe((status) => {
        options.onConnectionChange?.(status === 'SUBSCRIBED');
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  } catch {
    return () => {};
  }
}

export function formatMessageTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatMessageClock(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
