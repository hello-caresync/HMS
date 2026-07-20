'use client';

import { useCallback, useRef, useState } from 'react';
import {
  FileText,
  Mic,
  MicOff,
  MonitorUp,
  PhoneOff,
  Send,
  Video,
  VideoOff,
} from 'lucide-react';

type ChatMessage = {
  id: string;
  sender: 'doctor' | 'patient';
  text: string;
  timestamp: string;
};

type SharedReport = {
  id: string;
  fileName: string;
  uploadedAt: string;
  category: string;
};

const CONNECTION_SUMMARY =
  'Standalone telemedicine terminal · encrypted RTC sandbox · remote consult · live chat · 13 Jul 2026';

const PATIENT = {
  initials: 'P.N.',
  uhid: 'NX-2026-301882',
  sessionId: 'TEL-SES-8821',
};

const INITIAL_CHAT: ChatMessage[] = [
  {
    id: 'msg-1',
    sender: 'patient',
    text: 'Good morning doctor, I have been having persistent headaches for three days.',
    timestamp: '09:02',
  },
  {
    id: 'msg-2',
    sender: 'doctor',
    text: 'Good morning. Can you describe the pain — location, intensity, and any associated symptoms?',
    timestamp: '09:03',
  },
  {
    id: 'msg-3',
    sender: 'patient',
    text: 'Frontal region, moderate, with occasional nausea. No vision changes.',
    timestamp: '09:04',
  },
];

const SHARED_REPORTS: SharedReport[] = [
  {
    id: 'rpt-1',
    fileName: 'CBC_Report_2026-07-10.pdf',
    uploadedAt: '2026-07-10 14:22',
    category: 'Lab Report',
  },
  {
    id: 'rpt-2',
    fileName: 'Chest_XRay_PA_Sandbox.pdf',
    uploadedAt: '2026-07-11 09:15',
    category: 'Imaging',
  },
  {
    id: 'rpt-3',
    fileName: 'Prior_Prescription_Summary.pdf',
    uploadedAt: '2026-07-08 16:40',
    category: 'Pharmacy',
  },
];

const INPUT_CLASS =
  'w-full rounded-lg border-2 border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-950 placeholder:text-slate-500 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200';

