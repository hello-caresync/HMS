'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import {
  Bell,
  Camera,
  CameraOff,
  FileClock,
  FileText,
  FileUp,
  History,
  MessageSquare,
  Mic,
  MicOff,
  Phone,
  Send,
  ShieldCheck,
  Upload,
  Video,
  VideoOff,
} from 'lucide-react';

type StreamMode = 'Video Consultation Mode' | 'Audio Call Mode' | 'Idle Connection';

type ChatChannel = 'doctor' | 'hospital';

type ChatMessage = {
  id: string;
  channel: ChatChannel;
  sender: 'patient' | 'doctor' | 'hospital';
  text: string;
  time: string;
  urgent?: boolean;
};

type DocumentUpload = {
  id: string;
  fileName: string;
  uploadedAt: string;
  category: string;
  tags: string[];
  size: string;
};

type NotificationCategory = 'Appointment' | 'Lab' | 'Medicine';

type NotificationEntry = {
  id: string;
  category: NotificationCategory;
  title: string;
  body: string;
  timestamp: string;
  read: boolean;
};

type ConsultationRecord = {
  id: string;
  doctor: string;
  specialty: string;
  date: string;
  duration: string;
  mode: 'Video' | 'Audio';
  followUp: string;
};

const MINT_CHIP =
  'bg-[#fde8eb] text-[#f47c8c] border border-[#f0d8dc] font-bold px-3 py-1 rounded-full text-[11px] tracking-wide';

const PANEL_CLASS = 'rounded-2xl border border-[#f0d8dc] bg-white p-6 shadow-sm';

const DOCTOR_MESSAGES: ChatMessage[] = [
  {
    id: 'doc-1',
    channel: 'doctor',
    sender: 'doctor',
    text: 'Good afternoon, Aishwarya. I have reviewed your latest HbA1c report — trending within target range.',
    time: '14:02',
  },
  {
    id: 'doc-2',
    channel: 'doctor',
    sender: 'patient',
    text: 'Thank you, Doctor. Should I continue Metformin 500 mg twice daily?',
    time: '14:04',
  },
  {
    id: 'doc-3',
    channel: 'doctor',
    sender: 'doctor',
    text: 'Yes — maintain current dosage. Upload any new lab slips before our next virtual follow-up.',
    time: '14:05',
  },
];

const HOSPITAL_MESSAGES: ChatMessage[] = [
  {
    id: 'hos-1',
    channel: 'hospital',
    sender: 'hospital',
    text: 'URGENT: Your lipid panel results require physician review within 48 hours. Please schedule a callback.',
    time: '11:18',
    urgent: true,
  },
  {
    id: 'hos-2',
    channel: 'hospital',
    sender: 'hospital',
    text: 'Appointment rescheduled — Cardiology teleconsult moved to 16 Jul 2026 · 10:30 AM IST.',
    time: '09:42',
    urgent: false,
  },
  {
    id: 'hos-3',
    channel: 'hospital',
    sender: 'patient',
    text: 'Acknowledged. I will join the rescheduled session from the patient portal.',
    time: '09:45',
  },
];

const DOCUMENT_LEDGER: DocumentUpload[] = [
  {
    id: 'doc-up-1',
    fileName: 'HbA1c_Report_Jul2026.pdf',
    uploadedAt: '12 Jul 2026 · 09:14',
    category: 'Lab Result',
    tags: ['Endocrinology', 'Verified'],
    size: '842 KB',
  },
  {
    id: 'doc-up-2',
    fileName: 'Chest_XRay_Digital_Jun2026.dcm',
    uploadedAt: '02 Jul 2026 · 16:40',
    category: 'Radiology Scan',
    tags: ['Radiology', 'DICOM'],
    size: '4.2 MB',
  },
  {
    id: 'doc-up-3',
    fileName: 'Medication_Chart_Q3_2026.pdf',
    uploadedAt: '28 Jun 2026 · 11:02',
    category: 'Clinical Chart',
    tags: ['Pharmacy', 'Active Rx'],
    size: '312 KB',
  },
];

