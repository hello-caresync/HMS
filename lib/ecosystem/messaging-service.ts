import type { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';

import { createClient } from '@/lib/supabase/client';

/** Shared Regal Hospital facility UUID (RH-BLR-01). */
export const REGAL_HOSPITAL_ID = '11111111-1111-1111-1111-111111111111';

export type EcosystemApp = 'hospital' | 'doctor' | 'patient' | 'vendor';

export type RecipientType = 'doctor' | 'patient' | 'vendor' | 'all';

export type NotificationPriority = 'normal' | 'high' | 'urgent';

export type NotificationCategory =
  | 'Announcement'
  | 'Alert'
  | 'Clinical'
  | 'Billing'
  | 'Supply'
  | string;

export type NotificationStatus = 'Delivered' | 'Pending' | 'Read';

export const REGAL_FACILITY_CODE = 'RH-BLR-01';
export const REGAL_OPERATIONS_SENDER = 'Regal Hospital Operations Desk';

export type SystemNotificationRow = {
  id: string;
  hospital_id?: string;
  facility_code?: string;
  recipient_type: RecipientType | string;
  recipient_id?: string | null;
  sender_role?: string;
  sender_name?: string;
  category?: NotificationCategory;
  priority?: string;
  title: string;
  message: string;
  status?: NotificationStatus | string;
  is_read?: boolean;
  created_at?: string;
  subject?: string;
  body?: string;
  target_app?: string;
  recipient_name?: string;
  delivery_status?: string;
};

export type SystemEventRow = {
  id: string;
  hospital_id?: string;
  event_type: string;
  source_app?: string;
  payload?: Record<string, unknown>;
  severity?: string;
  target_roles?: string[];
  created_at?: string;
};

export type DispatchNotificationInput = {
  recipient_type: RecipientType;
  recipient_id?: string | null;
  recipient_name?: string;
  title: string;
  message: string;
  category?: string;
  priority?: NotificationPriority | string;
  sender_role?: string;
  target_app?: string;
};

export type EmitSystemEventInput = {
  event_type: string;
  source_app: EcosystemApp | string;
  payload?: Record<string, unknown>;
  severity?: 'info' | 'warning' | 'critical';
  target_roles?: string[];
};

function normalizeRecipientType(raw: string): RecipientType {
  const value = raw.trim().toLowerCase();
  if (value === 'doctor' || value === 'patient' || value === 'vendor' || value === 'all') {
    return value;
  }
  if (raw === 'Doctor') return 'doctor';
  if (raw === 'Patient') return 'patient';
  if (raw === 'Vendor') return 'vendor';
  return 'all';
}

export function mapHospitalPriority(priority: string): NotificationPriority {
  if (priority === 'Urgent (Push Alarm)') return 'urgent';
  if (priority === 'High') return 'high';
  return 'normal';
}

export function mapHospitalRecipientType(
  recipientType: 'Patient' | 'Doctor' | 'Vendor' | 'All',
): RecipientType {
  if (recipientType === 'Doctor') return 'doctor';
  if (recipientType === 'Patient') return 'patient';
  if (recipientType === 'Vendor') return 'vendor';
  return 'all';
}

export function resolveTargetApp(recipientType: RecipientType): string {
  if (recipientType === 'doctor') return 'Doctor App';
  if (recipientType === 'patient') return 'Patients App';
  if (recipientType === 'vendor') return 'Vendor App';
  return 'Broadcast All';
}

export function isBroadcastRecipientId(recipientId?: string | null): boolean {
  const value = String(recipientId ?? '').trim().toLowerCase();
  return !value || value === 'all' || value === 'broadcast';
}

export function notificationMatchesRecipient(
  row: SystemNotificationRow,
  app: Exclude<EcosystemApp, 'hospital'>,
  recipientId?: string,
): boolean {
  const type = normalizeRecipientType(String(row.recipient_type ?? 'all'));
  if (type !== 'all' && type !== app) return false;

  const targetId = String(row.recipient_id ?? '').trim();
  if (isBroadcastRecipientId(targetId)) return true;
  if (!recipientId) return type === 'all';

  return targetId.toLowerCase() === recipientId.toLowerCase();
}

export function normalizeNotificationRow(row: Record<string, unknown>): SystemNotificationRow {
  const title = String(row.title ?? row.subject ?? 'Notification');
  const message = String(row.message ?? row.body ?? '');
  const status = String(row.status ?? row.delivery_status ?? 'Delivered');

  return {
    id: String(row.id ?? ''),
    hospital_id: row.hospital_id ? String(row.hospital_id) : REGAL_HOSPITAL_ID,
    facility_code: row.facility_code
      ? String(row.facility_code)
      : row.facility
        ? String(row.facility)
        : REGAL_FACILITY_CODE,
    recipient_type: normalizeRecipientType(String(row.recipient_type ?? 'all')),
    recipient_id: row.recipient_id ? String(row.recipient_id) : 'ALL',
    sender_role: row.sender_role ? String(row.sender_role) : 'hospital_admin',
    sender_name: row.sender_name ? String(row.sender_name) : REGAL_OPERATIONS_SENDER,
    category: row.category ? String(row.category) : 'Announcement',
    priority: row.priority ? String(row.priority) : 'normal',
    title,
    message,
    status,
    is_read: Boolean(row.is_read) || status.toLowerCase() === 'read',
    created_at: row.created_at ? String(row.created_at) : new Date().toISOString(),
    subject: title,
    body: message,
    target_app: row.target_app ? String(row.target_app) : undefined,
    recipient_name: row.recipient_name ? String(row.recipient_name) : undefined,
    delivery_status: status,
  };
}

/** Hospital OPD / messages tab row shape. */
export function notificationToHospitalMessageRow(row: SystemNotificationRow): Record<string, unknown> {
  return {
    id: row.id,
    facility_code: row.facility_code ?? REGAL_FACILITY_CODE,
    recipient_type: row.recipient_type,
    recipient_id: row.recipient_id,
    recipient_name: row.recipient_name,
    category: row.category,
    priority: row.priority,
    subject: row.title,
    body: row.message,
    target_app: row.target_app ?? resolveTargetApp(row.recipient_type as RecipientType),
    status: row.status ?? row.delivery_status ?? 'Delivered',
    delivery_status: row.status ?? row.delivery_status ?? 'Delivered',
    sender_name: row.sender_name ?? REGAL_OPERATIONS_SENDER,
    created_at: row.created_at,
  };
}

export function formatNotificationPriority(priority?: string): string {
  const value = String(priority ?? 'normal').toLowerCase();
  if (value === 'urgent') return 'Urgent';
  if (value === 'high') return 'High';
  if (value === 'low') return 'Low';
  return 'Normal';
}

export function resolveBroadcastRecipientId(recipientId?: string | null): string {
  return isBroadcastRecipientId(recipientId) ? 'ALL' : String(recipientId ?? 'ALL');
}

export async function dispatchEcosystemNotification(
  supabase: SupabaseClient,
  input: DispatchNotificationInput,
): Promise<{ ok: boolean; error?: string; notification?: SystemNotificationRow }> {
  const recipientType = normalizeRecipientType(input.recipient_type);
  const priority =
    typeof input.priority === 'string' ? mapHospitalPriority(input.priority) : input.priority ?? 'normal';

  const recipientId = resolveBroadcastRecipientId(input.recipient_id);
  const recipientName =
    input.recipient_name ??
    (recipientType === 'all' ? 'All Audience' : recipientId === 'ALL' ? 'All Audience' : recipientId);

  const payload: Record<string, unknown> = {
    hospital_id: REGAL_HOSPITAL_ID,
    facility_code: REGAL_FACILITY_CODE,
    facility: REGAL_FACILITY_CODE,
    recipient_type: recipientType,
    recipient_id: recipientId,
    recipient_name: recipientName,
    sender_role: input.sender_role ?? 'hospital_admin',
    sender_name: REGAL_OPERATIONS_SENDER,
    category: input.category ?? 'Announcement',
    priority,
    title: input.title.trim(),
    message: input.message.trim(),
    subject: input.title.trim(),
    body: input.message.trim(),
    target_app: input.target_app ?? resolveTargetApp(recipientType),
    status: 'Delivered',
    delivery_status: 'Delivered',
    is_read: false,
    created_at: new Date().toISOString(),
  };

  const { data, error } = await supabase.from('system_notifications').insert(payload).select('*').single();
  if (error) return { ok: false, error: error.message };

  const notification = normalizeNotificationRow((data ?? payload) as Record<string, unknown>);

  await emitEcosystemSystemEvent(supabase, {
    event_type: 'ECOSYSTEM_MESSAGE_DISPATCHED',
    source_app: 'hospital',
    severity: priority === 'urgent' ? 'critical' : priority === 'high' ? 'warning' : 'info',
    target_roles:
      recipientType === 'all'
        ? ['doctor', 'patient', 'vendor', 'hospital']
        : [recipientType, 'hospital'],
    payload: {
      notification_id: notification.id,
      title: notification.title,
      message: notification.message,
      recipient_type: recipientType,
      recipient_id: notification.recipient_id,
      category: notification.category,
      priority: notification.priority,
    },
  });

  return { ok: true, notification };
}

export async function emitEcosystemSystemEvent(
  supabase: SupabaseClient,
  input: EmitSystemEventInput,
): Promise<{ ok: boolean; error?: string }> {
  const row = {
    hospital_id: REGAL_HOSPITAL_ID,
    event_type: input.event_type,
    source_app: input.source_app,
    payload: input.payload ?? {},
    severity: input.severity ?? 'info',
    target_roles: input.target_roles ?? ['hospital', 'doctor', 'patient', 'vendor'],
    created_at: new Date().toISOString(),
  };

  const { error } = await supabase.from('system_events').insert(row);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function loadHospitalSentNotifications(
  supabase: SupabaseClient,
): Promise<SystemNotificationRow[]> {
  try {
    const { data, error } = await supabase
      .from('system_notifications')
      .select('*')
      .eq('hospital_id', REGAL_HOSPITAL_ID)
      .order('created_at', { ascending: false })
      .limit(200);

    if (error || !data?.length) return [];
    return data.map((row) => normalizeNotificationRow(row as Record<string, unknown>));
  } catch {
    return [];
  }
}

export async function loadNotificationsForApp(
  supabase: SupabaseClient,
  app: Exclude<EcosystemApp, 'hospital'>,
  recipientId?: string,
): Promise<SystemNotificationRow[]> {
  try {
    const { data, error } = await supabase
      .from('system_notifications')
      .select('*')
      .eq('hospital_id', REGAL_HOSPITAL_ID)
      .or(`recipient_type.eq.all,recipient_type.eq.${app}`)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error || !data?.length) return [];

    return data
      .map((row) => normalizeNotificationRow(row as Record<string, unknown>))
      .filter((row) => notificationMatchesRecipient(row, app, recipientId));
  } catch {
    return [];
  }
}

export async function markNotificationRead(
  supabase: SupabaseClient,
  notificationId: string,
): Promise<boolean> {
  const { error } = await supabase
    .from('system_notifications')
    .update({ is_read: true, status: 'Read', delivery_status: 'Read' })
    .eq('id', notificationId);
  return !error;
}

export async function markAllNotificationsRead(
  supabase: SupabaseClient,
  app: Exclude<EcosystemApp, 'hospital'>,
  recipientId?: string,
): Promise<void> {
  const rows = await loadNotificationsForApp(supabase, app, recipientId);
  const unreadIds = rows.filter((row) => !row.is_read).map((row) => row.id);
  if (unreadIds.length === 0) return;

  await supabase.from('system_notifications').update({ is_read: true }).in('id', unreadIds);
}

type SubscribeOptions = {
  app: EcosystemApp;
  recipientId?: string;
  onNotification?: (row: SystemNotificationRow) => void;
  onEvent?: (row: SystemEventRow) => void;
  onConnectionChange?: (connected: boolean) => void;
};

/** Subscribe to system_notifications + system_events for an ecosystem app. */
export function subscribeEcosystemMessaging(
  options: SubscribeOptions,
): () => void {
  const supabase = createClient();
  const channelName = `ecosystem-${options.app}-${options.recipientId ?? 'all'}-${Date.now()}`;

  const channel: RealtimeChannel = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'system_notifications' },
      (payload) => {
        const row = normalizeNotificationRow((payload.new ?? {}) as Record<string, unknown>);
        if (options.app === 'hospital') {
          options.onNotification?.(row);
          return;
        }
        if (notificationMatchesRecipient(row, options.app, options.recipientId)) {
          options.onNotification?.(row);
        }
      },
    )
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'system_events' },
      (payload) => {
        const raw = (payload.new ?? {}) as Record<string, unknown>;
        const roles = (raw.target_roles as string[] | undefined) ?? [];
        if (options.app !== 'hospital' && roles.length > 0 && !roles.includes(options.app)) {
          return;
        }
        options.onEvent?.({
          id: String(raw.id ?? ''),
          hospital_id: raw.hospital_id ? String(raw.hospital_id) : REGAL_HOSPITAL_ID,
          event_type: String(raw.event_type ?? ''),
          source_app: raw.source_app ? String(raw.source_app) : undefined,
          payload: (raw.payload as Record<string, unknown>) ?? {},
          severity: raw.severity ? String(raw.severity) : 'info',
          target_roles: roles,
          created_at: raw.created_at ? String(raw.created_at) : undefined,
        });
      },
    )
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'channel_messages' }, () => {
      options.onConnectionChange?.(true);
    })
    .subscribe((status) => {
      options.onConnectionChange?.(status === 'SUBSCRIBED');
    });

  return () => {
    void supabase.removeChannel(channel);
  };
}