function formatTime(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

function createMessageId(): string {
  return `msg-${Date.now()}`;
}

export default function TelemedicineWorkspacePage() {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [sessionActive, setSessionActive] = useState(true);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(INITIAL_CHAT);
  const [chatInput, setChatInput] = useState('');
  const [actionNote, setActionNote] = useState<string | null>(null);
  const [viewedReportId, setViewedReportId] = useState<string | null>(null);

  const [rxDrug, setRxDrug] = useState('Paracetamol 500mg');
  const [rxDose, setRxDose] = useState('1 tab TID × 3 days');
  const [rxNotes, setRxNotes] = useState('Take after meals · avoid alcohol');

  const chatEndRef = useRef<HTMLDivElement>(null);

  const showNotice = useCallback((message: string) => {
    setActionNote(message);
    window.setTimeout(() => setActionNote(null), 4500);
  }, []);

  const sendChatMessage = () => {
    const trimmed = chatInput.trim();
    if (!trimmed) return;

    const newMessage: ChatMessage = {
      id: createMessageId(),
      sender: 'doctor',
      text: trimmed,
      timestamp: formatTime(),
    };

    setChatMessages((prev) => [...prev, newMessage]);
    setChatInput('');

    window.setTimeout(() => {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  };

  const handleChatKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      sendChatMessage();
    }
  };

  const handleEndSession = () => {
    setSessionActive(false);
    setIsScreenSharing(false);
    if (isRecording) setIsRecording(false);
    showNotice('Session ended · sandbox disconnect simulated · no real RTC teardown');
  };

  const handleViewReport = (report: SharedReport) => {
    setViewedReportId(report.id);
    showNotice(`Quick-view · ${report.fileName} · ${report.category} · sandbox preview only`);
  };

  const toggleRecording = () => {
    setIsRecording((prev) => {
      const next = !prev;
      showNotice(
        next
          ? 'Consultation recording started · sandbox flag only · no media captured'
          : 'Consultation recording stopped · sandbox flag cleared',
      );
      return next;
    });
  };

  return (
    <div className="min-h-screen w-full font-sans text-slate-950 selection:bg-slate-200">
      <div className="w-full space-y-5 p-4 sm:p-6 lg:p-8">
        {/* Comms header */}
        <header className="flex w-full flex-col gap-4 border-b-2 border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
              Telemedicine Consultation Terminal
            </h1>
            <p className="mt-1 max-w-3xl text-sm font-medium leading-relaxed text-slate-800">
              {CONNECTION_SUMMARY}
            </p>
            <p className="mt-2 font-mono text-xs font-black text-slate-950">
              Patient · {PATIENT.initials} · {PATIENT.uhid} · session {PATIENT.sessionId}
            </p>
          </div>
          <div className="inline-flex shrink-0 items-center gap-2 rounded-lg border-2 border-slate-200 bg-white px-3 py-2 text-xs font-black uppercase tracking-wide text-slate-950 shadow-sm">
            <Video className="h-4 w-4 text-sky-700" aria-hidden />
            <span>RTC_TELECOM_SECURE_STREAM</span>
          </div>
        </header>

        {actionNote && (
          <p
            role="status"
            className="w-full rounded-lg border-2 border-sky-300 bg-sky-50 px-4 py-2.5 text-sm font-bold text-sky-950"
          >
            {actionNote}
          </p>
        )}

        {/* Side-by-side virtual encounter */}
        <div className="grid w-full grid-cols-1 gap-5 lg:grid-cols-[60%_40%]">
          {/* Left — streaming & chat */}
          <section aria-label="Real-time streaming and chat" className="w-full space-y-4">
            <div className="relative aspect-video w-full overflow-hidden rounded-xl border-2 border-slate-800 bg-slate-900">
              {sessionActive ? (
                <>
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-slate-600 bg-slate-800">
                      <span className="text-2xl font-black text-slate-100">{PATIENT.initials}</span>
                    </div>
                    <p className="text-sm font-black uppercase tracking-wider text-slate-200">
                      Video Consultation · Live Feed Simulated
                    </p>
                    <p className="font-mono text-[10px] font-bold text-slate-400">
                      {PATIENT.sessionId} · sandbox stream · no WebRTC provider
                    </p>
                  </div>

                  {isRecording && (
                    <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-md border border-rose-600 bg-rose-950/80 px-2 py-1">
                      <span className="h-2 w-2 animate-pulse rounded-full bg-rose-500" aria-hidden />
                      <span className="text-[10px] font-black uppercase text-rose-100">REC</span>
                    </div>
                  )}

                  {isScreenSharing && (
                    <div className="absolute right-3 top-3 rounded-md border border-sky-600 bg-sky-950/80 px-2 py-1 text-[10px] font-black uppercase text-sky-100">
                      Screen Sharing
                    </div>
                  )}

                  {isVideoOff && (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-950/70">
                      <VideoOff className="h-10 w-10 text-slate-400" aria-hidden />
                    </div>
                  )}

                  <div className="absolute bottom-0 left-0 right-0 flex flex-wrap items-center justify-center gap-2 border-t border-slate-700 bg-slate-950/90 px-4 py-3">
                    <button
                      type="button"
                      onClick={() => setIsMuted((p) => !p)}
                      aria-pressed={isMuted}
                      className={`rounded-lg border-2 p-2.5 transition-colors ${
                        isMuted
                          ? 'border-amber-500 bg-amber-900 text-amber-100'
                          : 'border-slate-600 bg-slate-800 text-slate-100 hover:bg-slate-700'
                      }`}
                      aria-label={isMuted ? 'Unmute audio' : 'Mute audio'}
                    >
                      {isMuted ? (
                        <MicOff className="h-4 w-4" aria-hidden />
                      ) : (
                        <Mic className="h-4 w-4" aria-hidden />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsVideoOff((p) => !p)}
                      aria-pressed={isVideoOff}
                      className={`rounded-lg border-2 p-2.5 transition-colors ${
                        isVideoOff
                          ? 'border-amber-500 bg-amber-900 text-amber-100'
                          : 'border-slate-600 bg-slate-800 text-slate-100 hover:bg-slate-700'
                      }`}
                      aria-label={isVideoOff ? 'Enable video' : 'Disable video'}
                    >
                      {isVideoOff ? (
                        <VideoOff className="h-4 w-4" aria-hidden />
                      ) : (
                        <Video className="h-4 w-4" aria-hidden />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsScreenSharing((p) => !p);
                        showNotice(
                          isScreenSharing
                            ? 'Screen sharing stopped · sandbox'
                            : 'Screen sharing started · sandbox overlay',
                        );
                      }}
                      aria-pressed={isScreenSharing}
                      className={`rounded-lg border-2 p-2.5 transition-colors ${
                        isScreenSharing
                          ? 'border-sky-500 bg-sky-900 text-sky-100'
                          : 'border-slate-600 bg-slate-800 text-slate-100 hover:bg-slate-700'
                      }`}
                      aria-label="Toggle screen sharing"
                    >
                      <MonitorUp className="h-4 w-4" aria-hidden />
                    </button>
                    <button
                      type="button"
                      onClick={handleEndSession}
                      className="rounded-lg border-2 border-rose-600 bg-rose-700 p-2.5 text-white transition-colors hover:bg-rose-600"
                      aria-label="End session"
                    >
                      <PhoneOff className="h-4 w-4" aria-hidden />
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex h-full items-center justify-center">
                  <p className="text-sm font-black uppercase tracking-wider text-slate-400">
                    Session Ended
                  </p>
                </div>
              )}
            </div>

            {/* Live chat */}
            <div className="w-full rounded-xl border border-slate-200/80 bg-white shadow-[0_4px_16px_-4px_rgba(0,117,140,0.03)] p-4">
              <h2 className="text-sm font-black text-slate-950">Live Chat</h2>
              <div
                className="mt-3 max-h-48 space-y-2 overflow-y-auto rounded-lg border-2 border-slate-200 bg-slate-50 p-3"
                role="log"
                aria-live="polite"
                aria-label="Chat messages"
              >
                {chatMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${
                      msg.sender === 'doctor' ? 'items-end' : 'items-start'
                    }`}
                  >
                    <div
                      className={`max-w-[85%] rounded-lg px-3 py-2 text-xs font-bold ${
                        msg.sender === 'doctor'
                          ? 'bg-slate-900 text-white'
                          : 'border-2 border-slate-200 bg-white text-slate-950'
                      }`}
                    >
                      {msg.text}
                    </div>
                    <span className="mt-0.5 text-[10px] font-bold text-slate-600">
                      {msg.sender === 'doctor' ? 'You' : PATIENT.initials} · {msg.timestamp}
                    </span>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
              <div className="mt-3 flex gap-2">
                <input
                  type="text"
                  className={INPUT_CLASS}
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={handleChatKeyDown}
                  placeholder="Type a message…"
                  disabled={!sessionActive}
                  aria-label="Chat message input"
                />
                <button
                  type="button"
                  onClick={sendChatMessage}
                  disabled={!sessionActive || !chatInput.trim()}
                  className="shrink-0 rounded-lg border-2 border-slate-900 bg-slate-900 px-3 py-2 text-white transition-colors hover:bg-slate-800 disabled:opacity-40"
                  aria-label="Send message"
                >
                  <Send className="h-4 w-4" aria-hidden />
                </button>
              </div>
            </div>
          </section>

          {/* Right — clinical utilities */}
          <aside aria-label="Integrated clinical utilities" className="w-full space-y-4">
            {/* Share reports */}
            <section className="w-full rounded-xl border border-slate-200/80 bg-white shadow-[0_4px_16px_-4px_rgba(0,117,140,0.03)] p-4">
              <h2 className="text-sm font-black text-slate-950">Share Reports Portal</h2>
              <p className="mt-1 text-xs font-bold text-slate-800">
                Patient-uploaded documents · quick-view sandbox
              </p>
              <ul className="mt-3 space-y-2">
                {SHARED_REPORTS.map((report) => (
                  <li
                    key={report.id}
                    className={`flex flex-wrap items-center justify-between gap-2 rounded-lg border-2 px-3 py-2.5 ${
                      viewedReportId === report.id
                        ? 'border-sky-400 bg-sky-50'
                        : 'border-slate-200 bg-slate-50'
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="flex items-center gap-1.5 text-xs font-black text-slate-950">
                        <FileText className="h-3.5 w-3.5 shrink-0" aria-hidden />
                        {report.fileName}
                      </p>
                      <p className="text-[10px] font-bold text-slate-800">
                        {report.category} · {report.uploadedAt}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleViewReport(report)}
                      className="text-[10px] font-black uppercase text-sky-800 hover:text-sky-950"
                    >
                      Quick View
                    </button>
                  </li>
                ))}
              </ul>
            </section>

            {/* Digital prescription */}
            <section className="w-full rounded-xl border border-slate-200/80 bg-white shadow-[0_4px_16px_-4px_rgba(0,117,140,0.03)] p-4">
              <h2 className="text-sm font-black text-slate-950">Digital Prescription Workspace</h2>
              <p className="mt-1 text-xs font-bold text-slate-800">
                Mini e-Rx · immediate drug lines · sandbox only
              </p>
              <div className="mt-3 space-y-3">
                <label className="block space-y-1">
                  <span className="text-[10px] font-black uppercase text-slate-950">Drug</span>
                  <input
                    type="text"
                    className={INPUT_CLASS}
                    value={rxDrug}
                    onChange={(e) => setRxDrug(e.target.value)}
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-[10px] font-black uppercase text-slate-950">Dose</span>
                  <input
                    type="text"
                    className={INPUT_CLASS}
                    value={rxDose}
                    onChange={(e) => setRxDose(e.target.value)}
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-[10px] font-black uppercase text-slate-950">Notes</span>
                  <input
                    type="text"
                    className={INPUT_CLASS}
                    value={rxNotes}
                    onChange={(e) => setRxNotes(e.target.value)}
                  />
                </label>

                <button
                  type="button"
                  onClick={toggleRecording}
                  className={`flex w-full items-center justify-between rounded-lg border-2 px-3 py-2.5 text-left transition-colors ${
                    isRecording
                      ? 'border-rose-400 bg-rose-50'
                      : 'border-slate-200 bg-slate-50 hover:bg-white'
                  }`}
                >
                  <span className="text-xs font-black text-slate-950">
                    Consultation Recording (Optional)
                  </span>
                  <span
                    className={`rounded-md px-2 py-0.5 text-[10px] font-black uppercase ${
                      isRecording
                        ? 'bg-rose-200 text-rose-950 border border-rose-400'
                        : 'bg-slate-200 text-slate-950 border border-slate-400'
                    }`}
                  >
                    {isRecording ? 'Recording' : 'Off'}
                  </span>
                </button>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
