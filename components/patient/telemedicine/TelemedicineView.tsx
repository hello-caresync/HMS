'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';
import {
  CalendarClock,
  MessageSquare,
  Mic,
  Paperclip,
  Phone,
  Send,
  Video,
  VideoOff,
} from 'lucide-react';
import { toast } from 'sonner';

import { PATIENT_ROUTES } from '@/lib/patient/navigation';
import { patientClasses } from '@/lib/patient/theme';
import { patientUi } from '@/lib/patient/ui-tokens';

type TelemedicineTab = 'visits' | 'messages';

type UpcomingVisit = {
  id: string;
  doctor: string;
  specialty: string;
  when: string;
  room: string;
  status: 'ready' | 'scheduled' | 'waiting';
};

type MessageThread = {
  id: string;
  from: string;
  role: string;
  preview: string;
  time: string;
  unread: boolean;
};

const UPCOMING: UpcomingVisit[] = [
  {
    id: 'v1',
    doctor: 'Dr. Meera Nair',
    specialty: 'Cardiology follow-up',
    when: '18 Jul 2026 · 10:30 AM',
    room: 'NX-VC-2048',
    status: 'ready',
  },
  {
    id: 'v2',
    doctor: 'Dr. Arjun Patel',
    specialty: 'Dermatology · mole review',
    when: '24 Jul 2026 · 4:00 PM',
    room: 'NX-VC-2102',
    status: 'scheduled',
  },
];

const THREADS: MessageThread[] = [
  {
    id: 't1',
    from: 'Sister Anjali',
    role: 'Care nurse',
    preview: 'Please log fasting glucose before tomorrow’s tele visit.',
    time: '2h ago',
    unread: true,
  },
  {
    id: 't2',
    from: 'Dr. Meera Nair',
    role: 'Cardiology',
    preview: 'Your latest HbA1c trend looks stable — see you on video Thursday.',
    time: 'Yesterday',
    unread: false,
  },
  {
    id: 't3',
    from: 'Nexora Pharmacy',
    role: 'Pharmacy',
    preview: 'Metformin refill is ready for pickup after 4 PM.',
    time: '3 days ago',
    unread: false,
  },
];

function visitStatusLabel(status: UpcomingVisit['status']) {
  if (status === 'ready') return 'Waiting room open';
  if (status === 'waiting') return 'Clinician joining';
  return 'Scheduled';
}

function visitStatusClass(status: UpcomingVisit['status']) {
  if (status === 'ready') return 'border-patient-success/40 bg-patient-success/15 text-patient-plum';
  if (status === 'waiting') return 'border-patient-warning/35 bg-patient-warning/15 text-patient-text';
  return 'border-patient-primary/30 bg-patient-primary/10 text-patient-primary';
}