const NOTIFICATIONS: NotificationEntry[] = [
  {
    id: 'ntf-1',
    category: 'Appointment',
    title: 'Teleconsult Reminder',
    body: 'Cardiology follow-up · Dr. Rajesh Kumar · 16 Jul 2026 · 10:30 AM',
    timestamp: '14 Jul 2026 · 08:00',
    read: false,
  },
  {
    id: 'ntf-2',
    category: 'Lab',
    title: 'Lab Results Available',
    body: 'Lipid Profile · CBC · Chemistry Panel — results published to secure vault',
    timestamp: '13 Jul 2026 · 17:22',
    read: false,
  },
  {
    id: 'ntf-3',
    category: 'Medicine',
    title: 'Medication Reminder',
    body: 'Metformin 500 mg · evening dose due in 30 minutes',
    timestamp: '14 Jul 2026 · 19:30',
    read: true,
  },
  {
    id: 'ntf-4',
    category: 'Appointment',
    title: 'Queue Position Update',
    body: 'General Medicine OPD · you are now #3 in live queue',
    timestamp: '14 Jul 2026 · 10:15',
    read: true,
  },
  {
    id: 'ntf-5',
    category: 'Medicine',
    title: 'Refill Window Open',
    body: 'Amlodipine 5 mg · 7-day refill window activated',
    timestamp: '12 Jul 2026 · 09:00',
    read: true,
  },
];

const CONSULTATION_HISTORY: ConsultationRecord[] = [
  {
    id: 'enc-1',
    doctor: 'Dr. Meera Nair',
    specialty: 'General Medicine',
    date: '05 Jul 2026 · 15:00',
    duration: '22 min',
    mode: 'Video',
    followUp: 'Continue Metformin BID · repeat HbA1c in 90 days',
  },
  {
    id: 'enc-2',
    doctor: 'Dr. Rajesh Kumar',
    specialty: 'Cardiology',
    date: '18 Jun 2026 · 11:30',
    duration: '18 min',
    mode: 'Audio',
    followUp: 'ECG review scheduled · reduce sodium intake',
  },
  {
    id: 'enc-3',
    doctor: 'Dr. Priya Anand',
    specialty: 'Endocrinology',
    date: '02 Jun 2026 · 09:45',
    duration: '25 min',
    mode: 'Video',
    followUp: 'HbA1c target achieved · maintain lifestyle protocol',
  },
];

const CATEGORY_CHIP: Record<NotificationCategory, string> = {
  Appointment: 'border border-[#f0d8dc] bg-[#fde8eb] text-[#f47c8c]',
  Lab: MINT_CHIP,
  Medicine: 'border border-[#f47c8c]/30 bg-[#fde8eb] text-[#8c2b39]',
};

