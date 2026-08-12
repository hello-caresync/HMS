'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CalendarClock,
  FileText,
  Inbox,
  Loader2,
  MessageCircle,
  Paperclip,
  Search,
  Send,
  ShieldCheck,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

import type { ClinicalMessage } from '@/lib/doctor/messages.service';
import { getDoctorSession } from '@/lib/doctor/session';
import { supabase } from '@/lib/supabaseClient';

const MESSAGES_KEY = 'curasync_messages';
const LEGACY_MESSAGES_KEY = 'curasync_patient_messages';
const FOLLOW_UP_TEMPLATES = [
  'Please schedule a follow-up visit in 7 days so we can review your progress.',
  'Please continue the prescribed care plan and share an update if symptoms change.',
  'Your results are ready. Please book a follow-up appointment to discuss them.',
] as const;
const clayCard =
  'rounded-3xl border border-white/80 bg-gradient-to-br from-white via-white/95 to-[#F2F6FA] shadow-[10px_10px_24px_rgba(137,74,102,0.12),-8px_-8px_20px_rgba(255,255,255,0.95)]';
const glassPanel =
  'rounded-3xl border border-white/70 bg-white/55 backdrop-blur-xl shadow-[0_18px_45px_rgba(44,36,59,0.10)]';

type PrescriptionAttachment = {
  name: string;
  size: number;
  type: string;
  path?: string;
  url?: string;
};

type MessageRow = ClinicalMessage & {
  sender_type?: 'doctor' | 'patient';
  is_read?: boolean;
  attachment?: PrescriptionAttachment | null;
  attachment_name?: string | null;
  attachment_size?: number | null;
  attachment_type?: string | null;
  attachment_path?: string | null;
  attachment_url?: string | null;
};

function messageKey(message: MessageRow) {
  return `${message.patient_name}|${message.created_at}|${message.message}`;
}

function normalizeAttachment(message: MessageRow): MessageRow {
  if (message.attachment) return message;
  if (!message.attachment_name) return message;
  return {
    ...message,
    attachment: {
      name: message.attachment_name,
      size: message.attachment_size ?? 0,
      type: message.attachment_type ?? 'application/octet-stream',
      path: message.attachment_path ?? undefined,
      url: message.attachment_url ?? undefined,
    },
  };
}

function readStoredMessages(): MessageRow[] {
  try {
    const canonical = JSON.parse(localStorage.getItem(MESSAGES_KEY) ?? '[]') as MessageRow[];
    const legacy = JSON.parse(localStorage.getItem(LEGACY_MESSAGES_KEY) ?? '[]') as MessageRow[];
    return mergeMessages(canonical.map(normalizeAttachment), legacy.map(normalizeAttachment));
  } catch {
    return [];
  }
}

function writeStoredMessages(messages: MessageRow[]) {
  localStorage.setItem(MESSAGES_KEY, JSON.stringify(messages));
  localStorage.setItem(LEGACY_MESSAGES_KEY, JSON.stringify(messages));
}

function mergeMessages(local: MessageRow[], remote: MessageRow[]) {
  const merged = new Map<string, MessageRow>();
  local.forEach((message) => merged.set(messageKey(message), message));
  remote.forEach((message) => merged.set(messageKey(message), normalizeAttachment(message)));
  return [...merged.values()].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
}

