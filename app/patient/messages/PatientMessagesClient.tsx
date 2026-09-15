'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2, MessageSquare, Send } from 'lucide-react';
import { toast } from 'sonner';

import {
  loadPatientChannelMessages,
  subscribePatientChannelMessages,
  type PatientChatMessage,
} from '@/lib/patient/messages/patient-channel-messages';
import { getActivePatientId, getActivePatientName } from '@/lib/patient/active-patient-node';
import { sendChannelMessage } from '@/lib/ecosystem/channel-messaging-service';
import { supabase } from '@/lib/supabaseClient';
import { portalSurfaces } from '@/lib/shared/portal-surfaces';
import { PortalEmptyState } from '@/components/shared/PortalEmptyState';

export default function PatientMessagesClient() {
  const patientSurface = portalSurfaces.patient;
  const patientId = getActivePatientId();
  const patientName = getActivePatientName();
  const [messages, setMessages] = useState<PatientChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    const rows = await loadPatientChannelMessages(supabase, [patientId]);
    setMessages(rows);
    setLoading(false);
  }, [patientId]);

  useEffect(() => {
    void reload();
    return subscribePatientChannelMessages([patientId], (message) => {
      setMessages((current) => {
        if (current.some((row) => row.id === message.id)) return current;
        return [...current, message];
      });
    });
  }, [patientId, reload]);

  const onSend = async () => {
    if (!draft.trim()) return;
    setSending(true);
    try {
      const result = await sendChannelMessage(supabase, {
        channel_type: 'clinical',
        recipient_type: 'hospital',
        sender_role: 'patient',
        sender_id: patientId,
        sender_name: patientName || 'Patient',
        recipient_id: 'rh-admin',
        message: draft.trim(),
      });
      if (!result.ok) throw new Error(result.error ?? 'Could not send message');
      setDraft('');
      void reload();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Send failed');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className={`mx-auto max-w-3xl space-y-4 p-4 ${patientSurface.page} rounded-3xl`}>
      <header className={`rounded-2xl border p-5 shadow-sm ${patientSurface.card}`}>
        <p className="text-[10px] font-black uppercase tracking-wider text-[#227B6B]">
          Hospital Care Team
        </p>
        <h1 className="text-xl font-black text-[#0E2924]">Secure Messages</h1>
      </header>

      <div className={`min-h-[420px] rounded-2xl border p-4 shadow-sm ${patientSurface.card}`}>
        {loading ? (
          <div className="flex h-full items-center justify-center py-16 text-[#227B6B]">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Loading messages...
          </div>
        ) : messages.length === 0 ? (
          <PortalEmptyState
            icon={MessageSquare}
            title="No messages yet"
            body="Send a note to the Regal Hospital care desk. Replies appear here in real time."
            surfaceClass={patientSurface.empty}
            accentClass="text-[#227B6B]/40"
          />
        ) : (
          <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`rounded-xl border px-3 py-2 text-sm ${
                  msg.sender_role.toUpperCase().includes('PATIENT')
                    ? 'ml-8 border-[#D5E8E3] bg-[#EAF5F2]'
                    : 'mr-8 border-slate-200 bg-slate-50'
                }`}
              >
                <p className="text-[10px] font-black uppercase text-[#227B6B]">{msg.sender_name}</p>
                <p className="mt-1 font-medium text-[#0E2924]">{msg.message}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={`flex gap-2 rounded-2xl border p-3 shadow-sm ${patientSurface.card}`}>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Message the hospital care desk..."
          className="flex-1 rounded-xl border border-[#D5E8E3] bg-[#F4F8F7] px-3 py-2 text-sm font-semibold focus:outline-none"
        />
        <button
          type="button"
          disabled={sending || !draft.trim()}
          onClick={() => void onSend()}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black text-white disabled:opacity-50 ${patientSurface.btnPrimary}`}
        >
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Send
        </button>
      </div>
    </div>
  );
}
