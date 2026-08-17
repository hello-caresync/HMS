'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from 'react';
import { Building2, Loader2, Send, Stethoscope, UserRound, Wifi, WifiOff } from 'lucide-react';

import { createClient } from '@/lib/supabase/client';
import { DEFAULT_DOCTOR_EMPLOYEE_ID } from '@/lib/ecosystem/channel-messaging-service';
import { msgClasses } from '@/lib/ecosystem/messaging-theme';
import { DEFAULT_ACTIVE_DOCTOR_ID, DEFAULT_ACTIVE_DOCTOR_NAME } from '@/lib/doctor/command-center/supabase-service';
import { getDoctorSession } from '@/lib/doctor/session';
import {
  buildDoctorThreads,
  formatThreadDate,
  formatThreadTime,
  HOSPITAL_DESK_LABEL,
  loadDoctorSecureMessages,
  sendDoctorSecureMessage,
  subscribeDoctorSecureMessages,
  type ActiveDoctorProfile,
  type DoctorMessageTab,
  type DoctorSecureMessage,
  type DoctorSenderRole,
  type DoctorThread,
} from '@/lib/doctor/secure-messages-service';

function MessageBubble({ message }: { message: DoctorSecureMessage }) {
  const role = message.sender_role;

  if (role === 'DOCTOR') {
    return (
      <div className="flex flex-col items-end">
        <div className="mb-1 flex items-center gap-1.5 px-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">You</span>
          <span className="text-[10px] text-slate-400">• {formatThreadTime(message.created_at)}</span>
        </div>
        <div className="max-w-[75%] rounded-2xl rounded-br-none bg-teal-700 px-4 py-2.5 text-xs leading-relaxed text-white shadow-sm">
          {message.content}
        </div>
      </div>
    );
  }

  if (role === 'HOSPITAL_ADMIN') {
    return (
      <div className="flex flex-col items-start">
        <div className="mb-1 px-1 text-[10px] font-bold text-slate-600">
          🏢 Hospital Admin • Operations Desk
          <span className="ml-1.5 font-normal text-slate-400">• {formatThreadTime(message.created_at)}</span>
        </div>
        <div className="max-w-[75%] rounded-2xl rounded-bl-none border border-slate-200 bg-slate-100 px-4 py-2.5 text-xs leading-relaxed text-slate-900 shadow-sm">
          {message.content}
        </div>
      </div>
    );
  }

  const patientLabel = message.patient_name ?? message.sender_name ?? 'Patient';
  return (
    <div className="flex flex-col items-start">
      <div className="mb-1 px-1 text-[10px] font-bold text-slate-600">
        👤 {patientLabel}
        <span className="ml-1.5 font-normal text-slate-400">• {formatThreadTime(message.created_at)}</span>
      </div>
      <div className="max-w-[75%] rounded-2xl rounded-bl-none border border-slate-200 bg-white px-4 py-2.5 text-xs leading-relaxed text-slate-800 shadow-sm">
        {message.content}
      </div>
    </div>
  );
}

