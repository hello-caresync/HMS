'use client';

import { useMemo, useState } from 'react';
import {
  Bell,
  CalendarClock,
  FlaskConical,
  Pill,
  Settings2,
} from 'lucide-react';
import { toast } from 'sonner';

import { PATIENT_ROUTES } from '@/lib/patient/navigation';
import Link from 'next/link';
import { patientClasses } from '@/lib/patient/theme';
import { patientUi } from '@/lib/patient/ui-tokens';

type NotificationCategory = 'all' | 'appointments' | 'results' | 'medications';

type PatientNotification = {
  id: string;
  category: Exclude<NotificationCategory, 'all'>;
  title: string;
  body: string;
  time: string;
  read: boolean;
  href?: string;
};

const INITIAL: PatientNotification[] = [
  {
    id: 'n1',
    category: 'results',
    title: 'HbA1c panel ready',
    body: 'Your 08 Jul pathology results are verified and available in Diagnostics.',
    time: '2h ago',
    read: false,
    href: PATIENT_ROUTES.diagnostics,
  },
  {
    id: 'n2',
    category: 'appointments',
    title: 'Follow-up reminder',
    body: 'Cardiology review with Dr. Meera Nair · 18 Jul 2026 · 10:30 AM · Teleconsult room B.',
    time: '5h ago',
    read: false,
    href: PATIENT_ROUTES.appointments,
  },
  {
    id: 'n3',
    category: 'medications',
    title: 'Care team reminder',
    body: 'Sister Anjali: Please log fasting glucose before tomorrow’s visit.',
    time: 'Yesterday',
    read: true,
    href: PATIENT_ROUTES.health,
  },
  {
    id: 'n4',
    category: 'medications',
    title: 'Refill approved',
    body: 'Metformin 500mg · pharmacy routing to Nexora In-house · pick-up after 4 PM.',
    time: 'Yesterday',
    read: true,
    href: PATIENT_ROUTES.medications,
  },
  {
    id: 'n5',
    category: 'appointments',
    title: 'Check-in window open',
    body: 'OPD visit 16 Jul — complete digital check-in up to 2 hours before arrival.',
    time: '3 days ago',
    read: true,
    href: PATIENT_ROUTES.appointments,
  },
];

const FILTERS: { key: NotificationCategory; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'appointments', label: 'Appointments' },
  { key: 'results', label: 'Results' },
  { key: 'medications', label: 'Meds' },
];

const CATEGORY_ICON = {
  appointments: CalendarClock,
  results: FlaskConical,
  medications: Pill,
} as const;

export function NotificationsView() {
  const [filter, setFilter] = useState<NotificationCategory>('all');
  const [items, setItems] = useState(INITIAL);

  const visible = useMemo(() => {
    if (filter === 'all') return items;
    return items.filter((n) => n.category === filter);
  }, [filter, items]);

  const unreadCount = useMemo(() => items.filter((n) => !n.read).length, [items]);

  const markAllRead = () => {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    toast.success('All notifications marked as read');
  };

  const toggleRead = (id: string) => {
    setItems((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: !n.read } : n)),
    );
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className={patientUi.pageTitle}>Notifications</h1>
          <p className={`mt-1 ${patientUi.bodyMuted}`}>
            Appointment reminders, verified results, and medication alerts · push &amp; SMS synced
          </p>
        </div>
        {unreadCount > 0 ? (
          <span className={patientUi.badgeAlert}>{unreadCount} unread</span>
        ) : (
          <span className={patientUi.badgeAccent}>All caught up</span>
        )}
      </header>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter notifications">
          {FILTERS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={filter === key}
              onClick={() => setFilter(key)}
              className={filter === key ? patientUi.chipActive : patientUi.chipIdle}
            >
              {label}
            </button>
          ))}
        </div>
        <button type="button" className={patientUi.link} onClick={markAllRead}>
          Mark all read
        </button>
      </div>

      <ul className="space-y-3">
        {visible.map((note) => {
          const Icon = CATEGORY_ICON[note.category];
          return (
            <li
              key={note.id}
              className={`${patientUi.panel} ${note.read ? 'opacity-90' : 'ring-1 ring-patient-primary/20'}`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`rounded-xl border border-patient-lavender/30 p-2.5 ${
                    note.read ? 'bg-patient-lavender/40' : 'bg-white'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${patientUi.icon}`} aria-hidden />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {note.href ? (
                      <Link href={note.href} className="text-sm font-black text-patient-text hover:underline">
                        {note.title}
                      </Link>
                    ) : (
                      <p className="text-sm font-black text-patient-text">{note.title}</p>
                    )}
                    {!note.read ? (
                      <span className="h-2 w-2 rounded-full bg-patient-primary" aria-label="Unread" />
                    ) : null}
                  </div>
                  <p className={`mt-1 ${patientUi.bodyMuted}`}>{note.body}</p>
                  <p className="mt-2 text-[10px] font-bold uppercase tracking-wide text-patient-text/50">
                    {note.time}
                  </p>
                  <button
                    type="button"
                    className="mt-3 text-xs font-bold text-patient-primary hover:underline"
                    onClick={() => toggleRead(note.id)}
                  >
                    {note.read ? 'Mark unread' : 'Mark read'}
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {visible.length === 0 ? (
        <div className={`${patientUi.panelMauve} text-center`}>
          <Bell className={`mx-auto h-8 w-8 ${patientUi.icon}`} aria-hidden />
          <p className="mt-3 text-sm font-bold text-patient-text">No notifications in this filter</p>
        </div>
      ) : null}

      <div className={`${patientUi.cardMuted} flex flex-wrap items-center justify-between gap-3`}>
        <p className={`text-sm ${patientUi.bodyMuted}`}>Manage channels and quiet hours in account settings.</p>
        <Link href={PATIENT_ROUTES.profile} className={patientClasses.btnSecondary}>
          <Settings2 className="mr-2 inline h-4 w-4" aria-hidden />
          Notification preferences
        </Link>
      </div>
    </div>
  );
}
