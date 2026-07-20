'use client';

import { useCallback, useRef, useState } from 'react';
import {
  Camera,
  CameraOff,
  CreditCard,
  FileUp,
  Mic,
  MicOff,
  MessageSquare,
  Send,
  ShieldCheck,
  Video,
} from 'lucide-react';

type PaymentStatus = 'Paid' | 'Pending' | 'Overdue';

type InvoiceRecord = {
  id: string;
  reference: string;
  description: string;
  amount: string;
  dueDate: string;
  status: PaymentStatus;
};

type ChatMessage = {
  id: string;
  sender: 'patient' | 'doctor';
  text: string;
  time: string;
};

const CARD_CLASS =
  'rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm';

const INVOICES: InvoiceRecord[] = [
  {
    id: 'inv-1',
    reference: 'NX-INV-2026-8841',
    description: 'OPD Consultation · General Medicine',
    amount: '₹850',
    dueDate: '10 Jul 2026',
    status: 'Paid',
  },
  {
    id: 'inv-2',
    reference: 'NX-INV-2026-9012',
    description: 'Laboratory Panel · Lipid Profile',
    amount: '₹1,240',
    dueDate: '15 Jul 2026',
    status: 'Overdue',
  },
  {
    id: 'inv-3',
    reference: 'NX-INV-2026-9155',
    description: 'Teleconsult · Cardiology Follow-up',
    amount: '₹600',
    dueDate: '20 Jul 2026',
    status: 'Pending',
  },
];

const STATUS_STYLES: Record<PaymentStatus, string> = {
  Paid: 'border border-[#00A481]/20 bg-[#00A481]/10 text-[#00A481]',
  Pending: 'border border-amber-500/20 bg-amber-500/10 text-amber-800',
  Overdue: 'border border-rose-500/20 bg-rose-500/10 text-rose-700 font-black',
};

const SEED_MESSAGES: ChatMessage[] = [
  {
    id: 'msg-1',
    sender: 'doctor',
    text: 'Good afternoon, Aishwarya. I have reviewed your latest lab report.',
    time: '14:02',
  },
  {
    id: 'msg-2',
    sender: 'patient',
    text: 'Thank you, Doctor. Should I continue the current medication dosage?',
    time: '14:04',
  },
  {
    id: 'msg-3',
    sender: 'doctor',
    text: 'Yes — maintain Metformin 500 mg BID. Upload any new reports if available.',
    time: '14:05',
  },
];

