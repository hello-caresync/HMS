'use client';

import { useEffect, useState } from 'react';
import { MessageSquare, Video, Paperclip, Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { OsBadge, OsBtn, OsPage } from '@/components/doctor-os/ui/OsPrimitives';
import { useClinicalMessages, useMessageChannels, useSendClinicalMessage } from '@/lib/doctor/hooks/useClinicalQueries';
import { useOsColors } from '@/lib/doctor-os/store';

export default function DoctorOsCommunication() {
  const c = useOsColors();
  const { data: channelData, isLoading: channelsLoading } = useMessageChannels();
  const channels = channelData?.channels ?? [];
  const [channel, setChannel] = useState('');
  const [draft, setDraft] = useState('');

  useEffect(() => {
    if (!channel && channels.length > 0) setChannel(channels[0].id);
  }, [channels, channel]);

  const { data, isLoading: messagesLoading } = useClinicalMessages(channel);
  const send = useSendClinicalMessage();

  const onSend = () => {
    if (!draft.trim() || !channel) return;
    send.mutate(
      { channelId: channel, body: draft },
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
    <OsPage>
      <div className="mb-6">
        <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: c.accent }}>Unified inbox</p>
        <h1 className="text-[24px] font-bold">Communication Centre</h1>
        <p className="mt-1 text-[13px]" style={{ color: c.textSecondary }}>
          Real-time messaging with nursing, lab, pharmacy, and patients
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-12">
        <aside className="space-y-1 lg:col-span-3">
          {channelsLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" style={{ color: c.accent }} />
          ) : (
            channels.map((ch) => (
              <button
                key={ch.id}
                type="button"
                onClick={() => setChannel(ch.id)}
                className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-[13px] font-medium"
                style={{
                  backgroundColor: channel === ch.id ? c.accentSoft : 'transparent',
                  color: channel === ch.id ? c.accent : c.textSecondary,
                }}
              >
                {ch.name}
                {ch.unread ? <OsBadge tone="info">{ch.unread}</OsBadge> : null}
              </button>
            ))
          )}
          <OsBtn href="/doctor/telemedicine" variant="secondary" className="mt-4 w-full">
            <Video className="h-4 w-4" /> Video consult
          </OsBtn>
        </aside>

        <div className="flex flex-col lg:col-span-9" style={{ minHeight: 480 }}>
          <div className="flex-1 overflow-y-auto rounded-2xl border p-4" style={{ borderColor: c.border, backgroundColor: c.surface }}>
            {messagesLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin" style={{ color: c.accent }} />
              </div>
            ) : (data?.messages ?? []).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <MessageSquare className="mb-2 h-8 w-8 opacity-40" />
                <p className="text-[13px]" style={{ color: c.textSecondary }}>No messages in this channel yet</p>
              </div>
            ) : (
              (data?.messages ?? []).map((m) => (
                <div key={m.id} className="mb-3 max-w-[80%] rounded-2xl px-4 py-2" style={{ backgroundColor: c.muted }}>
                  <p className="text-[11px] font-bold">{m.sender}</p>
                  <p className="text-[13px]">{m.body}</p>
                  <p className="text-[10px]" style={{ color: c.textSecondary }}>
                    {new Date(m.at).toLocaleString()}
                  </p>
                </div>
              ))
            )}
          </div>
          <div className="mt-3 flex gap-2">
            <button type="button" className="rounded-xl p-2" style={{ backgroundColor: c.muted }} aria-label="Attach file">
              <Paperclip className="h-4 w-4" />
            </button>
            <input
              className="flex-1 rounded-xl border px-4 py-2 text-[13px]"
              style={{ borderColor: c.border }}
              placeholder="Message nursing, lab, pharmacy…"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onSend()}
            />
            <OsBtn onClick={onSend} disabled={send.isPending}>
              <Send className="h-4 w-4" />
            </OsBtn>
          </div>
        </div>
      </div>
    </OsPage>
  );
}