/** Doctor Command Center · unified Hospital Desk + Patient Threads secure messaging. */
export default function DoctorSecureMessagesPage() {
  const supabase = useMemo(() => createClient(), []);
  const feedRef = useRef<HTMLDivElement>(null);

  const activeDoctor = useMemo<ActiveDoctorProfile>(() => {
    const session = getDoctorSession();
    return {
      employee_id: session.employeeId || DEFAULT_DOCTOR_EMPLOYEE_ID,
      full_name: session.fullName || session.doctor_name || DEFAULT_ACTIVE_DOCTOR_NAME,
      department: session.department || 'Clinical',
      uuid: DEFAULT_ACTIVE_DOCTOR_ID,
    };
  }, []);

  const [activeTab, setActiveTab] = useState<DoctorMessageTab>('hospital_desk');
  const [messages, setMessages] = useState<DoctorSecureMessage[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const threads = useMemo(() => buildDoctorThreads(activeTab, messages), [activeTab, messages]);

  const activeThread = useMemo(() => {
    if (threads.length === 0) return null;
    return threads.find((thread) => thread.id === selectedThreadId) ?? threads[0];
  }, [threads, selectedThreadId]);

  const loadMessages = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await loadDoctorSecureMessages(supabase, activeTab, activeDoctor);
    setMessages(result.messages);
    setError(result.error ?? null);
    setLoading(false);
  }, [activeTab, activeDoctor, supabase]);

  useEffect(() => {
    setSelectedThreadId(null);
    void loadMessages();
  }, [loadMessages]);

  useEffect(() => {
    if (threads.length > 0 && !selectedThreadId) {
      setSelectedThreadId(threads[0].id);
    }
  }, [threads, selectedThreadId]);

  useEffect(() => {
    const unsubscribe = subscribeDoctorSecureMessages(activeTab, activeDoctor, (message) => {
      setConnected(true);
      setMessages((prev) => {
        if (prev.some((item) => item.id === message.id)) return prev;
        return [...prev, message];
      });
    });
    setConnected(true);
    return unsubscribe;
  }, [activeTab, activeDoctor]);

  useEffect(() => {
    feedRef.current?.scrollTo({ top: feedRef.current.scrollHeight, behavior: 'smooth' });
  }, [activeThread?.messages, activeTab]);

  const handleSendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || !activeThread || sending) return;

    const optimistic: DoctorSecureMessage = {
      id: `optimistic-${Date.now()}`,
      channel_type: activeTab === 'hospital_desk' ? 'doctor' : activeTab,
      sender_role: 'DOCTOR' as DoctorSenderRole,
      sender_name: activeDoctor.full_name,
      sender_id: activeDoctor.employee_id,
      recipient_id:
        activeTab === 'hospital_desk' ? 'RH-ADMIN' : activeThread.patient_id,
      recipient_name:
        activeTab === 'hospital_desk' ? 'Hospital Operations Desk' : activeThread.patient_name,
      patient_id: activeThread.patient_id,
      patient_name: activeThread.patient_name,
      content: trimmed,
      created_at: new Date().toISOString(),
      optimistic: true,
    };

    setMessages((prev) => [...prev, optimistic]);
    setDraft('');
    setSending(true);
    setError(null);

    const result = await sendDoctorSecureMessage(supabase, {
      tab: activeTab,
      doctor: activeDoctor,
      text: trimmed,
      thread: activeThread,
    });

    if (!result.ok) {
      setMessages((prev) => prev.filter((item) => item.id !== optimistic.id));
      setDraft(trimmed);
      setError(result.error ?? 'Could not send message.');
    } else if (result.message) {
      setMessages((prev) =>
        prev.map((item) => (item.id === optimistic.id ? result.message! : item)),
      );
    }

    setSending(false);
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    void handleSendMessage(draft);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void handleSendMessage(draft);
    }
  };

  return (
    <div className={`${msgClasses.page} mx-auto max-w-7xl space-y-4 p-4 sm:p-6`}>
      <header className={`${msgClasses.card} flex flex-wrap items-center justify-between gap-3 p-4`}>
        <div>
          <p className={msgClasses.label}>Clinical Command Center</p>
          <h1 className="text-xl font-black text-slate-900">Secure Messages</h1>
          <p className="mt-0.5 text-xs font-medium text-slate-500">
            {activeDoctor.full_name} · {activeDoctor.employee_id} · {activeDoctor.department}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${
              connected
                ? 'border-teal-200 bg-teal-50 text-teal-700'
                : 'border-slate-200 bg-slate-50 text-slate-500'
            }`}
          >
            {connected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
            Live
          </span>
          <button
            type="button"
            onClick={() => setActiveTab('hospital_desk')}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-all ${
              activeTab === 'hospital_desk'
                ? 'bg-[#0F3E5D] text-white shadow-sm'
                : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Building2 className="h-4 w-4" />
            Hospital Desk
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('patient_direct')}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-all ${
              activeTab === 'patient_direct'
                ? 'bg-[#0F3E5D] text-white shadow-sm'
                : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Stethoscope className="h-4 w-4" />
            Patient Threads
          </button>
        </div>
      </header>

      <div
        className={`grid min-h-[calc(100vh-220px)] grid-cols-1 overflow-hidden ${msgClasses.card} lg:grid-cols-[300px_1fr]`}
      >
        {/* Left sidebar — thread list */}
        <aside className="flex flex-col border-b border-slate-200 lg:border-b-0 lg:border-r">
          <div className="border-b border-slate-200 px-4 py-3">
            <h2 className="text-xs font-black text-slate-900">
              {activeTab === 'hospital_desk' ? 'Operations Channel' : 'Patient Threads'}
            </h2>
            <p className="text-[10px] font-medium text-slate-500">
              {activeTab === 'hospital_desk'
                ? 'Admin & operations desk'
                : `${threads.length} conversation${threads.length === 1 ? '' : 's'}`}
            </p>
          </div>

          <div className="custom-scrollbar flex-1 overflow-y-auto">
            {loading ? (
              <p className="flex items-center gap-2 p-4 text-xs text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading threads…
              </p>
            ) : threads.length === 0 ? (
              <p className="p-6 text-center text-xs text-slate-500">
                {activeTab === 'hospital_desk'
                  ? 'No hospital desk messages yet.'
                  : 'No patient conversations yet.'}
              </p>
            ) : (
              threads.map((thread) => {
                const active = thread.id === activeThread?.id;
                return (
                  <button
                    key={thread.id}
                    type="button"
                    onClick={() => setSelectedThreadId(thread.id)}
                    className={`w-full border-b border-slate-100 px-4 py-3 text-left transition hover:bg-slate-50 ${
                      active ? 'bg-[#0F3E5D]/5' : ''
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {thread.isHospitalDesk ? (
                        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#0F3E5D]/10 text-sm">
                          🏢
                        </span>
                      ) : (
                        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
                          <UserRound className="h-3.5 w-3.5" />
                        </span>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-bold text-slate-900">{thread.label}</p>
                        <p className="mt-0.5 truncate text-[10px] text-slate-500">
                          {thread.latestPreview || '—'}
                        </p>
                        {thread.latestAt ? (
                          <p className="mt-1 text-[10px] text-slate-400">
                            {formatThreadDate(thread.latestAt)}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* Right panel — chat */}
        <div className="flex min-h-0 flex-col">
          {!activeThread ? (
            <div className="flex flex-1 flex-col items-center justify-center p-8 text-slate-500">
              <UserRound className="mb-2 h-8 w-8 text-slate-300" />
              <p className="text-xs font-medium">Select a thread to start messaging</p>
            </div>
          ) : (
            <>
              <div className="border-b border-slate-200 bg-slate-50/80 px-5 py-3">
                <h3 className="text-sm font-bold text-slate-900">
                  {activeThread.isHospitalDesk ? HOSPITAL_DESK_LABEL : activeThread.label}
                </h3>
                <p className="text-[11px] text-slate-500">
                  {activeTab === 'hospital_desk'
                    ? `channel_type doctor · RH-ADMIN · ${activeDoctor.employee_id}`
                    : `channel_type patient_direct · ${activeThread.patient_id ?? '—'}`}
                </p>
              </div>

              {error ? (
                <p className="border-b border-red-100 bg-red-50 px-4 py-2 text-xs font-medium text-red-700">
                  {error}
                </p>
              ) : null}

              <div ref={feedRef} className="custom-scrollbar flex-1 space-y-4 overflow-y-auto bg-[#F8FAFC] p-5">
                {loading ? (
                  <div className="flex h-full items-center justify-center gap-2 text-xs text-slate-400">
                    <Loader2 className="h-4 w-4 animate-spin" /> Loading messages…
                  </div>
                ) : activeThread.messages.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center text-xs text-slate-400">
                    <span>No messages in this thread yet.</span>
                    <span className="mt-1">Type below to start the conversation.</span>
                  </div>
                ) : (
                  activeThread.messages.map((message) => (
                    <MessageBubble key={message.id} message={message} />
                  ))
                )}
              </div>

              <form
                onSubmit={handleSubmit}
                className="sticky bottom-0 border-t border-slate-200 bg-white p-4"
              >
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  {activeTab === 'hospital_desk'
                    ? `Messaging ${HOSPITAL_DESK_LABEL}`
                    : `Messaging ${activeThread.patient_name ?? activeThread.label}`}
                </p>
                <div className="flex items-end gap-3">
                  <textarea
                    rows={2}
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={
                      activeTab === 'hospital_desk'
                        ? 'Message hospital operations regarding OPD, beds, or urgent queries…'
                        : `Reply to ${activeThread.patient_name ?? activeThread.label}…`
                    }
                    className="flex-1 resize-none rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600"
                  />
                  <button
                    type="submit"
                    disabled={sending || !draft.trim()}
                    className="flex items-center gap-2 rounded-xl bg-teal-700 px-5 py-3 text-xs font-bold text-white transition hover:bg-teal-800 disabled:opacity-50"
                  >
                    {sending ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Send className="h-3.5 w-3.5" />
                    )}
                    Send
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
