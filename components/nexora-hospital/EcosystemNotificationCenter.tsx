'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from 'react';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { Loader2, Megaphone, RefreshCw, Wifi } from 'lucide-react';
import { toast } from 'sonner';

import type { RegalDoctor } from '@/components/nexora-hospital/HospitalOperationsCenter';
import { SEED_VENDORS } from '@/components/nexora-hospital/hospital-ops-seed';
import { createClient } from '@/lib/supabase/client';
import { ECOSYSTEM_VENDOR_TARGET_ID } from '@/lib/ecosystem/ecosystem-channels';
import {
  dispatchEcosystemNotification,
  formatNotificationPriority,
  loadHospitalSentNotifications,
  mapHospitalPriority,
  mapHospitalRecipientType,
  normalizeNotificationRow,
  REGAL_FACILITY_CODE,
  REGAL_OPERATIONS_SENDER,
  resolveTargetApp,
  type NotificationCategory,
  type RecipientType,
  type SystemNotificationRow,
} from '@/lib/ecosystem/messaging-service';

type PatientOption = { uhid: string; name: string };

type AudienceFilter = 'all' | 'patient' | 'doctor' | 'vendor';

type ComposeRecipientType = 'Patient' | 'Doctor' | 'Vendor' | 'All';

const AUDIENCE_FILTERS: { id: AudienceFilter; label: string }[] = [
  { id: 'all', label: 'All Sent' },
  { id: 'patient', label: 'Patients' },
  { id: 'doctor', label: 'Doctors' },
  { id: 'vendor', label: 'Vendors' },
];

const NOTIFICATION_CATEGORIES: NotificationCategory[] = [
  'Announcement',
  'Alert',
  'Clinical',
  'Billing',
  'Supply',
];

const PRIORITY_OPTIONS = [
  { value: 'Normal', db: 'normal' },
  { value: 'High', db: 'high' },
  { value: 'Urgent (Push Alarm)', db: 'urgent' },
] as const;

type PriorityOption = (typeof PRIORITY_OPTIONS)[number]['value'];

const ui = {
  card: 'rounded-xl border border-slate-200 bg-white shadow-sm',
  input:
    'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#00A896] focus:outline-none focus:ring-1 focus:ring-[#00A896]/30',
  btnTeal:
    'inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#00A896] px-3 py-1.5 text-xs font-bold text-white transition hover:bg-[#00806f] disabled:opacity-50',
  btnGhost:
    'inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 transition hover:bg-slate-50',
  th: 'whitespace-nowrap px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500',
  td: 'whitespace-nowrap px-4 py-3 text-sm text-slate-700',
  tr: 'border-t border-slate-100 hover:bg-slate-50/70',
  chip:
    'rounded-full border px-3 py-1 text-xs font-bold transition',
  chipActive: 'border-[#00A896] bg-[#00A896]/10 text-[#0F3E5D]',
  chipIdle: 'border-slate-200 bg-white text-slate-600 hover:border-[#00A896]/40',
} as const;

function recipientTypeLabel(type: string): string {
  const value = type.toLowerCase();
  if (value === 'patient') return 'Patient';
  if (value === 'doctor') return 'Doctor';
  if (value === 'vendor') return 'Vendor';
  return 'Broadcast All';
}

function matchesAudienceFilter(row: SystemNotificationRow, filter: AudienceFilter): boolean {
  if (filter === 'all') return true;
  const type = String(row.recipient_type ?? 'all').toLowerCase();
  if (type === 'all') return true;
  return type === filter;
}

