'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Loader2, MessageSquare, RefreshCw, Send, BellRing } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabaseClient';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import {
  CLINICAL_STORAGE,
  readJsonLocal,
  resolveActivePatientId,
  writeJsonLocal,
} from '@/lib/clinical/bridge';
import type { ClinicalAdviceMessage } from '@/lib/clinical/types';

function mergeMessages(
  local: ClinicalAdviceMessage[],
  remote: ClinicalAdviceMessage[],
): ClinicalAdviceMessage[] {
  const map = new Map<string, ClinicalAdviceMessage>();
  for (const item of [...local, ...remote]) {
    map.set(item.id || `${item.created_at}-${item.message}`, item);
  }
  return Array.from(map.values()).sort((a, b) =>
    (b.created_at || '').localeCompare(a.created_at || ''),
  );
}

export default function PatientMessagesPage() {
  const [messages, setMessages] = useState<ClinicalAdviceMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [patientId, setPatientId] = useState(resolveActivePatientId());
  const [patientName, setPatientName] = useState('Patient');

  const loadMessages = useCallback(async () => {
    setLoading(true);
    const id = resolveActivePatientId();
    setPatientId(id);
    const name =
      typeof window !== 'undefined'
        ? window.localStorage.getItem('patient_full_name') || 'Patient'
        : 'Patient';
    setPatientName(name);

    let local = readJsonLocal<ClinicalAdviceMessage[]>(CLINICAL_STORAGE.messages, []);
    local = local.filter((m) => !m.patient_id || m.patient_id === id || m.patient_name === name);
    setMessages(local);

    try {
      const { data, error } = await supabase
        .from('patient_messages')
        .select('*')
        .or(`patient_id.eq.${id},patient_name.eq.${name}`)
        .order('created_at', { ascending: false });

      if (!error && data) {
        const remote = (data as Record<string, unknown>[]).map((row) => ({
          id: String(row.id),
          patient_id: String(row.patient_id || id),
          patient_name: String(row.patient_name || name),
          doctor_id: String(row.doctor_id || row.doctor_employee_id || ''),
          doctor_name: String(row.doctor_name || 'Care Team'),
          message: String(row.message || ''),
          priority: String(row.priority || 'normal'),
          sender_type: (row.sender_type as 'doctor' | 'patient') || 'doctor',
          created_at: String(row.created_at || new Date().toISOString()),
        }));
        local = mergeMessages(local, remote);
        writeJsonLocal(CLINICAL_STORAGE.messages, local);
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

    const onDoctorMessage = (event: Event) => {
      const msg = (event as CustomEvent<ClinicalAdviceMessage>).detail;
      if (!msg) return;
      setMessages((prev) => mergeMessages(prev, [msg as ClinicalAdviceMessage]));
      toast.message('New clinical alert', { description: msg.message });
    };
    window.addEventListener('curasync:doctor-message', onDoctorMessage);

    const channel = supabase
      .channel(`patient_messages_${patientId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'patient_messages',
          filter: `patient_id=eq.${patientId}`,
        },
        (payload: RealtimePostgresChangesPayload<any>) => {
          const row = payload.new as Record<string, unknown>;
          if (row.sender_type && row.sender_type !== 'doctor') {
            void loadMessages();
            return;
          }
          const msg: ClinicalAdviceMessage = {
            id: String(row.id),
            patient_id: String(row.patient_id || patientId),
            patient_name: String(row.patient_name || patientName),
            doctor_id: String(row.doctor_id || row.doctor_employee_id || ''),
            doctor_name: String(row.doctor_name || 'Doctor'),
            message: String(row.message || ''),
            priority: String(row.priority || 'high'),
            sender_type: 'doctor',
            created_at: String(row.created_at || new Date().toISOString()),
          };
          setMessages((prev) => {
            const next = mergeMessages(prev, [msg]);
            writeJsonLocal(CLINICAL_STORAGE.messages, next);
            return next;
          });
          toast.success('Doctor advice received', {
            description: msg.message,
            icon: <BellRing className="h-4 w-4" />,
          });
        },
      )
      .subscribe();

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('curasync:doctor-message', onDoctorMessage);
      void supabase.removeChannel(channel);
    };
  }, [loadMessages, patientId, patientName]);

  const visible = useMemo(() => messages, [messages]);

  const handleSend = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft.trim()) return;
    setSending(true);

    const record: ClinicalAdviceMessage = {
      id: `msg_${Date.now()}`,
      patient_id: patientId,
      patient_name: patientName,
      doctor_id: '',
      doctor_name: 'Care Team',
      message: draft.trim(),
      priority: 'normal',
      sender_type: 'patient',
      created_at: new Date().toISOString(),
    };

    const next = [record, ...messages];
    setMessages(next);
    writeJsonLocal(CLINICAL_STORAGE.messages, next);
    setDraft('');

    try {
      await supabase.from('patient_messages').insert({
        patient_id: record.patient_id,
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
            Secure chat with your care team — doctor advice lands here in real time.
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
          <div className="flex h-40 items-center justify-center gap-2 text-xs font-black text-[#113831]">
            <Loader2 className="h-4 w-4 animate-spin text-[#227B6B]" /> Loading messages…
          </div>
        ) : visible.length === 0 ? (
          <div className="flex h-40 flex-col items-center justify-center gap-2 text-center text-slate-500">
            <MessageSquare className="h-8 w-8 text-[#D5E8E3]" />
            <p className="text-xs font-bold">No messages yet. Doctor advice will appear instantly.</p>
          </div>
        ) : (
          <div className="max-h-[420px] space-y-3 overflow-y-auto pr-1">
            {visible.map((m) => {
              const fromDoctor = m.sender_type === 'doctor';
              return (
                <div
                  key={m.id}
                  className={`rounded-2xl border px-4 py-3 ${
                    fromDoctor
                      ? 'border-amber-200 bg-amber-50'
                      : 'border-[#D5E8E3] bg-[#F4F8F7]'
                  }`}
                >
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <p className="text-[11px] font-black text-[#0E2924]">
                      {fromDoctor ? m.doctor_name : 'You'}
                      {m.doctor_id ? ` · ${m.doctor_id}` : ''}
                    </p>
                    <span className="text-[10px] font-bold text-slate-500">
                      {new Date(m.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-[#113831]">{m.message}</p>
                  {fromDoctor && m.priority === 'high' ? (
                    <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-black uppercase text-amber-800">
                      <BellRing className="h-3 w-3" /> Clinical alert
                    </span>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}

        <form onSubmit={handleSend} className="mt-5 flex gap-2 border-t border-[#EAF5F2] pt-4">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Message your care team…"
            className="flex-1 rounded-2xl border border-[#D5E8E3] bg-[#F4F8F7] px-4 py-3 text-xs font-bold text-[#0E2924] outline-none focus:border-[#227B6B]"
          />
          <button
            type="submit"
            disabled={sending}
            className="inline-flex items-center gap-2 rounded-2xl bg-[#113831] px-5 py-3 text-xs font-black text-white transition hover:bg-[#227B6B] disabled:opacity-60"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
