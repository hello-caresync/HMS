'use client';

import { useState } from 'react';
import { AlertTriangle, Paperclip, Send } from 'lucide-react';
import { toast } from 'sonner';

import { ClinicalPageSkeleton } from '@/components/doctor/ClinicalSkeleton';
import { ClinicalPageHeader } from '@/components/doctor/doctor-ui';
import { useClinicalMessages, useSendClinicalMessage } from '@/lib/doctor/hooks/useClinicalQueries';
import { clinicalClasses } from '@/lib/doctor/theme';

export default function ClinicalChatCenter() {
  const [channelId, setChannelId] = useState('ch-nurse');
  const { data, isLoading, isError, error } = useClinicalMessages(channelId);
  const sendMessage = useSendClinicalMessage();
  const [draft, setDraft] = useState('');
  const [statFlag, setStatFlag] = useState(false);

  const channels = data?.channels ?? [];
  const thread = data?.messages ?? [];

  const send = () => {
    if (!draft.trim()) return;
    sendMessage.mutate(
      { channelId, body: draft, stat: statFlag },
      {
        onSuccess: () => {
          toast.success(statFlag ? 'STAT message sent' : 'Message sent');
          setDraft('');
          setStatFlag(false);
        },
        onError: (e) => toast.error(e.message),
      },
    );
  };

  if (isLoading) return <ClinicalPageSkeleton rows={4} />;
  if (isError) return <p className="text-sm text-[#EF4444]">{(error as Error).message}</p>;

  const activeChannel = channels.find((c) => c.id === channelId);

  return (
    <div className={`${clinicalClasses.pageBg} flex h-[calc(100vh-6rem)] flex-col`}>
      <ClinicalPageHeader title="Clinical Communication Center" subtitle="PostgreSQL-backed secure channels" />

      <div className="flex min-h-0 flex-1 gap-3 overflow-hidden">
        <aside className={`${clinicalClasses.card} w-full max-w-xs shrink-0 overflow-y-auto p-2`}>
          {channels.map((ch) => (
            <button
              key={ch.id}
              type="button"
              onClick={() => setChannelId(ch.id)}
              className={`mb-1 w-full rounded-lg px-3 py-2 text-left text-sm ${
                channelId === ch.id ? 'bg-[#0D9488]/10 font-semibold' : 'hover:bg-slate-50'
              }`}
            >
              <div className="flex justify-between">
                <span>{ch.name}</span>
                {ch.unread > 0 && <span className="rounded-full bg-[#EF4444] px-1.5 text-[10px] text-white">{ch.unread}</span>}
              </div>
              <p className="truncate text-xs text-[#64748B]">{ch.lastMessage}</p>
            </button>
          ))}
        </aside>

        <div className={`${clinicalClasses.card} flex min-h-0 flex-1 flex-col p-0`}>
          <div className="border-b bg-[#0F172A] px-4 py-2 text-sm font-semibold text-white">{activeChannel?.name ?? 'Channel'}</div>
          <ul className="flex-1 space-y-2 overflow-y-auto p-4">
            {thread.map((m) => (
              <li key={m.id} className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${m.sender === 'You' ? 'ml-auto bg-[#0D9488] text-white' : 'bg-slate-100'}`}>
                {m.stat && (
                  <span className="mb-1 flex items-center gap-1 text-[10px] font-bold uppercase text-[#F59E0B]">
                    <AlertTriangle className="h-3 w-3" /> STAT
                  </span>
                )}
                <p className="text-[10px] opacity-80">
                  {m.sender} · {m.at}
                </p>
                <p>{m.body}</p>
              </li>
            ))}
          </ul>
          <div className="border-t p-3">
            <label className="mb-2 flex items-center gap-2 text-xs font-semibold text-[#64748B]">
              <input type="checkbox" checked={statFlag} onChange={(e) => setStatFlag(e.target.checked)} />
              Mark as STAT
            </label>
            <div className="flex gap-2">
              <button type="button" className={clinicalClasses.btnSecondary} aria-label="Attach">
                <Paperclip className="h-4 w-4" />
              </button>
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                className="flex-1 rounded-lg border px-3 py-2 text-sm"
                onKeyDown={(e) => e.key === 'Enter' && send()}
              />
              <button type="button" className={clinicalClasses.btnPrimary} onClick={send}>
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
