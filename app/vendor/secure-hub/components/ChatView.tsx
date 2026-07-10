'use client';

import React from 'react';

import { ChatMessage } from '../types';
import {
  btnPrimaryClassName,
  inputClassName,
  ModuleTransition,
  PageHeader,
  panelClassName,
} from './hubUi';

interface ChatProps {
  chatThreads: ChatMessage[];
  chatInput: string;
  setChatInput: (val: string) => void;
  handleSendChat: (e: React.FormEvent) => void;
}

export default function ChatView({
  chatThreads,
  chatInput,
  setChatInput,
  handleSendChat,
}: ChatProps) {
  const threads = chatThreads ?? [];

  return (
    <ModuleTransition moduleKey="communication">
      <PageHeader
        title="Hospital Live Chat"
        description="Secure procurement messaging between your team and hospital buyers."
      />

      <div className={`${panelClassName} flex h-[420px] flex-col overflow-hidden`}>
        <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50 p-4">
          {threads.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-800">
              No messages yet. Start the conversation below.
            </p>
          ) : (
            threads.map((msg, index) => (
              <div
                key={msg?.id ?? `msg-row-${index}`}
                className={`flex max-w-[85%] flex-col ${
                  msg?.sender === 'Vendor'
                    ? 'ml-auto items-end'
                    : 'mr-auto items-start'
                }`}
              >
                <span className="mb-1 text-[10px] font-medium text-slate-800">
                  {msg?.sender} · {msg?.timestamp ?? '—'}
                </span>
                <div
                  className={`rounded-2xl px-3.5 py-2.5 text-sm shadow-sm ${
                    msg?.sender === 'Vendor'
                      ? 'rounded-tr-sm bg-slate-900 text-white'
                      : 'rounded-tl-sm border border-slate-200 bg-white text-slate-800'
                  }`}
                >
                  {msg?.text ?? ''}
                </div>
              </div>
            ))
          )}
        </div>

        <form
          onSubmit={handleSendChat}
          className="flex shrink-0 gap-2 border-t border-slate-200 bg-white p-4"
        >
          <input
            type="text"
            placeholder="Type a message to the hospital team..."
            value={chatInput}
            onChange={(event) => setChatInput(event.target.value)}
            className={inputClassName}
          />
          <button type="submit" className={`${btnPrimaryClassName} shrink-0`}>
            Send
          </button>
        </form>
      </div>
    </ModuleTransition>
  );
}
