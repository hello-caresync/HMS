'use client';

import Link from 'next/link';
import { useCallback, useMemo, useState } from 'react';
import {
  ArrowRight,
  CalendarDays,
  Clock,
  MapPin,
  Monitor,
  Plus,
  Scissors,
  Stethoscope,
  Users,
  Video,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

import { EmptyClinicalState, LiveIndicator, MetricTile, WeekNavigator, WorkspaceHeader } from '@/components/doctor/primitives/WorkspacePrimitives';
import { useCalendarEvents } from '@/lib/doctor/hooks/useClinicalQueries';
import { mapCalendarEventsToSessions } from '@/lib/doctor/schedule-utils';
import { nx, nxUi, sessionTokens, type SessionCategory } from '@/lib/doctor/design-system';

type ViewMode = 'day' | 'week';
type SessionStatus = 'upcoming' | 'live' | 'completed';

export type ClinicalSession = {
  id: string;
  dayIndex: number;
  start: string;
  end: string;
  title: string;
  category: SessionCategory;
  location: string;
  patientCount?: number;
  status: SessionStatus;
  prepChecklist?: string[];
  actionHref?: string;
  actionLabel?: string;
};

const WEEK_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;
const START_HOUR = 7;
const END_HOUR = 20;
const HOUR_PX = 56;
const COL_GAP = 3;

/** Clinical sessions — structured for consultant workflow, not generic calendar blocks */
const CLINICAL_WEEK: ClinicalSession[] = [
  {
    id: 's-mon-1',
    dayIndex: 0,
    start: '07:30',
    end: '08:30',
    title: 'ICU Ward Round',
    category: 'ward',
    location: 'ICU-2 · 8 beds',
    patientCount: 8,
    status: 'completed',
    prepChecklist: ['Review overnight vitals', 'Check pending labs'],
    actionHref: '/doctor/care-center?tab=ipd',
    actionLabel: 'Open IPD rounds',
  },
  {
    id: 's-mon-2',
    dayIndex: 0,
    start: '09:00',
    end: '12:00',
    title: 'OPD Clinic · General Medicine',
    category: 'opd',
    location: 'OPD Bay 1',
    patientCount: 14,
    status: 'live',
    prepChecklist: ['Review queue', 'Flag high-risk cases'],
    actionHref: '/doctor/care-center',
    actionLabel: 'Open OPD workspace',
  },
  {
    id: 's-mon-3',
    dayIndex: 0,
    start: '12:30',
    end: '13:15',
    title: 'Pre-operative Chart Review',
    category: 'opd',
    location: 'Consultant Room 3',
    patientCount: 1,
    status: 'upcoming',
    actionHref: '/doctor/patients',
    actionLabel: 'Review chart',
  },
  {
    id: 's-mon-4',
    dayIndex: 0,
    start: '14:00',
    end: '16:30',
    title: 'Laparoscopic Cholecystectomy',
    category: 'ot',
    location: 'OT-03',
    patientCount: 1,
    status: 'upcoming',
    prepChecklist: ['Consent verified', 'Antibiotic prophylaxis', 'Anesthesia clearance'],
    actionHref: '/doctor/care-center?tab=ipd',
    actionLabel: 'OT checklist',
  },
  {
    id: 's-tue-1',
    dayIndex: 1,
    start: '09:00',
    end: '11:30',
    title: 'OPD Clinic · Follow-ups',
    category: 'opd',
    location: 'OPD Bay 2',
    patientCount: 11,
    status: 'upcoming',
    actionHref: '/doctor/care-center',
    actionLabel: 'Open OPD workspace',
  },
  {
    id: 's-tue-2',
    dayIndex: 1,
    start: '11:30',
    end: '12:30',
    title: 'Teleconsultation Block',
    category: 'telehealth',
    location: 'Virtual · Nexora Tele',
    patientCount: 4,
    status: 'upcoming',
    actionHref: '/doctor/communication?tab=tele',
    actionLabel: 'Join teleconsult',
  },
  {
    id: 's-wed-1',
    dayIndex: 2,
    start: '08:00',
    end: '09:00',
    title: 'ICU Multidisciplinary Round',
    category: 'ward',
    location: 'ICU-2',
    patientCount: 8,
    status: 'upcoming',
    actionHref: '/doctor/care-center?tab=ipd',
    actionLabel: 'Start ward round',
  },
  {
    id: 's-wed-2',
    dayIndex: 2,
    start: '10:00',
    end: '13:00',
    title: 'Total Knee Replacement',
    category: 'ot',
    location: 'OT-01',
    patientCount: 1,
    status: 'upcoming',
    prepChecklist: ['Implant kit confirmed', 'Blood arranged', 'Physio notified'],
    actionHref: '/doctor/care-center?tab=ipd',
    actionLabel: 'Surgery workspace',
  },
  {
    id: 's-thu-1',
    dayIndex: 3,
    start: '09:00',
    end: '11:30',
    title: 'OPD Clinic',
    category: 'opd',
    location: 'OPD Bay 1',
    patientCount: 12,
    status: 'upcoming',
    actionHref: '/doctor/care-center',
    actionLabel: 'Open OPD workspace',
  },
  {
    id: 's-fri-1',
    dayIndex: 4,
    start: '16:00',
    end: '17:30',
    title: 'Teleconsultation · Chronic Care',
    category: 'telehealth',
    location: 'Virtual',
    patientCount: 3,
    status: 'upcoming',
    actionHref: '/doctor/communication?tab=tele',
    actionLabel: 'Join teleconsult',
  },
  {
    id: 's-sun-1',
    dayIndex: 6,
    start: '08:00',
    end: '18:00',
    title: 'Off Duty · On-Call Roster',
    category: 'leave',
    location: 'Emergency backup only',
    status: 'upcoming',
  },
];

function parseMinutes(t: string) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function sessionIcon(category: SessionCategory) {
  switch (category) {
    case 'opd':
      return Stethoscope;
    case 'ot':
      return Scissors;
    case 'ward':
      return Users;
    case 'telehealth':
      return Video;
    default:
      return CalendarDays;
  }
}

function layoutSessions(sessions: ClinicalSession[]) {
  return sessions.map((s) => {
    const top = ((parseMinutes(s.start) - START_HOUR * 60) / 60) * HOUR_PX;
    const height = Math.max(((parseMinutes(s.end) - parseMinutes(s.start)) / 60) * HOUR_PX - COL_GAP, 44);
    return { ...s, top, height };
  });
}

function SessionBlock({
  session,
  compact,
  onSelect,
  selected,
}: {
  session: ClinicalSession & { top?: number; height?: number };
  compact?: boolean;
  onSelect: (s: ClinicalSession) => void;
  selected?: boolean;
}) {
  const tokens = sessionTokens(session.category);
  const Icon = sessionIcon(session.category);
  const isLive = session.status === 'live';

  return (
    <button
      type="button"
      onClick={() => onSelect(session)}
      className={`group absolute left-1 right-1 flex flex-col overflow-hidden rounded-lg border text-left transition-all ${
        selected ? 'ring-2 ring-[#7A7558] ring-offset-1' : ''
      } ${isLive ? 'shadow-[0_0_0_1px_rgba(16,185,129,0.3),0_4px_12px_rgba(16,185,129,0.15)]' : 'shadow-sm hover:shadow-md'}`}
      style={{
        top: session.top,
        height: session.height,
        backgroundColor: tokens.bg,
        borderColor: isLive ? nx.live : tokens.border + '40',
      }}
    >
      <div className="flex min-h-0 flex-1 flex-col p-2">
        <div className="flex items-center justify-between gap-1">
          <span className="text-[10px] font-semibold tabular-nums text-[#6B6860]">
            {session.start}–{session.end}
          </span>
          {isLive && (
            <span className="flex items-center gap-0.5 rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[9px] font-bold uppercase text-emerald-700">
              <span className="h-1 w-1 rounded-full bg-emerald-500" />
              Now
            </span>
          )}
        </div>
        <div className="mt-0.5 flex items-start gap-1.5">
          <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: tokens.text }} aria-hidden />
          <p
            className="line-clamp-2 text-[12px] font-semibold leading-snug text-[#1C1B18]"
            title={session.title}
          >
            {session.title}
          </p>
        </div>
        {!compact && session.height && session.height > 52 && (
          <div className="mt-auto flex items-center justify-between gap-1 pt-1">
            <span
              className="truncate rounded-md px-1.5 py-0.5 text-[10px] font-medium"
              style={{ backgroundColor: tokens.border + '18', color: tokens.text }}
            >
              {session.location}
            </span>
            {session.patientCount != null && (
              <span className="shrink-0 text-[10px] font-semibold tabular-nums text-[#6B6860]">
                {session.patientCount} pts
              </span>
            )}
          </div>
        )}
      </div>
    </button>
  );
}