function formatTime(): string {
  return new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

export default function PatientTeleconsultPage() {
  const [chatOpen, setChatOpen] = useState(true);
  const [muted, setMuted] = useState(false);
  const [cameraOn, setCameraOn] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>(SEED_MESSAGES);
  const [draftMessage, setDraftMessage] = useState('');
  const [paymentNotice, setPaymentNotice] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const sendMessage = useCallback(() => {
    const text = draftMessage.trim();
    if (!text) return;
    setMessages((prev) => [
      ...prev,
      { id: `msg-${Date.now()}`, sender: 'patient', text, time: formatTime() },
    ]);
    setDraftMessage('');
    window.setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  }, [draftMessage]);

  const handlePayment = () => {
    setPaymentNotice('Payment gateway sandbox · redirect preview queued');
    window.setTimeout(() => setPaymentNotice(null), 4000);
  };

  return (
    <div className="min-h-full w-full space-y-6 font-sans text-slate-950">
      {/* HUD header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-black text-[#00758C]">
          Virtual Encounter Desk &amp; Financial Workspace
        </h1>
        <div className="inline-flex items-center gap-2 rounded-full border border-[#00A481]/20 bg-[#00A481]/10 px-4 py-2 text-xs font-bold uppercase tracking-wide text-[#00A481]">
          <ShieldCheck className="h-4 w-4" aria-hidden />
          SECURE_PATIENT_ENDPOINT_OK
        </div>
      </header>

      {paymentNotice ? (
        <p className="rounded-xl border border-[#008588]/20 bg-[#008588]/5 px-4 py-2 text-sm font-bold text-[#008588]">
          {paymentNotice}
        </p>
      ) : null}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        {/* Left — Teleconsult station (60%) */}
        <section aria-label="Virtual teleconsult station" className="space-y-4">
          <div className={`${CARD_CLASS} !p-0 overflow-hidden`}>
            <div className="relative flex aspect-video items-center justify-center rounded-2xl border border-slate-800 bg-slate-900">
              <div className="text-center">
                <Video className="mx-auto h-12 w-12 text-[#008588]" aria-hidden />
                <p className="mt-3 text-sm font-bold text-slate-300">
                  {cameraOn ? 'Live session · Dr. Meera Nair connected' : 'Camera paused'}
                </p>
                <p className="mt-1 text-xs font-medium text-slate-500">
                  Encrypted Nexora teleconsult bridge · sandbox mode
                </p>
              </div>

              <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full border border-slate-700 bg-slate-800/90 px-3 py-2">
                <button
                  type="button"
                  onClick={() => setMuted((prev) => !prev)}
                  aria-label={muted ? 'Unmute microphone' : 'Mute microphone'}
                  className={`rounded-lg p-2 transition-colors ${muted ? 'bg-rose-500/20 text-rose-400' : 'text-slate-300 hover:bg-slate-700'}`}
                >
                  {muted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => setCameraOn((prev) => !prev)}
                  aria-label={cameraOn ? 'Turn camera off' : 'Turn camera on'}
                  className={`rounded-lg p-2 transition-colors ${cameraOn ? 'text-slate-300 hover:bg-slate-700' : 'bg-rose-500/20 text-rose-400'}`}
                >
                  {cameraOn ? <Camera className="h-4 w-4" /> : <CameraOff className="h-4 w-4" />}
                </button>
                <button
                  type="button"
                  className="inline-flex items-center gap-1 rounded-lg bg-[#00758C] px-3 py-2 text-xs font-bold text-white hover:bg-[#008588]"
                >
                  <FileUp className="h-4 w-4" aria-hidden />
                  Upload Reports
                </button>
              </div>
            </div>
          </div>

          {/* Live chat */}
          <div className={CARD_CLASS}>
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-[#008588]" aria-hidden />
                <h2 className="text-sm font-black text-[#00758C]">Live Patient-Doctor Chat Channel</h2>
              </div>
              <button
                type="button"
                onClick={() => setChatOpen((prev) => !prev)}
                className="text-xs font-bold text-[#008588] hover:underline"
              >
                {chatOpen ? 'Minimize Chat' : 'Expand Chat'}
              </button>
            </div>

            {chatOpen ? (
              <>
                <div className="custom-scrollbar max-h-56 space-y-3 overflow-y-auto rounded-xl border border-slate-200/80 bg-slate-50/80 p-3">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender === 'patient' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-xl px-3 py-2 text-sm font-medium ${
                          msg.sender === 'patient'
                            ? 'bg-[#00758C] text-white'
                            : 'border border-slate-200/80 bg-white text-slate-800'
                        }`}
                      >
                        <p>{msg.text}</p>
                        <p
                          className={`mt-1 text-[10px] ${msg.sender === 'patient' ? 'text-white/70' : 'text-slate-400'}`}
                        >
                          {msg.time}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>

                <div className="mt-3 flex gap-2">
                  <input
                    type="text"
                    value={draftMessage}
                    onChange={(event) => setDraftMessage(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') sendMessage();
                    }}
                    placeholder="Type a message to the medical station…"
                    aria-label="Chat message input"
                    className="flex-1 rounded-xl border border-slate-200/80 bg-white px-4 py-2.5 text-sm font-medium focus:border-[#008588]/30 focus:outline-none focus:ring-2 focus:ring-[#008588]/20"
                  />
                  <button
                    type="button"
                    onClick={sendMessage}
                    className="rounded-xl bg-[#00758C] px-4 py-2.5 text-white transition-all hover:bg-[#008588]"
                    aria-label="Send message"
                  >
                    <Send className="h-4 w-4" aria-hidden />
                  </button>
                </div>
              </>
            ) : null}
          </div>
        </section>

        {/* Right — Billing ledger (40%) */}
        <aside aria-label="Billing and policy profile" className="space-y-4">
          <div className={CARD_CLASS}>
            <div className="mb-4 flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-[#008588]" aria-hidden />
              <h2 className="text-sm font-black text-[#00758C]">Billing Ledger</h2>
            </div>
            <ul className="space-y-3">
              {INVOICES.map((invoice) => (
                <li
                  key={invoice.id}
                  className={`rounded-xl border p-4 ${
                    invoice.status === 'Overdue'
                      ? 'border-rose-500/30 bg-rose-500/10 ring-1 ring-rose-500/20'
                      : 'border-slate-200/80 bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-mono text-xs font-black text-[#008588]">{invoice.reference}</p>
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${STATUS_STYLES[invoice.status]}`}
                    >
                      {invoice.status}
                    </span>
                  </div>
                  <p className="mt-2 text-sm font-bold text-slate-900">{invoice.description}</p>
                  <div className="mt-2 flex items-baseline justify-between">
                    <p className="text-lg font-black text-slate-950">{invoice.amount}</p>
                    <p className="text-xs font-bold text-slate-500">Due {invoice.dueDate}</p>
                  </div>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={handlePayment}
              className="mt-4 w-full rounded-xl bg-[#00758C] py-3 text-sm font-bold text-white shadow-sm transition-all hover:bg-[#008588]"
            >
              Proceed to Online Payment
            </button>
          </div>

          <div className={CARD_CLASS}>
            <h2 className="mb-4 text-sm font-black uppercase tracking-wider text-[#00758C]">
              Account &amp; Policy Profile
            </h2>
            <dl className="space-y-4 text-sm">
              <div>
                <dt className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                  Personal Details
                </dt>
                <dd className="mt-1 font-bold text-slate-900">
                  Aishwarya D S · ID_NEX_9021 · +91 98XXX XXXXX
                </dd>
              </div>
              <div>
                <dt className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                  Emergency Contacts
                </dt>
                <dd className="mt-1 font-bold text-slate-900">
                  R. Srinivasan (Spouse) · +91 97XXX XXXXX
                </dd>
              </div>
              <div>
                <dt className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                  Insurance Policy Providers
                </dt>
                <dd className="mt-1 font-bold text-slate-900">
                  Nexora Health Shield · Policy #NHS-2026-44102 · 80% OPD coverage
                </dd>
              </div>
            </dl>
          </div>
        </aside>
      </div>
    </div>
  );
}