function PriorityBadge({ priority }: { priority?: string }) {
  const label = formatNotificationPriority(priority);
  const tone =
    label === 'Urgent'
      ? 'bg-rose-100 text-rose-700'
      : label === 'High'
        ? 'bg-amber-100 text-amber-800'
        : 'bg-slate-100 text-slate-600';

  return (
    <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${tone}`}>
      {label}
    </span>
  );
}

function StatusBadge({ status }: { status?: string }) {
  const value = String(status ?? 'Delivered').toLowerCase();
  const tone =
    value === 'read'
      ? 'bg-emerald-100 text-emerald-700'
      : value === 'pending'
        ? 'bg-amber-100 text-amber-800'
        : 'bg-sky-100 text-sky-700';

  return (
    <span className={`rounded-md px-2 py-0.5 text-xs font-bold capitalize ${tone}`}>
      {value}
    </span>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</span>
      {children}
    </label>
  );
}

type EcosystemNotificationCenterProps = {
  doctors: RegalDoctor[];
  patients: PatientOption[];
};

export default function EcosystemNotificationCenter({
  doctors,
  patients,
}: EcosystemNotificationCenterProps) {
  const supabase = useMemo(() => createClient(), []);
  const [rows, setRows] = useState<SystemNotificationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [live, setLive] = useState(false);
  const [audience, setAudience] = useState<AudienceFilter>('all');
  const [composerOpen, setComposerOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<{
    recipient_type: ComposeRecipientType;
    recipient_id: string;
    category: NotificationCategory;
    priority: PriorityOption;
    subject: string;
    body: string;
  }>({
    recipient_type: 'Doctor' as ComposeRecipientType,
    recipient_id: 'all',
    category: NOTIFICATION_CATEGORIES[0],
    priority: PRIORITY_OPTIONS[0].value,
    subject: '',
    body: '',
  });

  const reload = useCallback(async () => {
    const data = await loadHospitalSentNotifications(supabase);
    setRows(data);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    let alive = true;
    const channel = supabase
      .channel(`regal-notification-ledger-${Date.now()}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'system_notifications' },
        (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
          if (!alive) return;
          if (payload.eventType === 'INSERT' && payload.new) {
            const row = normalizeNotificationRow(payload.new as Record<string, unknown>);
            setRows((current) => {
              if (current.some((item) => item.id === row.id)) return current;
              return [row, ...current];
            });
            return;
          }
          if (payload.eventType === 'UPDATE' && payload.new) {
            const row = normalizeNotificationRow(payload.new as Record<string, unknown>);
            setRows((current) => current.map((item) => (item.id === row.id ? row : item)));
            return;
          }
          void reload();
        },
      )
      .subscribe((status: string) => {
        if (alive) setLive(status === 'SUBSCRIBED');
      });

    return () => {
      alive = false;
      void supabase.removeChannel(channel);
    };
  }, [reload, supabase]);

  const filteredRows = useMemo(
    () => rows.filter((row) => matchesAudienceFilter(row, audience)),
    [audience, rows],
  );

  const vendorOptions = useMemo(
    () => [
      { id: 'all', label: 'All Vendors' },
      { id: ECOSYSTEM_VENDOR_TARGET_ID, label: 'VENDOR-01 · Apex Pharma / MedSupply' },
      ...SEED_VENDORS.map((vendor) => ({ id: vendor.id, label: vendor.name })),
    ],
    [],
  );

  const entityOptions = useMemo(() => {
    if (form.recipient_type === 'Doctor') {
      return [
        { id: 'all', label: 'All Doctors' },
        ...doctors.map((doctor) => ({
          id: doctor.id,
          label: `${doctor.id} · ${doctor.name}`,
        })),
      ];
    }
    if (form.recipient_type === 'Patient') {
      return [
        { id: 'all', label: 'All Patients' },
        ...patients.slice(0, 60).map((patient) => ({
          id: patient.uhid,
          label: `${patient.uhid} · ${patient.name}`,
        })),
      ];
    }
    if (form.recipient_type === 'Vendor') {
      return vendorOptions;
    }
    return [{ id: 'broadcast', label: 'Broadcast to All Ecosystem Apps' }];
  }, [doctors, form.recipient_type, patients, vendorOptions]);

  const resolveRecipientName = (): string => {
    if (form.recipient_type === 'All') return 'All Audience';
    const match = entityOptions.find((option) => option.id === form.recipient_id);
    return match?.label ?? form.recipient_id;
  };

  const send = async (event: FormEvent) => {
    event.preventDefault();
    if (!form.subject.trim() || !form.body.trim()) {
      toast.error('Enter a subject and message body');
      return;
    }

    const recipientType = mapHospitalRecipientType(form.recipient_type);
    const dispatch = {
      recipient_type: recipientType,
      recipient_id: form.recipient_id,
      recipient_name: resolveRecipientName(),
      category: form.category,
      priority: mapHospitalPriority(form.priority),
      title: form.subject.trim(),
      message: form.body.trim(),
      target_app: resolveTargetApp(recipientType),
    };

    setSubmitting(true);
    const result = await dispatchEcosystemNotification(supabase, dispatch);
    setSubmitting(false);

    if (!result.ok || !result.notification) {
      toast.error(result.error ?? 'Failed to dispatch notification');
      return;
    }

    setRows((current) => {
      if (current.some((row) => row.id === result.notification!.id)) return current;
      return [result.notification!, ...current];
    });
    setComposerOpen(false);
    setForm({
      recipient_type: 'Doctor',
      recipient_id: 'all',
      category: NOTIFICATION_CATEGORIES[0],
      priority: PRIORITY_OPTIONS[0].value,
      subject: '',
      body: '',
    });
    toast.success(`Broadcast dispatched to ${resolveTargetApp(recipientType as RecipientType)}`);
  };

  return (
    <>
      <section className={`${ui.card} mt-6 overflow-hidden`}>
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div>
            <div className="flex items-center gap-2">
              <Megaphone className="h-4 w-4 text-[#00A896]" />
              <h2 className="text-sm font-bold text-slate-900">Ecosystem Notification Center</h2>
              {live ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                  <Wifi className="h-3 w-3" /> Live
                </span>
              ) : null}
            </div>
            <p className="mt-1 text-xs text-slate-500">
              {filteredRows.length} ledger entr{filteredRows.length === 1 ? 'y' : 'ies'} ·{' '}
              {REGAL_FACILITY_CODE} · synced to Patient, Doctor and Vendor apps
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" className={ui.btnGhost} onClick={() => void reload()} disabled={loading}>
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button type="button" className={ui.btnTeal} onClick={() => setComposerOpen(true)}>
              Compose Broadcast
            </button>
          </div>
        </div>

        <div className="border-b border-slate-100 px-5 py-3">
          <div className="flex flex-wrap gap-2">
            {AUDIENCE_FILTERS.map((filter) => (
              <button
                key={filter.id}
                type="button"
                className={`${ui.chip} ${audience === filter.id ? ui.chipActive : ui.chipIdle}`}
                onClick={() => setAudience(filter.id)}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center gap-2 px-5 py-16 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin text-[#00A896]" />
              Loading notification ledger…
            </div>
          ) : (
            <table className="w-full min-w-[1080px]">
              <thead className="bg-slate-50/80">
                <tr>
                  <th className={ui.th}>Timestamp</th>
                  <th className={ui.th}>Audience</th>
                  <th className={ui.th}>Recipient</th>
                  <th className={ui.th}>Category</th>
                  <th className={ui.th}>Priority</th>
                  <th className={ui.th}>Message</th>
                  <th className={ui.th}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row) => (
                  <tr key={row.id} className={ui.tr}>
                    <td className={`${ui.td} text-xs text-slate-500`}>
                      {new Date(String(row.created_at)).toLocaleString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className={ui.td}>
                      <span className="rounded-md bg-[#0F3E5D]/10 px-2 py-0.5 text-xs font-bold text-[#0F3E5D]">
                        {recipientTypeLabel(String(row.recipient_type))}
                      </span>
                    </td>
                    <td className={ui.td}>
                      <p className="font-semibold text-slate-900">{row.recipient_name ?? 'All Audience'}</p>
                      <p className="text-xs text-slate-400">{row.recipient_id ?? 'ALL'}</p>
                    </td>
                    <td className={ui.td}>{row.category ?? 'Announcement'}</td>
                    <td className={ui.td}>
                      <PriorityBadge priority={row.priority} />
                    </td>
                    <td className={ui.td}>
                      <p className="max-w-xs truncate font-semibold text-slate-900">{row.title}</p>
                      <p className="max-w-xs truncate text-xs text-slate-500">{row.message}</p>
                      <p className="text-[10px] text-slate-400">{row.sender_name ?? REGAL_OPERATIONS_SENDER}</p>
                    </td>
                    <td className={ui.td}>
                      <StatusBadge status={row.status ?? row.delivery_status} />
                    </td>
                  </tr>
                ))}
                {filteredRows.length === 0 && !loading ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-14 text-center text-sm text-slate-500">
                      No notifications in the ledger for this audience filter.
                      <br />
                      <span className="text-xs">Compose a broadcast to dispatch alerts across the ecosystem.</span>
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {composerOpen ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 cursor-default bg-black/30"
            aria-label="Close compose modal"
            onClick={() => setComposerOpen(false)}
          />
          <div className="fixed inset-x-4 top-[8vh] z-50 mx-auto max-h-[84vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl sm:inset-x-auto">
            <div className="border-b border-slate-100 px-5 py-4">
              <h3 className="text-base font-black text-slate-900">Compose Ecosystem Broadcast</h3>
              <p className="mt-0.5 text-xs text-slate-500">
                Writes to system_notifications · broadcasts via system_events · {REGAL_FACILITY_CODE}
              </p>
            </div>
            <form className="space-y-3 px-5 py-4" onSubmit={(event) => void send(event)}>
              <Field label="Recipient type">
                <select
                  className={ui.input}
                  value={form.recipient_type}
                  onChange={(event) => {
                    const recipient_type = event.target.value as ComposeRecipientType;
                    setForm({
                      ...form,
                      recipient_type,
                      recipient_id: recipient_type === 'All' ? 'broadcast' : 'all',
                    });
                  }}
                >
                  <option value="Patient">Patient</option>
                  <option value="Doctor">Doctor</option>
                  <option value="Vendor">Vendor</option>
                  <option value="All">Broadcast to All</option>
                </select>
              </Field>

              {form.recipient_type !== 'All' ? (
                <Field label="Target specific entity">
                  <select
                    className={ui.input}
                    value={form.recipient_id}
                    onChange={(event) => setForm({ ...form, recipient_id: event.target.value })}
                  >
                    {entityOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </Field>
              ) : null}

              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Category">
                  <select
                    className={ui.input}
                    value={form.category}
                    onChange={(event) =>
                      setForm({ ...form, category: event.target.value as NotificationCategory })
                    }
                  >
                    {NOTIFICATION_CATEGORIES.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Priority">
                  <select
                    className={ui.input}
                    value={form.priority}
                    onChange={(event) =>
                      setForm({ ...form, priority: event.target.value as PriorityOption })
                    }
                  >
                    {PRIORITY_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.value}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <Field label="Subject">
                <input
                  className={ui.input}
                  required
                  value={form.subject}
                  onChange={(event) => setForm({ ...form, subject: event.target.value })}
                  placeholder="e.g. OPD queue delay — Building A"
                />
              </Field>

              <Field label="Message body">
                <textarea
                  className={`${ui.input} min-h-[120px]`}
                  required
                  value={form.body}
                  onChange={(event) => setForm({ ...form, body: event.target.value })}
                  placeholder="Notification content delivered to the selected audience…"
                />
              </Field>

              <div className="flex justify-end gap-2 pt-1">
                <button type="button" className={ui.btnGhost} onClick={() => setComposerOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className={ui.btnTeal} disabled={submitting}>
                  {submitting ? 'Dispatching…' : 'Send & Broadcast'}
                </button>
              </div>
            </form>
          </div>
        </>
      ) : null}
    </>
  );
}
