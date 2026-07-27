import type { CalendarEventDto } from '@/lib/doctor/client/clinical-data-service';
import type { SessionCategory } from '@/lib/doctor/design-system';

export type MappedClinicalSession = {
  id: string;
  dayIndex: number;
  start: string;
  end: string;
  title: string;
  category: SessionCategory;
  location: string;
  patientCount?: number;
  status: 'upcoming' | 'live' | 'completed';
  actionHref?: string;
  actionLabel?: string;
};

function formatTime(d: Date): string {
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function dayIndexFromDate(d: Date, weekStart: Date): number {
  const diff = Math.floor((d.getTime() - weekStart.getTime()) / 86400000);
  return Math.max(0, Math.min(6, diff));
}

function mapEventType(type: string): SessionCategory {
  if (type === 'OT') return 'ot';
  if (type === 'TELE') return 'telehealth';
  if (type === 'IPD') return 'ward';
  return 'opd';
}

function deriveStatus(start: Date, end: Date): 'upcoming' | 'live' | 'completed' {
  const now = Date.now();
  if (now < start.getTime()) return 'upcoming';
  if (now > end.getTime()) return 'completed';
  return 'live';
}

export function mapCalendarEventsToSessions(
  events: CalendarEventDto[],
  weekStart: Date,
): MappedClinicalSession[] {
  return events
    .map((e) => {
      const start = new Date(e.start);
      const end = new Date(e.end);
      const dayIndex = dayIndexFromDate(start, weekStart);
      if (dayIndex < 0 || dayIndex > 6) return null;

      const category = mapEventType(e.type);
      const session: MappedClinicalSession = {
        id: e.id,
        dayIndex,
        start: formatTime(start),
        end: formatTime(end),
        title: e.title,
        category,
        location: e.location,
        patientCount: 1,
        status: deriveStatus(start, end),
        actionHref:
          category === 'opd'
            ? '/doctor/opd-consultation'
            : category === 'telehealth'
              ? '/doctor/telemedicine'
              : category === 'ot'
                ? '/doctor/surgery-management'
                : '/doctor/ipd-management',
        actionLabel: 'Open workspace',
      };
      return session;
    })
    .filter((s): s is MappedClinicalSession => s !== null);
}