export default function DoctorMessagesPage() {
  const [session] = useState(getDoctorSession);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [selectedPatient, setSelectedPatient] = useState('');
  const [search, setSearch] = useState('');
  const [draft, setDraft] = useState('');
  const [priority, setPriority] = useState<'normal' | 'urgent'>('normal');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [offline, setOffline] = useState(false);
  const [attachment, setAttachment] = useState<File | null>(null);

  const loadMessages = useCallback(
    async (quiet = false) => {
      if (!quiet) setLoading(true);
      const local = readStoredMessages();
      try {
        const { data, error } = await supabase
          .from('patient_messages')
          .select('*')
          .eq('doctor_name', session.fullName)
          .order('created_at', { ascending: false });
        if (error) throw error;
        const next = mergeMessages(local, (data ?? []) as MessageRow[]);
        setMessages(next);
        writeStoredMessages(next);
        setSelectedPatient((current) => current || next[0]?.patient_name || '');
        setOffline(false);
      } catch (error) {
        setMessages(local);
        setSelectedPatient((current) => current || local[0]?.patient_name || '');
        setOffline(true);
        if (!quiet) {
          toast.warning('Messaging is offline', {
            description:
              error instanceof Error ? error.message : 'Showing messages saved on this device.',
          });
        }
      } finally {
        setLoading(false);
      }
    },
    [session.fullName],
  );

  useEffect(() => {
    const initialLoad = window.setTimeout(() => void loadMessages(), 0);
    const channel = supabase
      .channel(`doctor-messages-${session.employeeId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'patient_messages',
          filter: `doctor_name=eq.${session.fullName}`,
        },
        () => void loadMessages(true),
      )
      .subscribe((status: string) => {
        if (status === 'CHANNEL_ERROR') setOffline(true);
      });

    return () => {
      window.clearTimeout(initialLoad);
      void supabase.removeChannel(channel);
    };
  }, [loadMessages, session.employeeId, session.fullName]);

  const conversations = useMemo(() => {
    const grouped = new Map<string, MessageRow[]>();
    messages.forEach((message) => {
      grouped.set(message.patient_name, [...(grouped.get(message.patient_name) ?? []), message]);
    });
    return [...grouped.entries()]
      .map(([patientName, patientMessages]) => ({
        patientName,
        messages: patientMessages,
        latest: patientMessages[0],
        urgent: patientMessages.some((message) => message.priority === 'urgent'),
      }))
      .filter(({ patientName }) => patientName.toLowerCase().includes(search.toLowerCase()));
  }, [messages, search]);

  const thread = useMemo(
    () =>
      messages
        .filter((message) => message.patient_name === selectedPatient)
        .sort(
          (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
        ),
    [messages, selectedPatient],
  );

  const handleSend = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedPatient || (!draft.trim() && !attachment)) return;
    setSending(true);
    const id = `msg_${Date.now()}_${crypto.randomUUID()}`;
    const createdAt = new Date().toISOString();
    const localAttachment: PrescriptionAttachment | null = attachment
      ? {
          name: attachment.name,
          size: attachment.size,
          type: attachment.type || 'application/octet-stream',
        }
      : null;
    const localRecord: MessageRow = {
      id,
      patient_name: selectedPatient,
      doctor_name: session.fullName,
      doctor_employee_id: session.employeeId,
      message: draft.trim() || 'Prescription attached',
      priority,
      sender_type: 'doctor',
      is_read: false,
      created_at: createdAt,
      attachment: localAttachment,
      attachment_name: localAttachment?.name ?? null,
      attachment_size: localAttachment?.size ?? null,
      attachment_type: localAttachment?.type ?? null,
    };

    const localFirst = mergeMessages([localRecord], readStoredMessages());
    writeStoredMessages(localFirst);
    setMessages(localFirst);
    setDraft('');
    setPriority('normal');
    setAttachment(null);

    try {
      let syncedAttachment = localAttachment;
      if (attachment) {
        const safeName = attachment.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const path = `${session.employeeId}/${selectedPatient.replace(/[^a-zA-Z0-9_-]/g, '_')}/${Date.now()}-${safeName}`;
        const { error: uploadError } = await supabase.storage
          .from('prescription-attachments')
          .upload(path, attachment, { upsert: false });
        if (!uploadError) {
          const { data } = supabase.storage.from('prescription-attachments').getPublicUrl(path);
          syncedAttachment = { ...localAttachment!, path, url: data.publicUrl };
        }
      }

      const extendedPayload = {
        id,
        patient_name: selectedPatient,
        doctor_name: session.fullName,
        doctor_employee_id: session.employeeId,
        message: localRecord.message,
        priority,
        sender_type: 'doctor',
        is_read: false,
        created_at: createdAt,
        attachment_name: syncedAttachment?.name ?? null,
        attachment_size: syncedAttachment?.size ?? null,
        attachment_type: syncedAttachment?.type ?? null,
        attachment_path: syncedAttachment?.path ?? null,
        attachment_url: syncedAttachment?.url ?? null,
      };
      let { error } = await supabase.from('patient_messages').insert(extendedPayload);
      if (error) {
        const fallback = {
          patient_name: selectedPatient,
          doctor_name: session.fullName,
          doctor_employee_id: session.employeeId,
          message: localRecord.message,
          priority,
          sender_type: 'doctor',
          is_read: false,
          created_at: createdAt,
        };
        ({ error } = await supabase.from('patient_messages').insert(fallback));
      }
      if (error) throw error;

      const syncedRecord = {
        ...localRecord,
        attachment: syncedAttachment,
        attachment_path: syncedAttachment?.path ?? null,
        attachment_url: syncedAttachment?.url ?? null,
      };
      const synced = mergeMessages([syncedRecord], readStoredMessages());
      writeStoredMessages(synced);
      setMessages(synced);
      setOffline(false);
      toast.success('Secure message sent');
      await loadMessages(true);
    } catch (error) {
      setOffline(true);
      toast.warning('Message saved on this device', {
        description:
          error instanceof Error ? error.message : 'It will remain available in this conversation.',
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="min-h-full bg-[radial-gradient(circle_at_top_right,_#BDE2F5_0,_#F2F6FA_42%,_#F2F6FA_100%)] p-4 text-[#2C243B] sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className={`${glassPanel} flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-7`}>
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-gradient-to-br from-[#BDE2F5] to-[#A9C5E3] p-3 text-[#894A66] shadow-[5px_5px_12px_rgba(137,74,102,0.14),-4px_-4px_10px_white]">
              <MessageCircle className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight sm:text-3xl">Secure messages</h1>
              <p className="mt-1 text-sm text-[#2C243B]/60">Patient communication for {session.fullName}</p>
            </div>
          </div>
          <div className="inline-flex w-fit items-center gap-2 rounded-full bg-[#BDE2F5]/70 px-3 py-1.5 text-xs font-bold text-[#894A66]">
            <ShieldCheck className="h-4 w-4" /> Clinical channel
          </div>
        </header>

        {offline && (
          <div className="flex items-center gap-2 rounded-2xl border border-[#93688E]/35 bg-[#BDE2F5]/45 px-4 py-3 text-sm text-[#2C243B]">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            Live sync is unavailable. Outgoing messages are retained locally.
          </div>
        )}

        <div className={`${clayCard} grid min-h-[620px] overflow-hidden lg:grid-cols-[350px_1fr]`}>
          <aside className="border-b border-[#9DA6CD]/30 lg:border-b-0 lg:border-r">
            <div className="border-b border-[#9DA6CD]/25 p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9887B1]" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search conversations…"
                  className="w-full rounded-2xl border border-white/80 bg-white/70 py-2.5 pl-10 pr-3 text-sm shadow-inner outline-none focus:border-[#894A66]"
                />
              </div>
            </div>
            {loading ? (
              <div className="flex min-h-52 items-center justify-center">
                <Loader2 className="h-7 w-7 animate-spin text-[#894A66]" />
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-8 text-center">
                <Inbox className="mx-auto mb-3 h-9 w-9 text-[#9887B1]" />
                <p className="font-bold">No patient messages</p>
                <p className="mt-1 text-sm text-[#2C243B]/55">
                  Incoming patient conversations will appear here.
                </p>
              </div>
            ) : (
              <div className="max-h-72 divide-y divide-[#9DA6CD]/20 overflow-y-auto lg:max-h-[550px]">
                {conversations.map((conversation) => (
                  <button
                    key={conversation.patientName}
                    type="button"
                    onClick={() => setSelectedPatient(conversation.patientName)}
                    className={`w-full p-4 text-left transition hover:bg-[#BDE2F5]/25 active:scale-95 ${
                      selectedPatient === conversation.patientName ? 'bg-[#BDE2F5]/45' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="truncate font-bold">{conversation.patientName}</p>
                      {conversation.urgent && (
                        <span className="rounded-full bg-[#894A66] px-2 py-0.5 text-[10px] font-black uppercase text-white">
                          Urgent
                        </span>
                      )}
                    </div>
                    <p className="mt-1 truncate text-sm text-[#2C243B]/55">
                      {conversation.latest.message}
                    </p>
                    <p className="mt-1 text-[11px] text-[#2C243B]/40">
                      {new Date(conversation.latest.created_at).toLocaleString()}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </aside>

          <main className="flex min-h-[500px] flex-col">
            {!selectedPatient ? (
              <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
                <MessageCircle className="mb-4 h-12 w-12 text-[#9887B1]" />
                <h2 className="text-lg font-bold">Choose a conversation</h2>
                <p className="mt-1 text-sm text-[#2C243B]/55">Select a patient to review and reply.</p>
              </div>
            ) : (
              <>
                <div className="border-b border-[#9DA6CD]/25 px-5 py-4">
                  <p className="font-black">{selectedPatient}</p>
                  <p className="text-xs text-[#2C243B]/50">Encrypted clinical conversation</p>
                </div>
                <div className="flex-1 space-y-3 overflow-y-auto bg-gradient-to-br from-[#F2F6FA]/75 to-[#BDE2F5]/25 p-4 sm:p-6">
                  {thread.length === 0 ? (
                    <div className="py-16 text-center text-sm text-[#2C243B]/50">No messages yet.</div>
                  ) : (
                    thread.map((message) => {
                      const sentByDoctor =
                        message.sender_type === 'doctor' ||
                        message.doctor_employee_id === session.employeeId;
                      return (
                        <div
                          key={messageKey(message)}
                          className={`flex ${sentByDoctor ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm sm:max-w-[70%] ${
                              sentByDoctor
                                ? 'rounded-br-md bg-[#894A66] text-white'
                                : 'rounded-bl-md border border-[#9DA6CD]/35 bg-white'
                            }`}
                          >
                            {message.priority === 'urgent' && (
                              <p className={`mb-1 text-[10px] font-black uppercase ${sentByDoctor ? 'text-[#BDE2F5]' : 'text-[#894A66]'}`}>
                                Urgent
                              </p>
                            )}
                            <p className="whitespace-pre-wrap">{message.message}</p>
                            {message.attachment && (
                              <a
                                href={message.attachment.url}
                                target={message.attachment.url ? '_blank' : undefined}
                                rel="noreferrer"
                                onClick={(clickEvent) => {
                                  if (!message.attachment?.url) clickEvent.preventDefault();
                                }}
                                className={`mt-3 flex items-center gap-2 rounded-xl border px-3 py-2 ${
                                  sentByDoctor
                                    ? 'border-white/25 bg-white/10'
                                    : 'border-[#9DA6CD]/30 bg-[#F2F6FA]'
                                } ${message.attachment.url ? 'transition active:scale-95' : 'cursor-default'}`}
                              >
                                <FileText className="h-4 w-4 shrink-0" />
                                <span className="min-w-0">
                                  <span className="block truncate text-xs font-bold">
                                    {message.attachment.name}
                                  </span>
                                  <span className="block text-[10px] opacity-65">
                                    {(message.attachment.size / 1024).toFixed(1)} KB · Prescription
                                  </span>
                                </span>
                              </a>
                            )}
                            <p className={`mt-1.5 text-[10px] ${sentByDoctor ? 'text-white/65' : 'text-[#2C243B]/40'}`}>
                              {new Date(message.created_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
                <form onSubmit={handleSend} className="border-t border-[#9DA6CD]/25 bg-white/65 p-4 backdrop-blur-xl">
                  <div className="mb-3 flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#93688E]">
                      <CalendarClock className="h-3.5 w-3.5" /> Quick follow-up
                    </span>
                    {FOLLOW_UP_TEMPLATES.map((template, index) => (
                      <button
                        key={template}
                        type="button"
                        onClick={() => setDraft(template)}
                        className="rounded-full border border-white bg-[#BDE2F5]/55 px-3 py-1 text-[11px] font-bold text-[#894A66] shadow-sm transition active:scale-95"
                      >
                        Template {index + 1}
                      </button>
                    ))}
                  </div>
                  <div className="mb-3 flex items-center gap-2">
                    <label className="text-xs font-bold text-[#2C243B]/60" htmlFor="priority">
                      Priority
                    </label>
                    <select
                      id="priority"
                      value={priority}
                      onChange={(event) => setPriority(event.target.value as 'normal' | 'urgent')}
                      className="rounded-lg border border-[#9DA6CD]/60 bg-white px-2 py-1 text-xs font-semibold outline-none"
                    >
                      <option value="normal">Normal</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                  {attachment && (
                    <div className="mb-3 flex items-center justify-between rounded-2xl border border-[#9DA6CD]/30 bg-[#F2F6FA] px-3 py-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <Paperclip className="h-4 w-4 shrink-0 text-[#894A66]" />
                        <span className="truncate text-xs font-bold">{attachment.name}</span>
                      </div>
                      <button
                        type="button"
                        aria-label="Remove attachment"
                        onClick={() => setAttachment(null)}
                        className="rounded-full p-1 transition hover:bg-white active:scale-95"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                  <div className="flex items-end gap-2">
                    <textarea
                      value={draft}
                      onChange={(event) => setDraft(event.target.value)}
                      rows={2}
                      placeholder="Write a secure reply…"
                      className="min-h-12 flex-1 resize-none rounded-2xl border border-[#9DA6CD]/60 bg-white/75 px-4 py-3 text-sm shadow-inner outline-none focus:border-[#894A66] focus:ring-2 focus:ring-[#894A66]/15"
                    />
                    <label className="flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center rounded-2xl border border-white bg-[#A9C5E3]/45 text-[#894A66] shadow-[4px_4px_10px_rgba(157,166,205,0.25),-3px_-3px_8px_white] transition active:scale-95">
                      <Paperclip className="h-5 w-5" />
                      <span className="sr-only">Attach prescription</span>
                      <input
                        type="file"
                        className="sr-only"
                        accept=".pdf,.png,.jpg,.jpeg"
                        onChange={(event) => {
                          const file = event.target.files?.[0] ?? null;
                          if (file && file.size > 10 * 1024 * 1024) {
                            toast.error('Attachment is too large', {
                              description: 'Choose a prescription file smaller than 10 MB.',
                            });
                            event.target.value = '';
                            return;
                          }
                          setAttachment(file);
                        }}
                      />
                    </label>
                    <button
                      type="submit"
                      disabled={sending || (!draft.trim() && !attachment)}
                      aria-label="Send message"
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#894A66] to-[#93688E] text-white shadow-[5px_5px_12px_rgba(137,74,102,0.30),-3px_-3px_9px_white] transition active:scale-95 disabled:opacity-50"
                    >
                      {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                    </button>
                  </div>
                </form>
              </>
            )}
          </main>
        </div>
      </div>
    </section>
  );
}
