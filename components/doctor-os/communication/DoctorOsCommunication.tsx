'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, MessageSquare, Video, Paperclip, Send, Loader2, ArrowRightLeft } from 'lucide-react';
import { toast } from 'sonner';

import { OsBtn, OsPage } from '@/components/doctor-os/ui/OsPrimitives';
import { useClinicalMessages, useMessageChannels, useSendClinicalMessage } from '@/lib/doctor/hooks/useClinicalQueries';
import { sageUi } from '@/lib/doctor/ui-tokens';

const STAT_CHANNELS = new Set(['ch-lab', 'ch-nurse']);

export default function DoctorOsCommunication() {
  const { data: channelData, isLoading: channelsLoading } = useMessageChannels();
  const channels = channelData?.channels ?? [];
  const [channel, setChannel] = useState('');
  const [draft, setDraft] = useState('');

  useEffect(() => {
    if (!channel && channels.length > 0) setChannel(channels[0].id);
  }, [channels, channel]);

  const { data, isLoading: messagesLoading } = useClinicalMessages(channel);
  const send = useSendClinicalMessage();
  const activeChannel = channels.find((c) => c.id === channel);
  const isStatChannel = STAT_CHANNELS.has(channel);

  const onSend = () => {
    if (!draft.trim() || !channel) return;
    send.mutate(
      { channelId: channel, body: draft, stat: isStatChannel },
      {
        onSuccess: () => {
          toast.success('Sent');
          setDraft('');
        },
        onError: (e) => toast.error(e.message),
      },
    );
  };

  return (
    <div className="doctor-page">
      <header className="mb-6">
        <p className="text-[11px] font-bold uppercase tracking-widest text-brand-primary">Communication Center</p>
        <h1 className="text-xl font-black text-brand-text">Clinical messaging workspace</h1>
      </header>

      {isStatChannel && (
        <div className="esi-critical-callout mb-4 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 shrink-0" aria-hidden />
          <div>
            <p className="font-bold">STAT channel active — {activeChannel?.name}</p>
            <p className="text-sm">Priority alerts route to on-call nursing and pathology teams.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-12 gap-6">
        <aside className="col-span-12 space-y-1 lg:col-span-3">
          {channelsLoading ? (
            <Loader2 className="h-5 w-5 animate-spin text-brand-primary" />
          ) : (
            channels.map((ch) => (
              <button
                key={ch.id}
                type="button"
                onClick={() => setChannel(ch.id)}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-[13px] font-medium transition-all ${
                  channel === ch.id
                    ? 'border-l-4 border-brand-primary bg-brand-light font-bold text-brand-text'
                    : 'text-[#5A584A] hover:bg-brand-surface'
                }`}
              >
                {ch.name}
                {ch.unread ? (
                  <span className="rounded-full bg-rose-600 px-1.5 py-0.5 text-[10px] font-bold text-white">{ch.unread}</span>
                ) : null}
              </button>
            ))
          )}
          <a href="/doctor/telemedicine" className={`${sageUi.btnSecondary} mt-4 flex w-full items-center justify-center gap-2 text-sm`}>
            <Video className="h-4 w-4" /> Video consult
          </a>
        </aside>

        <div className="col-span-12 flex flex-col lg:col-span-9" style={{ minHeight: 480 }}>
          <div className="doctor-card mb-3 flex items-center gap-3 border-brand-light bg-brand-surface p-3">
            <ArrowRightLeft className="h-5 w-5 text-brand-primary" aria-hidden />
            <div className="text-sm">
              <p className="font-bold">Patient transfer pending</p>
              <p className="text-[#5A584A]">MRN NX-MRN-9021 · Ward 3 → ICU step-down · Awaiting bed confirmation</p>
            </div>
          </div>

          <div className="doctor-card flex-1 overflow-y-auto p-4" style={{ minHeight: 360 }}>
            {messagesLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-brand-primary" />
              </div>
            ) : (data?.messages ?? []).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <MessageSquare className="mb-2 h-8 w-8 text-brand-primary/40" />
                <p className="text-[13px] text-[#5A584A]">No messages in {activeChannel?.name ?? 'this channel'} yet</p>
              </div>
            ) : (
              (data?.messages ?? []).map((m) => (
                <div
                  key={m.id}
                  className={`mb-3 max-w-[80%] rounded-2xl px-4 py-2 ${
                    m.stat ? 'border-2 border-rose-300 bg-rose-50' : 'bg-brand-surface'
                  }`}
                >
                  {m.stat && <p className="text-[10px] font-black uppercase text-rose-700">STAT</p>}
                  <p className="text-[11px] font-bold text-brand-text">{m.sender}</p>
                  <p className="text-[13px]">{m.body}</p>
                  <p className="text-[10px] text-[#5A584A]">{new Date(m.at).toLocaleString()}</p>
                </div>
              ))
            )}
          </div>
          <div className="mt-3 flex gap-2">
            <button type="button" className="rounded-xl border border-brand-light bg-white p-2" aria-label="Attach file">
              <Paperclip className="h-4 w-4 text-brand-primary" />
            </button>
            <input
              className={`${sageUi.input} flex-1`}
              placeholder="Message nursing, lab, pharmacy…"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onSend()}
            />
            <button type="button" className={sageUi.btnPrimary} onClick={onSend} disabled={send.isPending}>
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
