'use client';

import { useMemo, useState } from 'react';

import { ClinicalPageSkeleton } from '@/components/doctor/ClinicalSkeleton';
import { ClinicalPageHeader } from '@/components/doctor/doctor-ui';
import { useCalendarEvents } from '@/lib/doctor/hooks/useClinicalQueries';
import { CALENDAR_EVENT_COLORS } from '@/lib/mock-data';
import { clinicalClasses } from '@/lib/doctor/theme';

type ViewMode = 'day' | 'week' | 'month';

const HOURS = Array.from({ length: 12 }, (_, i) => i + 7);
const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function ClinicalCalendar() {
  const { data, isLoading, isError } = useCalendarEvents();
  const [view, setView] = useState<ViewMode>('week');
  const [location, setLocation] = useState('Clinic 2');
  const [blocked, setBlocked] = useState<string[]>([]);

  const events = data?.events ?? [];

  const toggleBlock = (slot: string) => {
    setBlocked((b) => (b.includes(slot) ? b.filter((s) => s !== slot) : [...b, slot]));
  };

  const eventsByHour = useMemo(() => {
    const map = new Map<number, typeof events>();
    for (const e of events) {
      const h = new Date(e.start).getHours();
      const list = map.get(h) ?? [];
      list.push(e);
      map.set(h, list);
    }
    return map;
  }, [events]);

  if (isLoading) return <ClinicalPageSkeleton rows={5} />;
  if (isError) return <p className="text-sm text-[#EF4444]">Calendar unavailable — check DATABASE_URL</p>;

  return (
    <div className={clinicalClasses.pageBg}>
      <ClinicalPageHeader
        title="Clinical Calendar"
        subtitle="Appointments & surgeries from database"
        actions={
          <div className="flex gap-2">
            {(['day', 'week', 'month'] as ViewMode[]).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                className={`rounded-lg px-3 py-1 text-xs font-bold capitalize ${view === v ? 'bg-[#0D9488] text-white' : 'border bg-white'}`}
              >
                {v}
              </button>
            ))}
          </div>
        }
      />

      <div className="mb-4 flex flex-wrap gap-2 text-xs">
        {Object.entries(CALENDAR_EVENT_COLORS).map(([type, cls]) => (
          <span key={type} className={`rounded px-2 py-0.5 text-white ${cls}`}>
            {type}
          </span>
        ))}
      </div>

      <select value={location} onChange={(e) => setLocation(e.target.value)} className="mb-4 rounded-lg border px-2 py-1 text-sm">
        <option>Clinic 2</option>
        <option>Virtual</option>
        <option>OT Block</option>
      </select>

      {(view === 'day' || view === 'week') && (
        <div className={`${clinicalClasses.card} overflow-x-auto p-4`}>
          <div className={`grid gap-2 ${view === 'week' ? 'min-w-[700px] grid-cols-8' : 'grid-cols-2'}`}>
            <div />
            {(view === 'week' ? weekDays : ['Today']).map((d) => (
              <div key={d} className="text-center text-xs font-bold">
                {d}
              </div>
            ))}
            {HOURS.map((h) => (
              <div key={h} className="contents">
                <div className="text-right text-xs text-[#64748B]">{h}:00</div>
                {(view === 'week' ? weekDays : ['Today']).map((d) => {
                  const slot = `${d}-${h}`;
                  const evs = eventsByHour.get(h) ?? [];
                  return (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => toggleBlock(slot)}
                      className={`min-h-[48px] rounded border p-1 text-left text-[10px] ${blocked.includes(slot) ? 'bg-slate-200 line-through' : ''}`}
                    >
                      {evs.map((e) => (
                        <span key={e.id} className={`mb-0.5 block truncate rounded px-1 text-white ${CALENDAR_EVENT_COLORS[e.type as keyof typeof CALENDAR_EVENT_COLORS] ?? 'bg-slate-400'}`}>
                          {e.title}
                        </span>
                      ))}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      {view === 'month' && (
        <div className={`${clinicalClasses.card} p-4`}>
          <ul className="space-y-2 text-sm">
            {events.map((e) => (
              <li key={e.id}>
                {new Date(e.start).toLocaleString('en-IN')} · {e.title} · {e.location}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
