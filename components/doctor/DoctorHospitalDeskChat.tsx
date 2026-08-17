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
import { Building2, Loader2, Send } from 'lucide-react';

import { createClient } from '@/lib/supabase/client';
import { HOSPITAL_ADMIN_SENDER_NAME } from '@/lib/ecosystem/hospital-doctor-messaging';
import { HOSPITAL_DESK_LABEL } from '@/lib/doctor/secure-messages-service';
import {
  buildDoctorThreads,
  formatThreadTime,
  loadDoctorSecureMessages,
  sendDoctorSecureMessage,
  subscribeDoctorSecureMessages,
  type ActiveDoctorProfile,
  type DoctorSecureMessage,
} from '@/lib/doctor/secure-messages-service';
import { getDoctorSession } from '@/lib/doctor/session';
import { DEFAULT_DOCTOR_EMPLOYEE_ID, DEFAULT_ACTIVE_DOCTOR_NAME } from '@/lib/doctor/command-center/supabase-service';

type DoctorHospitalDeskChatProps = {
  compact?: boolean;
  className?: string;
};

function DeskMessage({ message }: { message: DoctorSecureMessage }) {
  if (message.sender_role === 'DOCTOR') {
    return (
      <div className="flex flex-col items-end">
        <span className="mb-1 px-1 text-[10px] font-bold text-slate-500">
          You · {formatThreadTime(message.created_at)}
        </span>
        <div className="max-w-[85%] rounded-2xl rounded-br-none bg-teal-700 px-3 py-2 text-xs leading-relaxed text-white shadow-sm">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-start">
      <span className="mb-1 px-1 text-[10px] font-bold text-slate-600">
        🏢 Hospital Admin • Operations Desk · {formatThreadTime(message.created_at)}
      </span>
      <div className="max-w-[85%] rounded-2xl rounded-bl-none border border-slate-200 bg-slate-100 px-3 py-2 text-xs leading-relaxed text-slate-900 shadow-sm">
        {message.content}
      </div>
    </div>
  );
}

/** Live Hospital Operations Desk thread · used in Doctor OPD Command Center + Secure Messages. */
export function DoctorHospitalDeskChat({ compact = false, className = '' }: DoctorHospitalDeskChatProps) {
  const supabase = useMemo(() => createClient(), []);
  const feedRef = useRef<HTMLDivElement>(null);

  const activeDoctor = useMemo<ActiveDoctorProfile>(() => {
    const session = getDoctorSession();
    return {
      employee_id: session.employeeId || DEFAULT_DOCTOR_EMPLOYEE_ID,
      full_name: session.fullName || session.doctor_name || DEFAULT_ACTIVE_DOCTOR_NAME,
      department: session.department || 'Clinical',
    };
  }, []);

  const [messages, setMessages] = useState<DoctorSecureMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const thread = useMemo(() => buildDoctorThreads('hospital_desk', messages)[0] ?? null, [messages]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await loadDoctorSecureMessages(supabase, 'hospital_desk', activeDoctor);
    setMessages(result.messages);
    setError(result.error ?? null);
    setLoading(false);
  }, [activeDoctor, supabase]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    return subscribeDoctorSecureMessages('hospital_desk', activeDoctor, (message) => {
      setMessages((prev) => {
        if (prev.some((item) => item.id === message.id)) return prev;
        return [...prev, message];
      });
    });
  }, [activeDoctor]);

  useEffect(() => {
    feedRef.current?.scrollTo({ top: feedRef.current.scrollHeight, behavior: 'smooth' });
  }, [thread?.messages]);

  const handleSend = async (event?: FormEvent) => {
    event?.preventDefault();
    const text = draft.trim();
    if (!text || sending || !thread) return;

    const optimistic: DoctorSecureMessage = {
      id: `optimistic-${Date.now()}`,
      channel_type: 'doctor',
      sender_role: 'DOCTOR',
      sender_name: activeDoctor.full_name,
      sender_id: activeDoctor.employee_id,
      recipient_id: 'RH-ADMIN',
      recipient_name: HOSPITAL_ADMIN_SENDER_NAME,
      patient_id: null,
      patient_name: null,
      content: text,
      created_at: new Date().toISOString(),
      optimistic: true,
    };

    setMessages((prev) => [...prev, optimistic]);
    setDraft('');
    setSending(true);

    const result = await sendDoctorSecureMessage(supabase, {
      tab: 'hospital_desk',
      doctor: activeDoctor,
      text,
      thread,
    });

    if (!result.ok) {
      setMessages((prev) => prev.filter((item) => item.id !== optimistic.id));
      setDraft(text);
      setError(result.error ?? 'Send failed');
    } else if (result.message) {
      setMessages((prev) =>
        prev.map((item) => (item.id === optimistic.id ? result.message! : item)),
      );
    }

    setSending(false);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void handleSend();
    }
  };

  const heightClass = compact ? 'h-[320px]' : 'h-[380px]';

  return (
    <div
      className={`flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white/90 shadow-sm backdrop-blur-md ${heightClass} ${className}`}
    >
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0F3E5D]/10 text-base">
            🏢
          </span>
          <div>
            <h3 className="text-sm font-bold text-slate-800">{HOSPITAL_DESK_LABEL}</h3>
            <p className="text-[10px] text-slate-500">
              {activeDoctor.full_name} · {activeDoctor.employee_id} · channel_type doctor
            </p>
          </div>
        </div>
        <span className="rounded-md bg-teal-50 px-2 py-0.5 text-[10px] font-bold text-teal-700">
          Live
        </span>
      </div>

      {error ? (
        <p className="border-b border-red-100 bg-red-50 px-3 py-1.5 text-[10px] font-medium text-red-700">
          {error}
        </p>
      ) : null}

      <div ref={feedRef} className="custom-scrollbar flex-1 space-y-3 overflow-y-auto bg-[#F8FAFC] p-3">
        {loading ? (
          <div className="flex h-full items-center justify-center gap-2 text-xs text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            Syncing hospital desk…
          </div>
        ) : !thread || thread.messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center text-xs text-slate-400">
            <Building2 className="mb-2 h-6 w-6 opacity-40" />
            <span>No messages with {HOSPITAL_ADMIN_SENDER_NAME} yet.</span>
          </div>
        ) : (
          thread.messages.map((message) => <DeskMessage key={message.id} message={message} />)
        )}
      </div>

      <form onSubmit={(event) => void handleSend(event)} className="border-t border-slate-100 p-3">
        <div className="flex items-end gap-2">
          <textarea
            rows={compact ? 1 : 2}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message hospital operations desk…"
            className="flex-1 resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600"
          />
          <button
            type="submit"
            disabled={sending || !draft.trim()}
            className="flex items-center gap-1.5 rounded-xl bg-teal-700 px-3 py-2 text-xs font-bold text-white hover:bg-teal-800 disabled:opacity-50"
          >
            {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            Send
          </button>
        </div>
      </form>
    </div>
  );
}

export default DoctorHospitalDeskChat;