function SessionDetailPanel({ session, onClose }: { session: ClinicalSession; onClose: () => void }) {
  const tokens = sessionTokens(session.category);
  const Icon = sessionIcon(session.category);
  const durationMin = parseMinutes(session.end) - parseMinutes(session.start);

  return (
    <aside className={`${nxUi.shellGlass} flex w-full flex-col lg:w-[340px]`}>
      <div className="flex items-start justify-between border-b border-[rgba(28,27,24,0.08)] p-4">
        <div className="flex gap-3">
          <span className="rounded-xl p-2.5" style={{ backgroundColor: tokens.bg, color: tokens.text }}>
            <Icon className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#9C9890]">
              {session.category === 'opd'
                ? 'Outpatient'
                : session.category === 'ot'
                  ? 'Operating Theatre'
                  : session.category === 'ward'
                    ? 'Inpatient Round'
                    : session.category === 'telehealth'
                      ? 'Teleconsultation'
                      : 'Blocked'}
            </p>
            <h2 className="mt-0.5 text-[16px] font-semibold leading-snug text-[#1C1B18]">{session.title}</h2>
          </div>
        </div>
        <button type="button" onClick={onClose} className={nxUi.btnGhost + ' !p-1.5'} aria-label="Close">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        <div className="grid grid-cols-2 gap-3">
          <div className={nxUi.card + ' p-3'}>
            <p className="text-[10px] font-medium uppercase text-[#9C9890]">Time</p>
            <p className="mt-1 text-[13px] font-semibold tabular-nums">
              {session.start} – {session.end}
            </p>
            <p className="text-[11px] text-[#6B6860]">{durationMin} min block</p>
          </div>
          <div className={nxUi.card + ' p-3'}>
            <p className="text-[10px] font-medium uppercase text-[#9C9890]">Location</p>
            <p className="mt-1 flex items-center gap-1 text-[13px] font-semibold">
              <MapPin className="h-3.5 w-3.5 text-[#7A7558]" aria-hidden />
              {session.location}
            </p>
          </div>
        </div>

        {session.patientCount != null && (
          <div className={nxUi.card + ' flex items-center justify-between p-3'}>
            <span className="text-[13px] text-[#6B6860]">Patients scheduled</span>
            <span className="text-[18px] font-semibold tabular-nums">{session.patientCount}</span>
          </div>
        )}

        {session.prepChecklist && session.prepChecklist.length > 0 && (
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-[#9C9890]">Pre-session checklist</p>
            <ul className="space-y-1.5">
              {session.prepChecklist.map((item) => (
                <li key={item} className="flex items-center gap-2 rounded-lg bg-[#F3F2ED] px-3 py-2 text-[12px]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#7A7558]" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {session.actionHref && (
        <div className="border-t border-[rgba(28,27,24,0.08)] p-4">
          <Link href={session.actionHref} className={nxUi.btnPrimary + ' w-full'}>
            {session.actionLabel ?? 'Open workspace'}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      )}
    </aside>
  );
}

export default function ScheduleHub() {
  const { data: apiEvents } = useCalendarEvents();
  const [view, setView] = useState<ViewMode>('week');
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDay, setSelectedDay] = useState(0);
  const [selectedSession, setSelectedSession] = useState<ClinicalSession | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<SessionCategory | 'all'>('all');

  const todayIndex = useMemo(() => {
    const d = new Date().getDay();
    return d === 0 ? 6 : d - 1;
  }, []);

  const weekStart = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - todayIndex + weekOffset * 7);
    return d;
  }, [todayIndex, weekOffset]);

  const weekLabel = useMemo(() => {
    const end = new Date(weekStart);
    end.setDate(end.getDate() + 6);
    const fmt = (x: Date) => x.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    return `${fmt(weekStart)} – ${fmt(end)}`;
  }, [weekStart]);

  const { data: calendarData } = useCalendarEvents();

  const sessions = useMemo(() => {
    const apiSessions = mapCalendarEventsToSessions(calendarData?.events ?? [], weekStart);
    const base = apiSessions.length > 0 ? apiSessions : CLINICAL_WEEK;
    if (categoryFilter === 'all') return base;
    return base.filter((s) => s.category === categoryFilter);
  }, [categoryFilter, calendarData?.events, weekStart]);

  const todaySessions = useMemo(
    () => sessions.filter((s) => s.dayIndex === todayIndex && s.category !== 'leave'),
    [sessions, todayIndex],
  );

  const liveSession = useMemo(() => sessions.find((s) => s.status === 'live'), [sessions]);
  const nextSession = useMemo(() => {
    const now = 13 * 60 + 45;
    return sessions
      .filter((s) => s.dayIndex === todayIndex && s.status === 'upcoming' && parseMinutes(s.start) > now)
      .sort((a, b) => parseMinutes(a.start) - parseMinutes(b.start))[0];
  }, [sessions, todayIndex]);

  const stats = useMemo(() => {
    const hours = todaySessions.reduce((s, e) => s + (parseMinutes(e.end) - parseMinutes(e.start)) / 60, 0);
    const patients = todaySessions.reduce((s, e) => s + (e.patientCount ?? 0), 0);
    return { sessions: todaySessions.length, hours: hours.toFixed(1), patients };
  }, [todaySessions]);

  const visibleDays = view === 'day' ? [selectedDay] : WEEK_LABELS.map((_, i) => i);
  const gridHeight = (END_HOUR - START_HOUR) * HOUR_PX;
  const hours = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i);

  /** Current time indicator — demo at 13:45 Monday */
  const nowLineTop = ((13 * 60 + 45 - START_HOUR * 60) / 60) * HOUR_PX;

  const goToday = useCallback(() => setWeekOffset(0), []);

  return (
    <div className={nxUi.page}>
      <WorkspaceHeader
        eyebrow="Clinical operations"
        title="Schedule & availability"
        description="Your week at a glance — OPD blocks, OT, ward rounds, and teleconsults. Tap any session to open the clinical workspace."
        actions={
          <>
            <WeekNavigator
              label={weekLabel}
              onPrev={() => setWeekOffset((w) => w - 1)}
              onNext={() => setWeekOffset((w) => w + 1)}
              onToday={goToday}
            />
            <div className={nxUi.segmentTrack}>
              {(['week', 'day'] as ViewMode[]).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setView(v)}
                  className={view === v ? nxUi.segmentActive : nxUi.segmentIdle}
                >
                  {v === 'week' ? 'Week' : 'Day'}
                </button>
              ))}
            </div>
            <button type="button" className={nxUi.btnSecondary} onClick={() => toast.success('Availability synced to hospital')}>
              <Plus className="h-4 w-4" aria-hidden />
              Block time
            </button>
          </>
        }
      />

      {/* Today pulse strip */}
      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricTile label="Today's sessions" value={stats.sessions} sub={`${stats.hours}h clinical time`} icon={CalendarDays} />
        <MetricTile label="Patients scheduled" value={stats.patients} sub="Across OPD + tele" icon={Users} accent="live" />
        <MetricTile
          label="API sync"
          value={apiEvents?.events?.length ?? 0}
          sub="Calendar events from EMR"
          icon={Monitor}
        />
        {liveSession ? (
          <MetricTile
            label="In progress"
            value={liveSession.title.slice(0, 20) + (liveSession.title.length > 20 ? '…' : '')}
            sub={liveSession.location}
            accent="live"
            icon={Clock}
            onClick={() => setSelectedSession(liveSession)}
          />
        ) : nextSession ? (
          <MetricTile
            label="Up next"
            value={nextSession.start}
            sub={nextSession.title}
            icon={ArrowRight}
            onClick={() => setSelectedSession(nextSession)}
          />
        ) : (
          <MetricTile label="Status" value="Clear" sub="No active session" icon={Clock} />
        )}
      </div>

      {/* Category filter */}
      <div className="mb-4 flex flex-wrap gap-1.5">
        {(
          [
            ['all', 'All sessions'],
            ['opd', 'OPD'],
            ['ot', 'OT / Surgery'],
            ['ward', 'Ward rounds'],
            ['telehealth', 'Telehealth'],
            ['leave', 'Blocked'],
          ] as const
        ).map(([id, label]) => {
          const active = categoryFilter === id;
          const tok = id !== 'all' ? sessionTokens(id) : null;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setCategoryFilter(id)}
              className={`rounded-full px-3 py-1.5 text-[12px] font-semibold transition ${
                active ? 'bg-[#1C1B18] text-white' : 'bg-white text-[#6B6860] hover:bg-[#F3F2ED]'
              }`}
              style={active && tok ? { backgroundColor: tok.text, color: 'white' } : undefined}
            >
              {label}
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-4 lg:flex-row">
        {/* Calendar grid */}
        <div className={`${nxUi.shell} min-w-0 flex-1 overflow-hidden`}>
          {view === 'day' && (
            <div className="flex gap-1 border-b border-[rgba(28,27,24,0.08)] px-3 py-2">
              {WEEK_LABELS.map((label, idx) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setSelectedDay(idx)}
                  className={`rounded-lg px-3 py-1.5 text-[12px] font-semibold ${
                    selectedDay === idx ? 'bg-[#1C1B18] text-white' : 'text-[#6B6860] hover:bg-[#F3F2ED]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}

          <div className="overflow-x-auto">
            <div
              className="grid min-w-[720px]"
              style={{
                gridTemplateColumns: `48px repeat(${visibleDays.length}, minmax(100px, 1fr))`,
                gridTemplateRows: `36px ${gridHeight}px`,
              }}
            >
              {/* Day headers */}
              <div className="border-b border-[rgba(28,27,24,0.08)] bg-[#FAFAF8]" />
              {visibleDays.map((dayIdx) => {
                const date = new Date(weekStart);
                date.setDate(date.getDate() + dayIdx);
                const isToday = dayIdx === todayIndex && weekOffset === 0;
                return (
                  <div
                    key={`h-${dayIdx}`}
                    className={`border-b border-l border-[rgba(28,27,24,0.08)] px-2 py-2 text-center ${
                      isToday ? 'bg-[#7A7558]/8' : 'bg-[#FAFAF8]'
                    }`}
                  >
                    <p className="text-[11px] font-semibold uppercase text-[#9C9890]">{WEEK_LABELS[dayIdx]}</p>
                    <p className={`text-[14px] font-semibold tabular-nums ${isToday ? 'text-[#7A7558]' : 'text-[#1C1B18]'}`}>
                      {date.getDate()}
                    </p>
                    {isToday && <LiveIndicator label="Today" />}
                  </div>
                );
              })}

              {/* Time gutter */}
              <div className="relative border-r border-[rgba(28,27,24,0.06)]" style={{ height: gridHeight }}>
                {hours.map((h) => (
                  <div
                    key={h}
                    className="flex items-start justify-end border-t border-[rgba(28,27,24,0.06)] pr-2 pt-0.5 text-[10px] font-medium tabular-nums text-[#9C9890]"
                    style={{ height: HOUR_PX }}
                  >
                    {String(h).padStart(2, '0')}:00
                  </div>
                ))}
              </div>

              {/* Day columns */}
              {visibleDays.map((dayIdx) => {
                const daySessions = layoutSessions(sessions.filter((s) => s.dayIndex === dayIdx));
                const isToday = dayIdx === todayIndex && weekOffset === 0;

                return (
                  <div
                    key={`col-${dayIdx}`}
                    className={`relative border-l border-[rgba(28,27,24,0.06)] ${isToday ? 'bg-[#7A7558]/4' : ''}`}
                    style={{ height: gridHeight }}
                  >
                    {hours.map((h) => (
                      <div key={h} className="border-t border-[rgba(28,27,24,0.06)]" style={{ height: HOUR_PX }} />
                    ))}

                    {isToday && weekOffset === 0 && (
                      <div
                        className="pointer-events-none absolute left-0 right-0 z-10 flex items-center"
                        style={{ top: nowLineTop }}
                      >
                        <span className="h-2 w-2 rounded-full bg-[#DC2626]" />
                        <span className="h-[2px] flex-1 bg-[#DC2626]/80" />
                      </div>
                    )}

                    {daySessions.map((s) => (
                      <SessionBlock
                        key={s.id}
                        session={s}
                        onSelect={setSelectedSession}
                        selected={selectedSession?.id === s.id}
                        compact={view === 'week' && visibleDays.length > 3}
                      />
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Detail panel */}
        {selectedSession ? (
          <SessionDetailPanel session={selectedSession} onClose={() => setSelectedSession(null)} />
        ) : (
          <div className={`${nxUi.shell} hidden w-[340px] flex-col p-5 lg:flex`}>
            <p className="text-[13px] font-semibold text-[#1C1B18]">Session details</p>
            <p className="mt-2 text-[12px] leading-relaxed text-[#6B6860]">
              Select a session to view location, patient load, prep checklist, and jump directly into the clinical workspace.
            </p>
            {liveSession && (
              <button type="button" className={`${nxUi.btnPrimary} mt-4 w-full`} onClick={() => setSelectedSession(liveSession)}>
                View active session
              </button>
            )}
          </div>
        )}
      </div>

      {sessions.length === 0 && (
        <EmptyClinicalState
          icon={CalendarDays}
          title="No sessions this week"
          description="Your clinical blocks sync from hospital scheduling. Block time for leave or add OT sessions."
        />
      )}
    </div>
  );
}
