/**
 * Doctor Secure Messages · hospital_desk ⇄ patient_direct
 * Persists to channel_messages; normalizes legacy doctor/clinical/patient rows.
 */

import type { RealtimePostgresChangesPayload, SupabaseClient } from '@supabase/supabase-js';

import { createClient } from '@/lib/supabase/client';
import { REGAL_HOSPITAL_ID } from '@/lib/ecosystem/messaging-service';
import {
  buildDoctorToHospitalPayload,
  HOSPITAL_ADMIN_ID,
  HOSPITAL_ADMIN_SENDER_NAME,
  LEGACY_HOSPITAL_DOCTOR_CHANNEL_TYPES,
  isHospitalAdminRole,
  matchesHospitalDoctorThread,
} from '@/lib/ecosystem/hospital-doctor-messaging';
import { ECOSYSTEM_HOSPITAL_ADMIN_ID } from '@/lib/ecosystem/ecosystem-channels';

export type DoctorMessageTab = 'hospital_desk' | 'patient_direct';

export type DoctorSenderRole = 'DOCTOR' | 'HOSPITAL_ADMIN' | 'PATIENT';

export type DoctorSecureMessage = {
  id: string;
  channel_type: DoctorMessageTab | string;
  sender_role: DoctorSenderRole;
  sender_name: string;
  sender_id: string | null;
  recipient_id: string | null;
  recipient_name: string | null;
  patient_id: string | null;
  patient_name: string | null;
  content: string;
  created_at: string;
  optimistic?: boolean;
};

export type DoctorThread = {
  id: string;
  label: string;
  patient_id: string | null;
  patient_name: string | null;
  latestPreview: string;
  latestAt: string;
  messages: DoctorSecureMessage[];
  isHospitalDesk?: boolean;
};

export type ActiveDoctorProfile = {
  employee_id: string;
  full_name: string;
  department: string;
  uuid?: string;
};

const HOSPITAL_DESK_TYPES = ['doctor', ...LEGACY_HOSPITAL_DOCTOR_CHANNEL_TYPES];
/** Doctor↔patient care threads only — never hospital `patient` channel */
const PATIENT_DIRECT_TYPES = ['patient_direct', 'clinical'];

const NON_PATIENT_IDS = new Set([
  ECOSYSTEM_HOSPITAL_ADMIN_ID.toLowerCase(),
  'rh-admin',
  'vendor-01',
  'rh-blr-01',
  REGAL_HOSPITAL_ID.toLowerCase(),
]);

function normalizeSenderRole(raw: string): DoctorSenderRole {
  const value = raw.trim().toUpperCase();
  if (value === 'DOCTOR' || value === 'DOCTORS') return 'DOCTOR';
  if (value === 'HOSPITAL' || value === 'HOSPITAL_ADMIN') return 'HOSPITAL_ADMIN';
  if (value === 'PATIENT' || value === 'PATIENTS') return 'PATIENT';
  if (raw.toLowerCase() === 'doctor') return 'DOCTOR';
  if (raw.toLowerCase() === 'patient') return 'PATIENT';
  if (raw.toLowerCase() === 'hospital' || raw.toLowerCase() === 'hospital_admin') return 'HOSPITAL_ADMIN';
  return 'HOSPITAL_ADMIN';
}

function isHospitalDeskRow(row: Record<string, unknown>, doctorIds?: Set<string>): boolean {
  const employeeId = doctorIds
    ? [...doctorIds].find((id) => id.toLowerCase().startsWith('rh-d'))
    : undefined;

  if (employeeId && matchesHospitalDoctorThread(row, employeeId)) return true;

  const channel = String(row.channel_type ?? '').toLowerCase();
  if (channel !== 'doctor' && channel !== 'hospital_desk' && !HOSPITAL_DESK_TYPES.includes(channel)) {
    return false;
  }

  const recipient = String(row.recipient_id ?? '').toLowerCase();
  const senderRole = String(row.sender_role ?? '').toLowerCase();

  if (recipient === HOSPITAL_ADMIN_ID.toLowerCase()) return true;
  if (isHospitalAdminRole(senderRole)) return recipient.startsWith('rh-d');
  return senderRole === 'doctor' && recipient === HOSPITAL_ADMIN_ID.toLowerCase();
}

function isPatientDirectRow(row: Record<string, unknown>, doctorIds?: Set<string>): boolean {
  const channel = String(row.channel_type ?? '').toLowerCase();
  if (isHospitalDeskRow(row, doctorIds)) return false;
  if (channel === 'patient_direct') return true;
  if (!PATIENT_DIRECT_TYPES.includes(channel)) return false;
  return true;
}

function doctorIdSet(doctor: ActiveDoctorProfile): Set<string> {
  const ids = [doctor.employee_id, doctor.uuid].filter(Boolean) as string[];
  return new Set(ids.map((id) => id.toLowerCase()));
}

