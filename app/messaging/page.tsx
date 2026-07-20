'use client';

import { useCallback, useRef, useState } from 'react';
import { MessageSquareCode, Paperclip, Send, ShieldCheck } from 'lucide-react';

type ChatChannel = 'nurses' | 'lab' | 'pharmacy' | 'reception';

type ChatMessage = {
  id: string;
  sender: string;
  text: string;
  timestamp: string;
};

const CHANNELS: { key: ChatChannel; label: string }[] = [
  { key: 'nurses', label: 'Chat with Nurses' },
  { key: 'lab', label: 'Lab' },
  { key: 'pharmacy', label: 'Pharmacy' },
  { key: 'reception', label: 'Reception' },
];

const INITIAL_LOGS: Record<ChatChannel, ChatMessage[]> = {
  nurses: [
    { id: 'n-1', sender: 'Nurse A.', text: 'Vitals updated for OT-03.', timestamp: '08:45' },
  ],
  lab: [
    { id: 'l-1', sender: 'Lab Desk', text: 'HbA1c ready for P.N.', timestamp: '09:10' },
  ],
  pharmacy: [
    { id: 'p-1', sender: 'Pharmacy', text: 'Interaction query on pending Rx.', timestamp: '09:22' },
  ],
  reception: [
    { id: 'r-1', sender: 'Reception', text: 'Walk-in slot 11:30 opened.', timestamp: '10:00' },
  ],
};

const INPUT_CLASS =
  'w-full rounded-lg border-2 border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-950 placeholder:text-slate-500 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200';

function formatTime(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

export default function MessagingPage() {
  const [activeChannel, setActiveChannel] = useState<ChatChannel>('nurses');
  const [chatLogs, setChatLogs] = useState(INITIAL_LOGS);
  const [chatInput, setChatInput] = useState('');
  const [actionNote, setActionNote] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const showNotice = useCallback((message: string) => {
    setActionNote(message);
    window.setTimeout(() => setActionNote(null), 4500);
  }, []);

  const sendMessage = () => {
    const trimmed = chatInput.trim();
    if (!trimmed) return;
    const msg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'You',
      text: trimmed,
      timestamp: formatTime(),
    };
    setChatLogs((prev) => ({ ...prev, [activeChannel]: [...prev[activeChannel], msg] }));
    setChatInput('');
    window.setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  };

  return (
    <div className="min-h-screen w-full font-sans text-slate-950">
      <div className="w-full space-y-5 p-4 sm:p-6 lg:p-8">
        <header className="flex w-full flex-col gap-4 border-b-2 border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-black text-slate-900 sm:text-3xl">Secure Internal Chat</h1>
            <p className="mt-1 text-sm font-medium text-slate-800">
              Standalone messaging · Nurses · Lab · Pharmacy · Reception · 13 Jul 2026
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-lg border-2 border-slate-200 bg-white px-3 py-2 text-xs font-black uppercase text-slate-950">
            <ShieldCheck className="h-4 w-4 text-emerald-700" aria-hidden />
            <span>COMMS_VAULT_ENCRYPTED</span>
          </div>
        </header>

        {actionNote && (
          <p role="status" className="rounded-lg border-2 border-sky-300 bg-sky-50 px-4 py-2.5 text-sm font-bold text-sky-950">
            {actionNote}
          </p>
        )}

        <div className="grid w-full grid-cols-1 gap-4 rounded-xl border border-slate-200/80 bg-white shadow-[0_4px_16px_-4px_rgba(0,117,140,0.03)] p-4 lg:grid-cols-[28%_72%]">
          <div className="space-y-2">
            {CHANNELS.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setActiveChannel(key)}
                className={`flex w-full items-center gap-2 rounded-lg border-2 px-3 py-2.5 text-left text-xs font-black ${
                  activeChannel === key
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : 'border-slate-200 bg-slate-50 text-slate-950 hover:bg-white'
                }`}
              >
                <MessageSquareCode className="h-4 w-4 shrink-0" aria-hidden />
                {label}
              </button>
            ))}
          </div>
          <div className="flex flex-col rounded-xl border border-slate-200/80 bg-white shadow-[0_4px_16px_-4px_rgba(0,117,140,0.03)]">
            <div className="border-b-2 border-slate-200 px-4 py-3">
              <p className="text-sm font-black text-slate-950">
                {CHANNELS.find((c) => c.key === activeChannel)?.label}
              </p>
            </div>
            <div className="max-h-80 flex-1 space-y-2 overflow-y-auto p-4" role="log">
              {chatLogs[activeChannel].map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.sender === 'You' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-lg px-3 py-2 text-xs font-bold ${
                      msg.sender === 'You'
                        ? 'bg-slate-900 text-white'
                        : 'border-2 border-slate-200 bg-white text-slate-950'
                    }`}
                  >
                    {msg.text}
                  </div>
                  <span className="mt-0.5 text-[10px] font-bold text-slate-600">
                    {msg.sender} · {msg.timestamp}
                  </span>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            <div className="flex gap-2 border-t-2 border-slate-200 p-3">
              <button
                type="button"
                onClick={() => showNotice('File sharing · sandbox attachment')}
                className="shrink-0 rounded-lg border-2 border-slate-200 bg-white p-2"
                aria-label="File sharing"
              >
                <Paperclip className="h-4 w-4 text-slate-950" aria-hidden />
              </button>
              <input
                type="text"
                className={INPUT_CLASS}
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), sendMessage())}
                placeholder="Type secure message…"
              />
              <button
                type="button"
                onClick={sendMessage}
                disabled={!chatInput.trim()}
                className="shrink-0 rounded-lg border-2 border-slate-900 bg-slate-900 p-2 text-white disabled:opacity-40"
                aria-label="Send"
              >
                <Send className="h-4 w-4" aria-hidden />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
