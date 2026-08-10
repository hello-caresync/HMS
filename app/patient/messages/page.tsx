'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Loader2, MessageSquare, RefreshCw, Send } from 'lucide-react';

interface ClinicalMessage {
  id: string;
  patient_name: string;
  doctor_name: string;
  message: string;
  priority?: string;
  created_at: string;
  sender_type?: string;
}

const MESSAGES_KEY = 'curasync_messages';
const LEGACY_MESSAGES_KEY = 'curasync_patient_messages';

function readLocalMessages(): ClinicalMessage[] {
  try {
    const raw =
      localStorage.getItem(MESSAGES_KEY) || localStorage.getItem(LEGACY_MESSAGES_KEY) || '[]';
    return JSON.parse(raw) as ClinicalMessage[];
  } catch {
    return [];
  }
}

function mergeMessages(local: ClinicalMessage[], remote: ClinicalMessage[]): ClinicalMessage[] {
  const map = new Map<string, ClinicalMessage>();
  for (const item of [...local, ...remote]) {
    map.set(item.id || `${item.created_at}-${item.message}`, item);
  }
  return Array.from(map.values()).sort((a, b) =>
    (b.created_at || '').localeCompare(a.created_at || ''),
  );
}

export default function PatientMessagesPage() {
  const [messages, setMessages] = useState<ClinicalMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const patientName =
    typeof window !== 'undefined'
      ? localStorage.getItem('patient_full_name') || 'Patient'
      : 'Patient';

  const loadMessages = useCallback(async () => {
    setLoading(true);
    let local = readLocalMessages();
    setMessages(local);

    try {
      const { data, error } = await supabase
        .from('patient_messages')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data) {
        local = mergeMessages(local, data as ClinicalMessage[]);
        localStorage.setItem(MESSAGES_KEY, JSON.stringify(local));
      }
    } catch {
      console.warn('Message sync notice');
    } finally {
      setMessages(local);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadMessages(), 0);
    const channel = supabase
      .channel('patient_messages_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'patient_messages' },
        () => void loadMessages(),
      )
      .subscribe();
    return () => {
      window.clearTimeout(timer);
      void supabase.removeChannel(channel);
    };
  }, [loadMessages]);

  const visible = useMemo(
    () =>
      messages.filter(
        (m) => !patientName || m.patient_name === patientName || !m.patient_name,
      ),
    [messages, patientName],
  );

  const handleSend = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft.trim()) return;
    setSending(true);

    const record: ClinicalMessage = {
      id: `msg_${Date.now()}`,
      patient_name: patientName,
      doctor_name: 'Care Team',
      message: draft.trim(),
      priority: 'normal',
      sender_type: 'patient',
      created_at: new Date().toISOString(),
    };

    const next = [record, ...messages];
    setMessages(next);
    localStorage.setItem(MESSAGES_KEY, JSON.stringify(next));
    setDraft('');

    try {
      await supabase.from('patient_messages').insert({
        patient_name: record.patient_name,
        doctor_name: record.doctor_name,
        message: record.message,
        priority: record.priority,
        sender_type: 'patient',
      });
    } catch {
      console.warn('Message saved locally');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 font-sans text-[#0E2924]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-[#0E2924]">Clinical Messaging</h1>
          <p className="mt-1 text-xs font-bold text-[#4B736B]">
            Secure chat with your care team — synced to Doctor App in real time.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void loadMessages()}
          className="rounded-full bg-white p-3 text-[#227B6B] shadow-sm"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      <div className="rounded-3xl border border-[#D5E8E3] bg-white p-6 shadow-sm">
        {loading ? (
          <div className="flex h-48 items-center justify-center gap-2 text-xs font-bold text-[#4B736B]">
            <Loader2 className="h-5 w-5 animate-spin text-[#227B6B]" /> Loading messages…
          </div>
        ) : visible.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center gap-2 text-center">
            <MessageSquare className="h-8 w-8 text-[#227B6B]/50" />
            <p className="text-sm font-black text-[#0E2924]">No clinical messages yet</p>
            <p className="text-xs font-bold text-[#4B736B]">
              Messages from your doctor will appear here instantly.
            </p>
          </div>
        ) : (
          <ul className="custom-scrollbar max-h-[28rem] space-y-3 overflow-y-auto pr-1">
            {visible.map((message) => (
              <li
                key={message.id}
                className={`rounded-2xl border p-4 text-xs ${
                  message.sender_type === 'patient'
                    ? 'ml-8 border-[#113831]/20 bg-[#EAF5F2]'
                    : 'mr-8 border-[#D5E8E3] bg-[#F4F8F7]'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-black text-[#113831]">
                    {message.sender_type === 'patient' ? 'You' : message.doctor_name}
                  </p>
                  <span className="font-bold text-[#4B736B]">
                    {message.created_at?.slice(0, 16).replace('T', ' ')}
                  </span>
                </div>
                <p className="mt-2 font-semibold text-[#0E2924]">{message.message}</p>
                {message.priority === 'urgent' && (
                  <span className="mt-2 inline-flex rounded-full bg-[#E63950]/10 px-2 py-0.5 text-[10px] font-black uppercase text-[#E63950]">
                    Urgent
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}

        <form onSubmit={(event) => void handleSend(event)} className="mt-5 flex gap-3">
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Write a message to your care team…"
            className="flex-1 rounded-2xl border border-[#D5E8E3] bg-[#F4F8F7] px-4 py-3 text-xs font-bold text-[#0E2924] outline-none focus:border-[#227B6B] focus:ring-2 focus:ring-[#EAF5F2]"
          />
          <button
            type="submit"
            disabled={sending || !draft.trim()}
            className="inline-flex items-center gap-2 rounded-2xl bg-[#113831] px-5 py-3 text-xs font-black text-white disabled:opacity-50"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
