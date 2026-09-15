'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Loader2, MessageSquare, Send } from 'lucide-react';
import { toast } from 'sonner';

import { getActiveDoctorProfile } from '@/lib/doctor/command-center/supabase-service';
import { createClient } from '@/lib/supabase/client';
import {
  buildDoctorThreads,
  formatThreadTime,
  loadDoctorSecureMessages,
  sendDoctorSecureMessage,
  subscribeDoctorSecureMessages,
  type ActiveDoctorProfile,
  type DoctorMessageTab,
  type DoctorSecureMessage,
  type DoctorThread,
} from '@/lib/doctor/secure-messages-service';

export default function DoctorOsCommunication() {
  const [doctor, setDoctor] = useState<ActiveDoctorProfile | null>(null);
  const [tab, setTab] = useState<DoctorMessageTab>('hospital_desk');
  const [threads, setThreads] = useState<DoctorThread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string>('hospital-desk');
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    void (async () => {
      const profile = await getActiveDoctorProfile();
      setDoctor({
        employee_id: String(profile?.doctor_id ?? 'RH-D02'),
        full_name: String(profile?.full_name ?? 'Doctor'),
        department: 'General Medicine',
        uuid: profile?.doctor_id ? String(profile.doctor_id) : undefined,
      });
    })();
  }, []);

  const reload = useCallback(async () => {
    if (!doctor) return;
    setLoading(true);
    const result = await loadDoctorSecureMessages(createClient(), tab, doctor);
    const nextThreads = buildDoctorThreads(tab, result.messages);
    setThreads(nextThreads);
    if (!nextThreads.some((thread) => thread.id === activeThreadId)) {
      setActiveThreadId(nextThreads[0]?.id ?? 'hospital-desk');
    }
    setLoading(false);
  }, [activeThreadId, doctor, tab]);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    if (!doctor) return;
    return subscribeDoctorSecureMessages(tab, doctor, (message: DoctorSecureMessage) => {
      setThreads((current) => {
        const rebuilt = buildDoctorThreads(tab, [
          ...current.flatMap((thread) => thread.messages),
          message,
        ]);
        return rebuilt.length > 0 ? rebuilt : current;
      });
    });
  }, [doctor, tab]);

  const activeThread = useMemo(
    () => threads.find((thread) => thread.id === activeThreadId) ?? threads[0],
    [activeThreadId, threads],
  );

  const onSend = async () => {
    if (!doctor || !activeThread || !draft.trim()) return;
    setSending(true);
    const result = await sendDoctorSecureMessage(createClient(), {
      tab,
      doctor,
      thread: activeThread,
      text: draft.trim(),
    });
    setSending(false);
    if (!result.ok) {
      toast.error(result.error ?? 'Send failed');
      return;
    }
    toast.success('Sent');
    setDraft('');
    if (result.message) {
      setThreads((current) =>
        buildDoctorThreads(tab, [...current.flatMap((thread) => thread.messages), result.message!]),
      );
    }
  };

  if (!doctor) {
    return (
      <div className="doctor-page flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-brand-primary" />
      </div>
    );
  }

  return (
    <div className="doctor-page">
      <header className="mb-6">
        <p className="text-[11px] font-bold uppercase tracking-widest text-brand-primary">Communication Center</p>
        <h1 className="text-xl font-black text-brand-text">Live clinical messaging</h1>
      </header>

      <div className="mb-4 flex gap-2">
        {(['hospital_desk', 'patient_direct'] as DoctorMessageTab[]).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setTab(option)}
            className={`rounded-xl px-4 py-2 text-xs font-bold uppercase ${
              tab === option
                ? 'bg-brand-primary text-white'
                : 'border border-brand-light bg-white text-brand-text'
            }`}
          >
            {option === 'hospital_desk' ? 'Hospital desk' : 'Patients'}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-6">
        <aside className="col-span-12 space-y-1 lg:col-span-3">
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin text-brand-primary" />
          ) : threads.length === 0 ? (
            <p className="text-sm text-[#5A584A]">No threads yet</p>
          ) : (
            threads.map((thread) => (
              <button
                key={thread.id}
                type="button"
                onClick={() => setActiveThreadId(thread.id)}
                className={`flex w-full flex-col rounded-xl px-3 py-2.5 text-left text-[13px] transition-all ${
                  activeThreadId === thread.id
                    ? 'border-l-4 border-brand-primary bg-brand-light font-bold text-brand-text'
                    : 'text-[#5A584A] hover:bg-brand-surface'
                }`}
              >
                <span>{thread.label}</span>
                <span className="truncate text-[11px] font-normal opacity-70">{thread.latestPreview}</span>
              </button>
            ))
          )}
        </aside>

        <div className="col-span-12 flex flex-col lg:col-span-9" style={{ minHeight: 480 }}>
          <div className="doctor-card flex-1 overflow-y-auto p-4" style={{ minHeight: 360 }}>
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-brand-primary" />
              </div>
            ) : (activeThread?.messages ?? []).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <MessageSquare className="mb-2 h-8 w-8 text-brand-primary/40" />
                <p className="text-[13px] text-[#5A584A]">No messages in {activeThread?.label ?? 'this thread'} yet</p>
              </div>
            ) : (
              (activeThread?.messages ?? []).map((message) => (
                <div key={message.id} className="mb-3 max-w-[80%] rounded-2xl bg-brand-surface px-4 py-2">
                  <p className="text-[11px] font-bold text-brand-text">{message.sender_name}</p>
                  <p className="text-[13px]">{message.content}</p>
                  <p className="text-[10px] text-[#5A584A]">{formatThreadTime(message.created_at)}</p>
                </div>
              ))
            )}
          </div>

          <div className="doctor-card mt-3 flex items-center gap-2 p-3">
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Type a secure message…"
              className="flex-1 rounded-xl border border-brand-light px-3 py-2 text-sm"
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  void onSend();
                }
              }}
            />
            <button
              type="button"
              disabled={sending || !draft.trim()}
              onClick={() => void onSend()}
              className="inline-flex items-center gap-2 rounded-xl bg-brand-primary px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