function formatTime(): string {
  return new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

export default function PatientCommunicationPage() {
  const [streamMode, setStreamMode] = useState<StreamMode>('Video Consultation Mode');
  const [muted, setMuted] = useState(false);
  const [cameraOn, setCameraOn] = useState(true);
  const [activeChannel, setActiveChannel] = useState<ChatChannel>('doctor');
  const [doctorMessages, setDoctorMessages] = useState<ChatMessage[]>(DOCTOR_MESSAGES);
  const [hospitalMessages, setHospitalMessages] = useState<ChatMessage[]>(HOSPITAL_MESSAGES);
  const [documents, setDocuments] = useState<DocumentUpload[]>(DOCUMENT_LEDGER);
  const [notifications, setNotifications] = useState<NotificationEntry[]>(NOTIFICATIONS);
  const [draftMessage, setDraftMessage] = useState('');
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeMessages = activeChannel === 'doctor' ? doctorMessages : hospitalMessages;
  const unreadCount = useMemo(
    () => notifications.filter((entry) => !entry.read).length,
    [notifications],
  );

  const streamStatusLabel = useMemo(() => {
    if (streamMode === 'Idle Connection') return 'Awaiting clinician join · encrypted bridge standby';
    if (streamMode === 'Audio Call Mode') return 'Audio-only session · Dr. Meera Nair connected';
    return cameraOn ? 'Live video · Dr. Meera Nair connected' : 'Camera paused · audio active';
  }, [streamMode, cameraOn]);

  const showNotice = useCallback((message: string) => {
    setActionNotice(message);
    window.setTimeout(() => setActionNotice(null), 4000);
  }, []);

  const sendMessage = useCallback(() => {
    const text = draftMessage.trim();
    if (!text) return;

    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      channel: activeChannel,
      sender: 'patient',
      text,
      time: formatTime(),
    };

    if (activeChannel === 'doctor') {
      setDoctorMessages((prev) => [...prev, newMessage]);
    } else {
      setHospitalMessages((prev) => [...prev, newMessage]);
    }

    setDraftMessage('');
    window.setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  }, [activeChannel, draftMessage]);

  const handleDocumentUpload = useCallback(() => {
    const stamp = new Date().toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    setDocuments((prev) => [
      {
        id: `doc-up-${Date.now()}`,
        fileName: `Clinical_Upload_${Date.now()}.pdf`,
        uploadedAt: stamp,
        category: 'Patient Upload',
        tags: ['Pending Review', 'Encrypted'],
        size: '1.1 MB',
      },
      ...prev,
    ]);
    showNotice('Document uploaded · encrypted vault · pending clinical review');
  }, [showNotice]);

  const handleRequestSummary = useCallback((record: ConsultationRecord) => {
    showNotice(`Session record summary requested · ${record.doctor} · ${record.date}`);
  }, [showNotice]);

  const markNotificationRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((entry) => (entry.id === id ? { ...entry, read: true } : entry)),
    );
  }, []);

  const cycleStreamMode = useCallback(() => {
    setStreamMode((prev) => {
      if (prev === 'Idle Connection') return 'Video Consultation Mode';
      if (prev === 'Video Consultation Mode') return 'Audio Call Mode';
      return 'Idle Connection';
    });
  }, []);

  return (
    <div className="min-h-screen w-full space-y-6 bg-[#faf6f7] p-6 font-sans text-slate-950">
      {/* Central HUD control header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#8c2b39]">
            Care Telehealth Center &amp; Communication Hub
          </h1>
          <p className="mt-1 text-sm font-medium text-slate-600">
            End-to-end AES-256 encryption · TLS 1.3 clinical bridge · remote connectivity{' '}
            <span className="font-bold text-[#f47c8c]">{streamMode}</span> · 14 Jul 2026
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-[#f0d8dc] bg-[#fde8eb] px-4 py-2 text-xs font-bold uppercase tracking-wide text-[#f47c8c]">
          <ShieldCheck className="h-4 w-4" aria-hidden />
          E2E_ENCRYPTED_CHANNEL_OK
        </div>
      </header>

      {actionNotice ? (
        <p className="rounded-xl border border-[#f0d8dc] bg-[#fde8eb] px-4 py-2 text-sm font-bold text-[#f47c8c]">
          {actionNotice}
        </p>
      ) : null}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,65fr)_minmax(0,35fr)]">
        {/* Left column — live encounter & chat (65%) */}
        <div className="space-y-6">
          {/* Virtual consultation viewport */}
          <section aria-label="Virtual consultation viewport" className={`${PANEL_CLASS} !p-0 overflow-hidden`}>
            <div className="relative flex aspect-video flex-col items-center justify-center rounded-2xl border border-slate-800 bg-slate-900 p-4 shadow-md">
              <div className="text-center">
                {streamMode === 'Video Consultation Mode' && cameraOn ? (
                  <Video className="mx-auto h-12 w-12 text-[#f47c8c]" aria-hidden />
                ) : streamMode === 'Audio Call Mode' ? (
                  <Phone className="mx-auto h-12 w-12 text-[#8c2b39]" aria-hidden />
                ) : (
                  <VideoOff className="mx-auto h-12 w-12 text-slate-500" aria-hidden />
                )}
                <p className="mt-3 text-sm font-bold text-slate-300">{streamStatusLabel}</p>
                <span className={`mt-2 inline-flex uppercase ${MINT_CHIP}`}>{streamMode}</span>
              </div>

              <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 flex-wrap items-center justify-center gap-2 rounded-full border border-slate-700 bg-slate-800/90 px-3 py-2">
                <button
                  type="button"
                  onClick={() => setMuted((prev) => !prev)}
                  aria-label={muted ? 'Unmute microphone' : 'Mute microphone'}
                  className={`rounded-lg p-2 transition-colors ${
                    muted ? 'bg-rose-500/20 text-rose-400' : 'text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {muted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => setCameraOn((prev) => !prev)}
                  aria-label={cameraOn ? 'Turn camera off' : 'Turn camera on'}
                  disabled={streamMode === 'Audio Call Mode' || streamMode === 'Idle Connection'}
                  className={`rounded-lg p-2 transition-colors disabled:opacity-40 ${
                    cameraOn ? 'text-slate-300 hover:bg-slate-700' : 'bg-rose-500/20 text-rose-400'
                  }`}
                >
                  {cameraOn ? <Camera className="h-4 w-4" /> : <CameraOff className="h-4 w-4" />}
                </button>
                <button
                  type="button"
                  onClick={cycleStreamMode}
                  className="rounded-lg px-3 py-2 text-xs font-bold text-[#8c2b39] hover:bg-slate-700"
                >
                  Switch Mode
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1 rounded-lg bg-[#f47c8c] px-3 py-2 text-xs font-bold text-white hover:bg-[#e06373]"
                >
                  <FileUp className="h-4 w-4" aria-hidden />
                  Upload Documents
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept=".pdf,.jpg,.jpeg,.png,.dcm"
                  onChange={handleDocumentUpload}
                />
              </div>
            </div>
          </section>

          {/* Secure chat channels */}
          <section aria-label="Secure chat channels" className={PANEL_CLASS}>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-[#f47c8c]" aria-hidden />
                <h2 className="text-lg font-black text-[#8c2b39]">Secure Chat Channels</h2>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setActiveChannel('doctor')}
                  className={`rounded-full px-3 py-1 text-xs font-bold transition-all ${
                    activeChannel === 'doctor'
                      ? 'bg-[#f47c8c] text-white'
                      : 'border border-[#f0d8dc] bg-white text-slate-600 hover:border-[#f0d8dc]'
                  }`}
                >
                  Doctor Messages
                </button>
                <button
                  type="button"
                  onClick={() => setActiveChannel('hospital')}
                  className={`rounded-full px-3 py-1 text-xs font-bold transition-all ${
                    activeChannel === 'hospital'
                      ? 'bg-[#e63946] text-white'
                      : 'border border-[#f0d8dc] bg-white text-slate-600 hover:border-rose-300'
                  }`}
                >
                  Hospital Alerts
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {/* Doctor thread preview */}
              <div
                className={`rounded-xl border p-3 ${
                  activeChannel === 'doctor'
                    ? 'border-[#f0d8dc] bg-[#fde8eb] ring-1 ring-[#f47c8c]/20'
                    : 'border-[#f0d8dc] bg-slate-50/50'
                }`}
              >
                <p className="mb-2 text-[10px] font-black uppercase tracking-wider text-[#f47c8c]">
                  Doctor Channel
                </p>
                <div className="max-h-40 space-y-2 overflow-y-auto">
                  {doctorMessages.slice(-3).map((msg) => (
                    <div
                      key={msg.id}
                      className={`rounded-xl px-3 py-2 text-xs font-medium ${
                        msg.sender === 'doctor'
                          ? 'border border-[#f0d8dc] bg-[#fde8eb] text-[#8c2b39]'
                          : 'ml-4 bg-[#f47c8c] text-white'
                      }`}
                    >
                      <p>{msg.text}</p>
                      <p className="mt-1 text-[10px] opacity-70">{msg.time}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Hospital thread preview */}
              <div
                className={`rounded-xl border p-3 ${
                  activeChannel === 'hospital'
                    ? 'border-rose-400/40 bg-rose-500/5 ring-1 ring-rose-400/20'
                    : 'border-[#f0d8dc] bg-slate-50/50'
                }`}
              >
                <p className="mb-2 text-[10px] font-black uppercase tracking-wider text-rose-700">
                  Hospital Messages
                </p>
                <div className="max-h-40 space-y-2 overflow-y-auto">
                  {hospitalMessages.slice(-3).map((msg) => (
                    <div
                      key={msg.id}
                      className={`rounded-xl px-3 py-2 text-xs font-bold ${
                        msg.urgent
                          ? 'border border-rose-500/40 bg-rose-500/15 text-rose-800'
                          : msg.sender === 'hospital'
                            ? 'border border-amber-500/30 bg-amber-500/10 text-amber-900'
                            : 'ml-4 bg-slate-700 text-white'
                      }`}
                    >
                      <p>{msg.text}</p>
                      <p className="mt-1 text-[10px] font-medium opacity-70">{msg.time}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Active chat composer */}
            <div className="mt-4 max-h-56 space-y-3 overflow-y-auto rounded-xl border border-[#f0d8dc] bg-slate-50/80 p-3">
              {activeMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender === 'patient' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-xl px-3 py-2 text-sm font-medium ${
                      msg.sender === 'patient'
                        ? 'bg-[#f47c8c] text-white'
                        : msg.sender === 'doctor'
                          ? 'border border-[#f0d8dc] bg-[#fde8eb] text-[#8c2b39]'
                          : msg.urgent
                            ? 'border border-rose-500/40 bg-rose-500/15 font-bold text-rose-800'
                            : 'border border-amber-500/30 bg-amber-500/10 text-amber-900'
                    }`}
                  >
                    <p>{msg.text}</p>
                    <p
                      className={`mt-1 text-[10px] ${
                        msg.sender === 'patient' ? 'text-white/70' : 'opacity-60'
                      }`}
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
                placeholder={
                  activeChannel === 'doctor'
                    ? 'Message your care physician…'
                    : 'Reply to hospital administrative desk…'
                }
                aria-label="Chat message input"
                className="flex-1 rounded-xl border border-[#f0d8dc] bg-white px-4 py-2.5 text-sm font-medium focus:border-[#f0d8dc] focus:outline-none focus:ring-2 focus:ring-[#f47c8c]/20"
              />
              <button
                type="button"
                onClick={sendMessage}
                className="rounded-xl bg-[#f47c8c] px-4 py-2.5 text-white transition-all hover:bg-[#e06373]"
                aria-label="Send message"
              >
                <Send className="h-4 w-4" aria-hidden />
              </button>
            </div>
          </section>

          {/* Document upload ledger */}
          <section aria-label="Document upload ledger" className={PANEL_CLASS}>
            <div className="mb-4 flex items-center gap-2">
              <Upload className="h-5 w-5 text-[#f47c8c]" aria-hidden />
              <h2 className="text-lg font-black text-[#8c2b39]">Document Upload Ledger</h2>
            </div>
            <ul className="space-y-3">
              {documents.map((doc) => (
                <li
                  key={doc.id}
                  className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-[#f0d8dc] bg-slate-50/50 p-4"
                >
                  <div>
                    <p className="flex items-center gap-2 text-sm font-bold text-slate-900">
                      <FileText className="h-4 w-4 text-[#f47c8c]" aria-hidden />
                      {doc.fileName}
                    </p>
                    <p className="mt-1 text-xs font-medium text-slate-600">
                      {doc.category} · {doc.size} · {doc.uploadedAt}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {doc.tags.map((tag) => (
                        <span key={tag} className={`inline-flex uppercase ${MINT_CHIP}`}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* Right column — notifications & history (35%) */}
        <aside className="space-y-6">
          <section aria-label="Real-time notifications" className={PANEL_CLASS}>
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-[#f47c8c]" aria-hidden />
                <h2 className="text-base font-black text-[#8c2b39]">Notification Engine</h2>
              </div>
              {unreadCount > 0 ? (
                <span className={`inline-flex uppercase ${MINT_CHIP}`}>{unreadCount} unread</span>
              ) : null}
            </div>
            <ul className="space-y-3">
              {notifications.map((entry) => (
                <li
                  key={entry.id}
                  className={`rounded-xl border p-4 transition-all ${
                    entry.read
                      ? 'border-[#f0d8dc] bg-white opacity-80'
                      : 'border-[#f47c8c]/30 bg-[#fde8eb] ring-1 ring-[#f47c8c]/10'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span
                      className={`inline-flex uppercase ${CATEGORY_CHIP[entry.category]}`}
                    >
                      {entry.category}
                    </span>
                    {!entry.read ? (
                      <button
                        type="button"
                        onClick={() => markNotificationRead(entry.id)}
                        className="text-[10px] font-bold text-[#f47c8c] hover:underline"
                      >
                        Mark read
                      </button>
                    ) : null}
                  </div>
                  <p className="mt-2 text-sm font-bold text-slate-900">{entry.title}</p>
                  <p className="mt-1 text-xs font-medium text-slate-600">{entry.body}</p>
                  <p className="mt-2 text-[10px] font-bold text-slate-500">{entry.timestamp}</p>
                </li>
              ))}
            </ul>
          </section>

          <section aria-label="Consultation history" className={PANEL_CLASS}>
            <div className="mb-4 flex items-center gap-2">
              <History className="h-5 w-5 text-[#f47c8c]" aria-hidden />
              <h2 className="text-base font-black text-[#8c2b39]">Historical Encounters Log</h2>
            </div>
            <ul className="space-y-4">
              {CONSULTATION_HISTORY.map((record) => (
                <li
                  key={record.id}
                  className="rounded-xl border border-[#f0d8dc] bg-slate-50/50 p-4"
                >
                  <p className="text-sm font-black text-[#8c2b39]">{record.doctor}</p>
                  <p className="text-xs font-bold text-[#f47c8c]">
                    {record.specialty} · {record.mode} · {record.duration}
                  </p>
                  <p className="mt-1 text-xs font-medium text-slate-600">{record.date}</p>
                  <p className="mt-2 text-xs font-medium text-slate-700">
                    Follow-up: {record.followUp}
                  </p>
                  <button
                    type="button"
                    onClick={() => handleRequestSummary(record)}
                    className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-[#f47c8c] hover:underline"
                  >
                    <FileClock className="h-3.5 w-3.5" aria-hidden />
                    Request Session Record Summary
                  </button>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}
