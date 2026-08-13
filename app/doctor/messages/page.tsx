'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Loader2, MessageSquare, RotateCw, Send, UserRound } from 'lucide-react';

import { DEFAULT_ACTIVE_DOCTOR_ID } from '@/lib/doctor/command-center/supabase-service';
import { supabase } from '@/lib/supabaseClient';

type MessageRow = {
  id: string;
  patient_id: string;
  doctor_id: string;
  sender_type: 'PATIENT' | 'DOCTOR' | string;
  content: string;
  created_at: string;
};

type PatientProfile = {
  id: string;
  full_name?: string;
  phone?: string | null;
};

type ConversationThread = {
  patientId: string;
  patientName: string;
  phone?: string | null;
  latestPreview: string;
  latestAt: string;
  messages: MessageRow[];
};

const ACTIVE_DOCTOR_ID = DEFAULT_ACTIVE_DOCTOR_ID;

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatRelative(iso: string): string {
  return new Date(iso).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function DoctorSecureMessagesPage() {
  const [allMessages, setAllMessages] = useState<MessageRow[]>([]);
  const [profileMap, setProfileMap] = useState<Record<string, PatientProfile>>({});
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const chatBottomRef = useRef<HTMLDivElement>(null);

  const loadMessages = useCallback(async () => {
    try {
      const { data: rows, error } = await supabase
        .from('messages')
        .select('id, patient_id, doctor_id, sender_type, content, created_at')
        .eq('doctor_id', ACTIVE_DOCTOR_ID)
        .order('created_at', { ascending: true });

      if (error) {
        console.warn('Failed to load messages:', error.message ?? error);
        return;
      }

      const messages = (rows ?? []) as MessageRow[];
      setAllMessages(messages);

      const patientIds = Array.from(new Set(messages.map((m) => m.patient_id).filter(Boolean)));
      if (patientIds.length === 0) {
        setProfileMap({});
        return;
      }

      const { data: profiles } = await supabase
        .from('patient_profiles')
        .select('id, full_name, phone')
        .in('id', patientIds);

      const map: Record<string, PatientProfile> = {};
      for (const p of (profiles ?? []) as PatientProfile[]) {
        if (p.id) map[p.id] = p;
      }
      setProfileMap(map);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMessages();
  }, [loadMessages]);

  useEffect(() => {
    const channel = supabase
      .channel(`doctor-messages-${ACTIVE_DOCTOR_ID}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `doctor_id=eq.${ACTIVE_DOCTOR_ID}`,
        },
        () => {
          void loadMessages();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [loadMessages]);

  const threads = useMemo<ConversationThread[]>(() => {
    const grouped = new Map<string, MessageRow[]>();

    for (const msg of allMessages) {
      const list = grouped.get(msg.patient_id) ?? [];
      list.push(msg);
      grouped.set(msg.patient_id, list);
    }

    return Array.from(grouped.entries())
      .map(([patientId, messages]) => {
        const sorted = [...messages].sort(
          (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
        );
        const latest = sorted[sorted.length - 1];

        return {
          patientId,
          patientName: profileMap[patientId]?.full_name ?? 'Patient Record',
          phone: profileMap[patientId]?.phone,
          latestPreview: latest?.content ?? '',
          latestAt: latest?.created_at ?? '',
          messages: sorted,
        };
      })
      .sort((a, b) => new Date(b.latestAt).getTime() - new Date(a.latestAt).getTime());
  }, [allMessages, profileMap]);

  const activeThread = useMemo(
    () => threads.find((t) => t.patientId === selectedPatientId) ?? null,
    [threads, selectedPatientId],
  );

  useEffect(() => {
    if (!selectedPatientId && threads.length > 0) {
      setSelectedPatientId(threads[0].patientId);
    }
  }, [threads, selectedPatientId]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeThread?.messages]);

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId || !replyText.trim()) return;

    setSending(true);
    const content = replyText.trim();
    setReplyText('');

    try {
      const { error } = await supabase.from('messages').insert({
        patient_id: selectedPatientId,
        doctor_id: ACTIVE_DOCTOR_ID,
        sender_type: 'DOCTOR',
        content,
      });

      if (error) throw error;
      await loadMessages();
    } catch (err) {
      console.error('Failed to send reply:', err);
      setReplyText(content);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mx-auto min-h-screen max-w-7xl space-y-6 bg-slate-50 p-4 font-sans sm:p-6 lg:p-8">
      <header className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
            Clinical Command Center
          </p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">Secure Messages</h1>
          <p className="mt-1 text-sm text-slate-500">
            Two-way patient messaging for Dr. CHANDRAKANTH S KESARI
          </p>
        </div>
        <button
          type="button"
          onClick={() => void loadMessages()}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
        >
          <RotateCw className="h-4 w-4" /> Refresh
        </button>
      </header>

      <div className="grid h-[calc(100vh-220px)] min-h-[520px] grid-cols-1 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm lg:grid-cols-[320px_1fr]">
        <aside className="flex flex-col border-b border-slate-200 lg:border-b-0 lg:border-r">
          <div className="border-b border-slate-200 px-4 py-3">
            <h2 className="text-sm font-bold text-slate-900">Patient Conversations</h2>
            <p className="text-xs text-slate-500">{threads.length} active thread(s)</p>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center p-8 text-sm text-slate-500">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading threads...
              </div>
            ) : threads.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500">
                <MessageSquare className="mx-auto mb-3 h-8 w-8 text-slate-300" />
                No patient messages yet.
              </div>
            ) : (
              threads.map((thread) => {
                const isActive = thread.patientId === selectedPatientId;
                return (
                  <button
                    key={thread.patientId}
                    type="button"
                    onClick={() => setSelectedPatientId(thread.patientId)}
                    className={`w-full border-b border-slate-100 px-4 py-3 text-left transition hover:bg-slate-50 ${
                      isActive ? 'bg-emerald-50' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-800">
                        {thread.patientName.charAt(0)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-sm font-semibold text-slate-900">
                            {thread.patientName}
                          </p>
                          <span className="shrink-0 text-[10px] text-slate-400">
                            {thread.latestAt ? formatTime(thread.latestAt) : ''}
                          </span>
                        </div>
                        <p className="mt-0.5 truncate text-xs text-slate-500">
                          {thread.latestPreview || 'No messages'}
                        </p>
                        {thread.phone && (
                          <p className="mt-0.5 text-[10px] text-slate-400">{thread.phone}</p>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        <section className="flex min-h-0 flex-col">
          {!activeThread ? (
            <div className="flex flex-1 flex-col items-center justify-center p-8 text-center text-slate-500">
              <UserRound className="mb-3 h-10 w-10 text-slate-300" />
              <p className="text-sm font-medium">Select a patient thread to view messages</p>
            </div>
          ) : (
            <>
              <div className="border-b border-slate-200 px-5 py-4">
                <h3 className="text-base font-bold text-slate-900">{activeThread.patientName}</h3>
                <p className="text-xs text-slate-500">
                  Patient ID: {activeThread.patientId}
                  {activeThread.phone ? ` · ${activeThread.phone}` : ''}
                </p>
              </div>

              <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
                {activeThread.messages.map((msg) => {
                  const isDoctor = msg.sender_type === 'DOCTOR';
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isDoctor ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                          isDoctor
                            ? 'rounded-br-none bg-emerald-600 text-white'
                            : 'rounded-bl-none border border-slate-200 bg-slate-100 text-slate-900'
                        }`}
                      >
                        <p className="mb-1 text-[10px] font-bold uppercase opacity-70">
                          {isDoctor ? 'You (Doctor)' : activeThread.patientName}
                        </p>
                        <p className="leading-relaxed">{msg.content}</p>
                        <p className="mt-1 text-right text-[10px] opacity-60">
                          {formatRelative(msg.created_at)}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={chatBottomRef} />
              </div>

              <form
                onSubmit={handleSendReply}
                className="flex gap-3 border-t border-slate-200 px-5 py-4"
              >
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={`Reply to ${activeThread.patientName}...`}
                  className="flex-1 rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                />
                <button
                  type="submit"
                  disabled={sending || !replyText.trim()}
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Send
                </button>
              </form>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