function involvesDoctor(row: Record<string, unknown>, doctorIds: Set<string>): boolean {
  const sender = String(row.sender_id ?? '').toLowerCase();
  const recipient = String(row.recipient_id ?? '').toLowerCase();
  const senderRole = String(row.sender_role ?? '').toLowerCase();
  if (doctorIds.has(sender) || doctorIds.has(recipient)) return true;
  if (senderRole === 'doctor') return true;
  return false;
}

function normalizeRow(
  row: Record<string, unknown>,
  tab: DoctorMessageTab,
  patientNames: Map<string, string>,
): DoctorSecureMessage {
  const senderRole = normalizeSenderRole(String(row.sender_role ?? ''));
  const content = String(row.message ?? row.message_text ?? row.content ?? '').trim();
  const subject = row.subject ? String(row.subject) : null;

  let patientId: string | null = null;
  let patientName: string | null = null;

  if (tab === 'patient_direct') {
    const senderId = row.sender_id ? String(row.sender_id) : null;
    const recipientId = row.recipient_id ? String(row.recipient_id) : null;

    if (senderRole === 'PATIENT' && senderId && !NON_PATIENT_IDS.has(senderId.toLowerCase())) {
      patientId = senderId;
    } else if (recipientId && !NON_PATIENT_IDS.has(recipientId.toLowerCase())) {
      patientId = recipientId;
    } else if (senderId && !NON_PATIENT_IDS.has(senderId.toLowerCase())) {
      patientId = senderId;
    }

    if (patientId) {
      patientName =
        patientNames.get(patientId) ??
        patientNames.get(patientId.toLowerCase()) ??
        (senderRole === 'PATIENT' ? String(row.sender_name ?? '') : null) ??
        subject;
    }
  }

  return {
    id: String(row.id ?? `tmp-${Date.now()}`),
    channel_type: tab,
    sender_role: senderRole,
    sender_name: String(row.sender_name ?? 'Unknown'),
    sender_id: row.sender_id ? String(row.sender_id) : null,
    recipient_id: row.recipient_id ? String(row.recipient_id) : null,
    recipient_name:
      tab === 'hospital_desk'
        ? 'Hospital Operations Desk'
        : patientName ?? (row.recipient_id ? String(row.recipient_id) : null),
    patient_id: patientId,
    patient_name: patientName,
    content,
    created_at: row.created_at ? String(row.created_at) : new Date().toISOString(),
  };
}

async function loadPatientNameMap(
  supabase: SupabaseClient,
  ids: string[],
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  const unique = [...new Set(ids.filter(Boolean))];
  if (unique.length === 0) return map;

  try {
    const { data: byId } = await supabase
      .from('patient_profiles')
      .select('id, full_name, uhid')
      .in('id', unique);

    for (const row of byId ?? []) {
      const id = String(row.id ?? '');
      const name = String(row.full_name ?? 'Patient');
      if (id) map.set(id, name);
    }

    const { data: byUhid } = await supabase
      .from('patient_profiles')
      .select('id, full_name, uhid')
      .in('uhid', unique);

    for (const row of byUhid ?? []) {
      const uhid = String(row.uhid ?? '');
      const name = String(row.full_name ?? 'Patient');
      if (uhid) map.set(uhid, name);
      if (row.id) map.set(String(row.id), name);
    }
  } catch {
    /* name lookup is best-effort */
  }

  return map;
}

function collectPatientIds(rows: Record<string, unknown>[]): string[] {
  const ids: string[] = [];
  for (const row of rows) {
    for (const key of ['sender_id', 'recipient_id'] as const) {
      const value = row[key] ? String(row[key]) : '';
      if (value && !NON_PATIENT_IDS.has(value.toLowerCase())) ids.push(value);
    }
  }
  return ids;
}

export async function loadDoctorSecureMessages(
  supabase: SupabaseClient,
  tab: DoctorMessageTab,
  doctor: ActiveDoctorProfile,
): Promise<{ messages: DoctorSecureMessage[]; error?: string }> {
  const doctorIds = doctorIdSet(doctor);
  const channelTypes = tab === 'hospital_desk' ? HOSPITAL_DESK_TYPES : PATIENT_DIRECT_TYPES;

  try {
    const { data, error } = await supabase
      .from('channel_messages')
      .select('*')
      .in('channel_type', channelTypes)
      .order('created_at', { ascending: true })
      .limit(500);

    if (error) throw new Error(error.message);

    const rawRows = ((data ?? []) as Record<string, unknown>[]).filter((row) => {
      if (!involvesDoctor(row, doctorIds)) return false;
      return tab === 'hospital_desk'
        ? isHospitalDeskRow(row, doctorIds)
        : isPatientDirectRow(row, doctorIds);
    });

    const patientNames = await loadPatientNameMap(supabase, collectPatientIds(rawRows));
    const messages = rawRows.map((row) => normalizeRow(row, tab, patientNames));
    return { messages };
  } catch (err) {
    return {
      messages: [],
      error: err instanceof Error ? err.message : 'Could not load messages',
    };
  }
}