export function TelemedicineView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') === 'messages' ? 'messages' : 'visits';
  const [tab, setTab] = useState<TelemedicineTab>(initialTab);
  const [draft, setDraft] = useState('');
  const [activeThread, setActiveThread] = useState(THREADS[0]!.id);

  const unreadCount = useMemo(() => THREADS.filter((t) => t.unread).length, []);

  const setTabAndUrl = useCallback(
    (next: TelemedicineTab) => {
      setTab(next);
      const query = next === 'messages' ? '?tab=messages' : '';
      router.replace(`${PATIENT_ROUTES.telemedicine}${query}`, { scroll: false });
    },
    [router],
  );

  const joinVisit = (visit: UpcomingVisit) => {
    toast.success(`Connecting to secure room ${visit.room}…`);
  };

  const sendMessage = () => {
    if (!draft.trim()) return;
    toast.success('Message sent via encrypted portal thread');
    setDraft('');
  };

  const selectedThread = THREADS.find((t) => t.id === activeThread) ?? THREADS[0]!;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className={patientUi.pageTitle}>Telemedicine &amp; Messages</h1>
          <p className={`mt-1 ${patientUi.bodyMuted}`}>
            Video visits, virtual waiting room, and HIPAA-secure chat with your care team
          </p>
        </div>
        {unreadCount > 0 ? (
          <span className={patientUi.badgeAlert}>{unreadCount} unread messages</span>
        ) : (
          <span className={patientUi.badgeAccent}>End-to-end encrypted</span>
        )}
      </header>

      <div
        className="flex flex-wrap gap-2 border-b border-patient-lavender/30 pb-3"
        role="tablist"
        aria-label="Telemedicine sections"
      >
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'visits'}
          onClick={() => setTabAndUrl('visits')}
          className={`inline-flex items-center gap-2 ${tab === 'visits' ? patientUi.chipActive : patientUi.chipIdle}`}
        >
          <Video className="h-3.5 w-3.5" aria-hidden />
          Video visits
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'messages'}
          onClick={() => setTabAndUrl('messages')}
          className={`inline-flex items-center gap-2 ${tab === 'messages' ? patientUi.chipActive : patientUi.chipIdle}`}
        >
          <MessageSquare className="h-3.5 w-3.5" aria-hidden />
          Messages
          {unreadCount > 0 ? (
            <span className="ml-1 rounded-full bg-white/20 px-1.5 text-[10px] font-black">{unreadCount}</span>
          ) : null}
        </button>
      </div>

      {tab === 'visits' ? (
        <div className="space-y-6" role="tabpanel" aria-label="Video visits">
          <section className={patientUi.panel} aria-label="Join upcoming visit">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <CalendarClock className={`h-5 w-5 ${patientUi.icon}`} aria-hidden />
                <h2 className={patientUi.sectionTitle}>Upcoming video visits</h2>
              </div>
              <Link href={PATIENT_ROUTES.appointments} className={patientUi.link}>
                Manage appointments
              </Link>
            </div>
            <ul className="mt-4 space-y-3">
              {UPCOMING.map((visit) => (
                <li key={visit.id} className={patientUi.card}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-black text-patient-text">{visit.doctor}</p>
                      <p className={`mt-0.5 ${patientUi.bodyMuted}`}>{visit.specialty}</p>
                      <p className="mt-2 text-xs font-bold text-patient-text/80">{visit.when}</p>
                      <p className="mt-1 font-mono text-[10px] font-bold text-patient-primary">
                        Room {visit.room}
                      </p>
                    </div>
                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-bold uppercase ${visitStatusClass(visit.status)}`}
                    >
                      {visitStatusLabel(visit.status)}
                    </span>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      className={patientClasses.btnPrimary}
                      onClick={() => joinVisit(visit)}
                      disabled={visit.status === 'scheduled'}
                    >
                      <Video className="mr-2 inline h-4 w-4" aria-hidden />
                      {visit.status === 'ready' ? 'Join waiting room' : 'Join when open'}
                    </button>
                    <button
                      type="button"
                      className={patientClasses.btnSecondary}
                      onClick={() => toast.message('Device check — camera & mic permissions')}
                    >
                      Test camera &amp; mic
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className={patientUi.panelMauve} aria-label="Visit tips">
            <h2 className={`${patientUi.sectionTitle} text-patient-text`}>Before you connect</h2>
            <ul className={`mt-3 list-inside list-disc space-y-1 text-sm ${patientUi.bodyMuted}`}>
              <li>Use Wi‑Fi or strong LTE; close other video apps for best quality.</li>
              <li>Have your medication list and recent vitals ready to share.</li>
              <li>Caregivers may join with your one-time guest link from the visit card.</li>
            </ul>
          </section>
        </div>
      ) : (
        <div
          className="grid gap-6 lg:grid-cols-[minmax(0,280px)_minmax(0,1fr)]"
          role="tabpanel"
          aria-label="Secure messages"
        >
          <aside className={`${patientUi.panel} lg:max-h-[520px] lg:overflow-y-auto`}>
            <h2 className={`mb-3 ${patientUi.sectionLabel}`}>Threads</h2>
            <ul className="space-y-2">
              {THREADS.map((thread) => (
                <li key={thread.id}>
                  <button
                    type="button"
                    onClick={() => setActiveThread(thread.id)}
                    className={`w-full rounded-xl border px-3 py-3 text-left transition ${
                      activeThread === thread.id
                        ? 'border-patient-primary bg-patient-primary/10'
                        : 'border-patient-lavender/30 bg-white hover:border-patient-lavender'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-black text-patient-text">{thread.from}</p>
                      {thread.unread ? (
                        <span className="h-2 w-2 shrink-0 rounded-full bg-patient-primary" aria-hidden />
                      ) : null}
                    </div>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-patient-text/50">
                      {thread.role}
                    </p>
                    <p className="mt-1 line-clamp-2 text-xs font-medium text-patient-text/70">{thread.preview}</p>
                    <p className="mt-1 text-[10px] font-bold text-patient-text/40">{thread.time}</p>
                  </button>
                </li>
              ))}
            </ul>
          </aside>

          <section className={patientUi.panel} aria-label="Message conversation">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-patient-lavender/30 pb-4">
              <div>
                <p className="text-sm font-black text-patient-text">{selectedThread.from}</p>
                <p className={`text-xs ${patientUi.bodyMuted}`}>{selectedThread.role}</p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  className={patientClasses.btnSecondary}
                  onClick={() => toast.message('Voice call — connect when clinician is online')}
                >
                  <Phone className="h-4 w-4" aria-hidden />
                </button>
                <button
                  type="button"
                  className={patientClasses.btnSecondary}
                  onClick={() => setTabAndUrl('visits')}
                >
                  <Video className="h-4 w-4" aria-hidden />
                </button>
              </div>
            </div>

            <div className="mt-4 min-h-[220px] rounded-xl border border-patient-lavender/30 bg-patient-lavender/40 p-4">
              <p className="text-sm font-medium text-patient-text">{selectedThread.preview}</p>
              <p className="mt-2 text-[10px] font-bold uppercase tracking-wide text-patient-text/45">
                {selectedThread.time} · read receipt enabled
              </p>
            </div>

            <div className="mt-4 flex flex-wrap items-end gap-2">
              <button
                type="button"
                className="rounded-xl border border-patient-lavender/30 bg-white p-2.5 text-patient-primary hover:bg-patient-lavender/25"
                aria-label="Attach file"
                onClick={() => toast.message('Attachments — PDF and imaging up to 25 MB')}
              >
                <Paperclip className="h-4 w-4" aria-hidden />
              </button>
              <button
                type="button"
                className="rounded-xl border border-patient-lavender/30 bg-white p-2.5 text-patient-primary hover:bg-patient-lavender/25"
                aria-label="Voice note"
                onClick={() => toast.message('Hold to record — coming soon')}
              >
                <Mic className="h-4 w-4" aria-hidden />
              </button>
              <label className="sr-only" htmlFor="telemedicine-reply">
                Reply to care team
              </label>
              <input
                id="telemedicine-reply"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Write a secure message…"
                className={`min-w-[200px] flex-1 ${patientUi.input}`}
              />
              <button type="button" className={patientClasses.btnPrimary} onClick={sendMessage}>
                <Send className="mr-2 inline h-4 w-4" aria-hidden />
                Send
              </button>
            </div>

            <p className={`mt-4 flex items-center gap-1.5 text-xs ${patientUi.bodyMuted}`}>
              <VideoOff className="h-3.5 w-3.5" aria-hidden />
              Not for emergencies — use SOS for crisis response.
            </p>
          </section>
        </div>
      )}
    </div>
  );
}
