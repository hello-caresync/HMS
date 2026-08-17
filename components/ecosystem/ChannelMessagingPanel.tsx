'use client';

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { Loader2, RefreshCw, Send, Wifi, WifiOff } from 'lucide-react';

import {
  formatMessageClock,
  formatMessageTime,
  isOutboundMessage,
  type ChannelMessageRow,
  type ChannelSenderRole,
} from '@/lib/ecosystem/channel-messaging-service';
import { msgClasses } from '@/lib/ecosystem/messaging-theme';

type ChannelMessagingPanelProps = {
  title: string;
  subtitle?: string;
  messages: ChannelMessageRow[];
  loading?: boolean;
  error?: string | null;
  connected?: boolean;
  viewerRole: ChannelSenderRole;
  draft: string;
  onDraftChange: (value: string) => void;
  onSend: () => void | Promise<void>;
  sending?: boolean;
  onRefresh?: () => void | Promise<void>;
  headerActions?: ReactNode;
  emptyMessage?: string;
  placeholder?: string;
  heightClass?: string;
};

/** Compact CC-aligned chat surface shared across Hospital, Vendor, Doctor, and Patient apps. */
export function ChannelMessagingPanel({
  title,
  subtitle,
  messages,
  loading = false,
  error = null,
  connected = false,
  viewerRole,
  draft,
  onDraftChange,
  onSend,
  sending = false,
  onRefresh,
  headerActions,
  emptyMessage = 'No messages yet. Start the conversation.',
  placeholder = 'Type a message…',
  heightClass = 'h-[min(520px,65vh)]',
}: ChannelMessagingPanelProps) {
  const feedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    feedRef.current?.scrollTo({ top: feedRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    void onSend();
  };

  return (
    <section className={`${msgClasses.card} flex ${heightClass} flex-col overflow-hidden`}>
      <div className={`${msgClasses.header} flex flex-wrap items-start justify-between gap-3`}>
        <div className="min-w-0">
          <h2 className="text-sm font-black text-slate-900">{title}</h2>
          {subtitle ? <p className="mt-0.5 text-xs font-medium text-slate-500">{subtitle}</p> : null}
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${
              connected
                ? 'border-[#00A896]/40 bg-[#00A896]/10 text-[#0F766E]'
                : 'border-slate-200 bg-slate-50 text-slate-500'
            }`}
          >
            {connected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
            {connected ? 'Live' : 'Offline'}
          </span>
          {onRefresh ? (
            <button type="button" onClick={() => void onRefresh()} className={msgClasses.btnGhost}>
              <RefreshCw className="h-3.5 w-3.5" aria-hidden />
              Refresh
            </button>
          ) : null}
          {headerActions}
        </div>
      </div>

      {error ? (
        <p className="border-b border-red-100 bg-red-50 px-4 py-2 text-xs font-medium text-red-700">
          {error}
        </p>
      ) : null}

      <div ref={feedRef} className="custom-scrollbar flex-1 space-y-2 overflow-y-auto bg-[#F8FAFC] p-4">
        {loading ? (
          <p className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            Loading conversation…
          </p>
        ) : messages.length === 0 ? (
          <p className="rounded-lg border border-dashed border-slate-200 px-4 py-10 text-center text-xs font-medium text-slate-500">
            {emptyMessage}
          </p>
        ) : (
          messages.map((message, index) => {
            const outbound = isOutboundMessage(message, viewerRole);
            const key = message.id || `msg-${message.created_at}-${index}`;
            return (
              <div key={key} className={`flex ${outbound ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] ${outbound ? msgClasses.bubbleOut : msgClasses.bubbleIn}`}>
                  <div className="mb-1 flex flex-wrap items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide opacity-80">
                    <span>{message.sender_role}</span>
                    <span>·</span>
                    <span>{message.sender_name}</span>
                    {!message.is_read && !outbound ? (
                      <span className={msgClasses.unread}>New</span>
                    ) : null}
                  </div>
                  {message.subject ? (
                    <p className="mb-1 text-xs font-bold opacity-90">{message.subject}</p>
                  ) : null}
                  <p className="whitespace-pre-wrap font-medium leading-relaxed">{message.message}</p>
                  <p className={`mt-1.5 text-[10px] font-semibold ${outbound ? 'text-white/70' : 'text-slate-400'}`}>
                    {formatMessageClock(message.created_at)} · {formatMessageTime(message.created_at)}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      <form onSubmit={handleSubmit} className="border-t border-slate-200 bg-white p-3">
        <div className="flex gap-2">
          <textarea
            value={draft}
            onChange={(event) => onDraftChange(event.target.value)}
            rows={2}
            placeholder={placeholder}
            className={`${msgClasses.input} min-h-[2.75rem] flex-1 resize-none`}
          />
          <button
            type="submit"
            disabled={sending || !draft.trim()}
            className={`${msgClasses.btnAccent} self-end`}
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Send
          </button>
        </div>
      </form>
    </section>
  );
}

export default ChannelMessagingPanel;
