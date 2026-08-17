'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { Loader2, Send } from 'lucide-react';
import type { SupabaseClient } from '@supabase/supabase-js';

import { createClient } from '@/lib/supabase/client';
import {
  ECOSYSTEM_HOSPITAL_ADMIN_ID,
  formatChannelTime,
  isHospitalSender,
  loadEcosystemChannelMessages,
  sendPartnerEcosystemMessage,
  subscribeEcosystemChannel,
  type EcosystemChannelMessage,
} from '@/lib/ecosystem/ecosystem-channels';

export type DoctorCommsProfile = {
  id: string;
  name: string;
  department: string;
};

type DoctorClinicalCommsProps = {
  supabase?: SupabaseClient;
  currentDoctor: DoctorCommsProfile;
};

function isDoctorSender(role: string): boolean {
  return role.toLowerCase() === 'doctor';
}

export function DoctorClinicalComms({ supabase: supabaseProp, currentDoctor }: DoctorClinicalCommsProps) {
  const supabase = useMemo(() => supabaseProp ?? createClient(), [supabaseProp]);
  const endRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<EcosystemChannelMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadMessages = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    const result = await loadEcosystemChannelMessages(supabase, 'doctor', {
      doctorId: currentDoctor.id,
    });
    setMessages(result.rows);
    setLoadError(result.error ?? null);
    setIsLoading(false);
  }, [currentDoctor.id, supabase]);

  useEffect(() => {
    void loadMessages();
  }, [loadMessages]);

  useEffect(() => {
    const unsubscribe = subscribeEcosystemChannel('doctor', (row) => {
      const doctorId = currentDoctor.id.toLowerCase();
      const inThread =
        row.recipient_id?.toLowerCase() === doctorId ||
        row.sender_id?.toLowerCase() === doctorId ||
        (isHospitalSender(String(row.sender_role)) && row.recipient_id?.toLowerCase() === doctorId);

      if (!inThread) return;

      setMessages((prev) => {
        if (prev.some((item) => item.id === row.id)) return prev;
        return [...prev, row];
      });
    });

    return unsubscribe;
  }, [currentDoctor.id]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (event?: FormEvent) => {
    event?.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed || isSending) return;

    setIsSending(true);
    const result = await sendPartnerEcosystemMessage(supabase, {
      channel: 'doctor',
      sender_role: 'doctor',
      sender_id: currentDoctor.id,
      sender_name: currentDoctor.name,
      message: trimmed,
    });

    if (!result.ok) {
      setLoadError(result.error ?? 'Could not send message.');
    } else {
      setInputText('');
      if (result.row) {
        setMessages((prev) => {
          if (prev.some((item) => item.id === result.row!.id)) return prev;
          return [...prev, result.row!];
        });
      }
    }
    setIsSending(false);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void handleSend();
    }
  };

  return (
    <div className="flex h-[calc(100vh-140px)] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/80 px-6 py-4">
        <div>
          <h2 className="text-sm font-bold text-slate-800">Hospital Operations & Administration Desk</h2>
          <p className="text-[11px] text-slate-500">
            Connected as {currentDoctor.name} ({currentDoctor.id}) • {currentDoctor.department}
          </p>
        </div>
        <span className="rounded-md bg-[#0F3E5D] px-2.5 py-1 text-xs font-semibold text-white">
          Internal Clinical Channel
        </span>
      </div>

      {loadError ? (
        <p className="border-b border-red-100 bg-red-50 px-4 py-2 text-xs font-medium text-red-700">{loadError}</p>
      ) : null}

      <div className="flex-1 space-y-4 overflow-y-auto bg-[#F8FAFC] p-6">
        {isLoading ? (
          <div className="flex h-full items-center justify-center gap-2 text-xs text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading hospital desk messages…
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-xs text-slate-400">
            <span>No messages with {ECOSYSTEM_HOSPITAL_ADMIN_ID} yet.</span>
            <span className="mt-1">Send OPD, bed, or urgent queries below.</span>
          </div>
        ) : (
          messages.map((message) => {
            const fromDoctor = isDoctorSender(String(message.sender_role));
            return (
              <div key={message.id} className={`flex flex-col ${fromDoctor ? 'items-end' : 'items-start'}`}>
                <div className="mb-1 flex items-center gap-1.5 px-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    {fromDoctor ? 'You' : message.sender_name}
                  </span>
                  <span className="text-[10px] text-slate-400">• {formatChannelTime(message.created_at)}</span>
                </div>
                <div
                  className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed shadow-sm ${
                    fromDoctor
                      ? 'rounded-br-none bg-[#0F3E5D] text-white'
                      : 'rounded-bl-none border border-slate-200 bg-white text-slate-800'
                  }`}
                >
                  {message.message}
                </div>
              </div>
            );
          })
        )}
        <div ref={endRef} />
      </div>

      <form
        onSubmit={(event) => void handleSend(event)}
        className="flex flex-col gap-2 border-t border-slate-200 bg-white p-4"
      >
        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
          Messaging Regal Hospital Operations Desk ({ECOSYSTEM_HOSPITAL_ADMIN_ID})
        </p>
        <div className="flex items-end gap-3">
          <textarea
            rows={2}
            value={inputText}
            onChange={(event) => setInputText(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message hospital operations desk regarding OPD, beds, or urgent queries… (Enter to send)"
            className="flex-1 resize-none rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0F3E5D]"
          />
          <button
            type="submit"
            disabled={isSending || !inputText.trim()}
            className="flex items-center gap-2 rounded-xl bg-[#0F3E5D] px-5 py-3 text-xs font-bold text-white transition-all hover:bg-[#0B2C42] disabled:opacity-50"
          >
            {isSending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            Send
          </button>
        </div>
      </form>
    </div>
  );
}

export default DoctorClinicalComms;