export function buildDoctorThreads(
  tab: DoctorMessageTab,
  messages: DoctorSecureMessage[],
): DoctorThread[] {
  if (tab === 'hospital_desk') {
    const sorted = [...messages].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    );
    const latest = sorted[sorted.length - 1];
    return [
      {
        id: 'hospital-desk',
        label: 'Regal Hospital Operations Desk',
        patient_id: null,
        patient_name: null,
        latestPreview: latest?.content ?? 'No messages yet',
        latestAt: latest?.created_at ?? '',
        messages: sorted,
        isHospitalDesk: true,
      },
    ];
  }

  const grouped = new Map<string, DoctorSecureMessage[]>();
  for (const message of messages) {
    const key = message.patient_id ?? message.patient_name ?? message.sender_name;
    if (!key || key.toLowerCase() === ECOSYSTEM_HOSPITAL_ADMIN_ID.toLowerCase()) continue;
    const list = grouped.get(key) ?? [];
    list.push(message);
    grouped.set(key, list);
  }

  return Array.from(grouped.entries())
    .map(([key, rows]) => {
      const sorted = [...rows].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      );
      const latest = sorted[sorted.length - 1];
      const patientName =
        latest.patient_name ??
        sorted.find((row) => row.patient_name)?.patient_name ??
        (latest.sender_role === 'PATIENT' ? latest.sender_name : null) ??
        'Patient';

      return {
        id: key,
        label: patientName,
        patient_id: latest.patient_id ?? key,
        patient_name: patientName,
        latestPreview: latest.content,
        latestAt: latest.created_at,
        messages: sorted,
      };
    })
    .sort((a, b) => new Date(b.latestAt).getTime() - new Date(a.latestAt).getTime());
}

export async function sendDoctorSecureMessage(
  supabase: SupabaseClient,
  input: {
    tab: DoctorMessageTab;
    doctor: ActiveDoctorProfile;
    text: string;
    thread: DoctorThread;
  },
): Promise<{ ok: boolean; error?: string; message?: DoctorSecureMessage }> {
  const trimmed = input.text.trim();
  if (!trimmed) return { ok: false, error: 'Message cannot be empty.' };

  const payload: Record<string, unknown> =
    input.tab === 'hospital_desk'
      ? buildDoctorToHospitalPayload({
          doctorId: input.doctor.employee_id,
          doctorName: input.doctor.full_name,
          message: trimmed,
          hospitalId: REGAL_HOSPITAL_ID,
        })
      : {
          hospital_id: REGAL_HOSPITAL_ID,
          facility_code: 'RH-BLR-01',
          hospital_code: 'RH-BLR-01',
          channel_type: 'patient_direct',
          sender_role: 'doctor',
          sender_id: input.doctor.employee_id,
          sender_name: input.doctor.full_name,
          recipient_type: 'patient',
          recipient_id: input.thread.patient_id,
          recipient_name: input.thread.patient_name,
          subject: input.thread.patient_name,
          message: trimmed,
          message_text: trimmed,
          priority: 'normal',
          is_read: false,
          created_at: new Date().toISOString(),
        };

  if (input.tab !== 'hospital_desk' && !input.thread.patient_id) {
    return { ok: false, error: 'Select a patient thread.' };
  }

  try {
    const { data, error } = await supabase.from('channel_messages').insert(payload).select('*').single();
    if (error) throw new Error(error.message);

    const patientNames = new Map<string, string>();
    if (input.thread.patient_id && input.thread.patient_name) {
      patientNames.set(input.thread.patient_id, input.thread.patient_name);
    }

    return {
      ok: true,
      message: normalizeRow((data ?? payload) as Record<string, unknown>, input.tab, patientNames),
    };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Send failed' };
  }
}

export function subscribeDoctorSecureMessages(
  tab: DoctorMessageTab,
  doctor: ActiveDoctorProfile,
  onInsert: (message: DoctorSecureMessage) => void,
): () => void {
  const supabase = createClient();
  const doctorIds = doctorIdSet(doctor);
  const channelTypes = tab === 'hospital_desk' ? HOSPITAL_DESK_TYPES : PATIENT_DIRECT_TYPES;

  try {
    const sub = supabase
      .channel(`doctor-secure-${tab}-${Date.now()}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'channel_messages' },
        (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
          const row = (payload.new ?? {}) as Record<string, unknown>;
          const channel = String(row.channel_type ?? '').toLowerCase();
          if (!channelTypes.includes(channel) && channel !== tab) return;
          if (!involvesDoctor(row, doctorIds)) return;
          if (tab === 'hospital_desk' ? !isHospitalDeskRow(row, doctorIds) : !isPatientDirectRow(row, doctorIds)) return;

          void loadPatientNameMap(supabase, collectPatientIds([row])).then((patientNames) => {
            onInsert(normalizeRow(row, tab, patientNames));
          });
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

export function formatThreadTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function formatThreadDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const HOSPITAL_DESK_LABEL = 'Regal Hospital Operations Desk';
